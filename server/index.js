import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import admin from 'firebase-admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const PORT = Number(process.env.PORT) || 8787

/* ── Firebase Admin (opsional) ─────────────────────────────────────
 * Aktif hanya jika FIREBASE_SERVICE_ACCOUNT diisi, baik sebagai path
 * file JSON maupun JSON mentah. Tanpa kredensial, endpoint data
 * mengembalikan 503 sedangkan frontend statis tetap dilayani.
 * ---------------------------------------------------------------- */
let db = null
let initError = ''

function readServiceAccount() {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
  if (!raw) return null
  if (raw.startsWith('{')) return JSON.parse(raw)
  const filePath = path.isAbsolute(raw) ? raw : path.resolve(rootDir, raw)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

try {
  const credentials = readServiceAccount()
  if (credentials) {
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(credentials) })
    }
    db = admin.firestore()
    console.log('[api] Firebase Admin siap — Firestore aktif.')
  } else {
    console.log('[api] FIREBASE_SERVICE_ACCOUNT kosong — endpoint data dinonaktifkan.')
  }
} catch (error) {
  initError = error.message
  console.error('[api] Gagal memuat service account:', error.message)
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

function requireDb(res) {
  if (db) return true
  res.status(503).json({
    error: 'Firestore belum dikonfigurasi di server.',
    detail:
      initError || 'Isi FIREBASE_SERVICE_ACCOUNT pada .env dengan path file service account.',
  })
  return false
}

function localDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultRange() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 29)
  return { from: localDateKey(start), to: localDateKey(now) }
}

function toIso(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return value
}

function serializeSale(id, data) {
  return {
    id,
    ...data,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    voidedAt: toIso(data.voidedAt),
  }
}

function summarizeSales(sales) {
  const summary = {
    count: 0,
    voidCount: 0,
    items: 0,
    gross: 0,
    revenue: 0,
    cogs: 0,
    profit: 0,
    tax: 0,
    discount: 0,
    average: 0,
  }

  for (const sale of sales) {
    if (sale.status === 'void') {
      summary.voidCount += 1
      continue
    }
    const items = Array.isArray(sale.items) ? sale.items : []
    const subtotal = Number(sale.subtotal) || 0
    const discount = Number(sale.discount) || 0
    const tax = Number(sale.tax) || 0
    const revenue = subtotal - discount
    const cogs = items.reduce(
      (sum, item) => sum + (Number(item.cost) || 0) * (Number(item.qty) || 0),
      0,
    )
    const qty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)

    summary.count += 1
    summary.items += qty
    summary.gross += Number(sale.total) || revenue + tax
    summary.revenue += revenue
    summary.cogs += cogs
    summary.profit += revenue - cogs
    summary.tax += tax
    summary.discount += discount
  }

  summary.average = summary.count > 0 ? Math.round(summary.revenue / summary.count) : 0
  return summary
}

app.get('/api/health', (request, response) => {
  response.json({
    ok: true,
    service: 'e-cash-api',
    firestore: Boolean(db),
    time: new Date().toISOString(),
  })
})

app.get('/api/receipt/:id', async (request, response) => {
  if (!requireDb(response)) return
  try {
    const snapshot = await db.collection('sales').doc(request.params.id).get()
    if (!snapshot.exists) {
      response.status(404).json({ error: 'Transaksi tidak ditemukan.' })
      return
    }
    response.json(serializeSale(snapshot.id, snapshot.data()))
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.get('/api/reports/summary', async (request, response) => {
  if (!requireDb(response)) return
  const fallback = defaultRange()
  const from = String(request.query.from || fallback.from)
  const to = String(request.query.to || fallback.to)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    response.status(400).json({ error: 'Format tanggal harus YYYY-MM-DD.' })
    return
  }

  try {
    const snapshot = await db
      .collection('sales')
      .where('dateKey', '>=', from)
      .where('dateKey', '<=', to)
      .get()

    const sales = snapshot.docs.map((doc) => doc.data())
    const summary = summarizeSales(sales)

    const payments = {}
    const products = new Map()
    for (const sale of sales) {
      if (sale.status === 'void') continue
      const method = sale.paymentMethod || 'cash'
      payments[method] = (payments[method] || 0) + (Number(sale.total) || 0)
      for (const item of sale.items || []) {
        const key = item.productId || item.name
        const current = products.get(key) || {
          productId: item.productId,
          name: item.name,
          emoji: item.emoji || '📦',
          qty: 0,
          revenue: 0,
          profit: 0,
        }
        const qty = Number(item.qty) || 0
        const revenue = (Number(item.price) || 0) * qty
        current.qty += qty
        current.revenue += revenue
        current.profit += revenue - (Number(item.cost) || 0) * qty
        products.set(key, current)
      }
    }

    const settingsSnapshot = await db.collection('settings').doc('store').get()
    response.json({
      range: { from, to },
      summary,
      payments,
      topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      store: settingsSnapshot.exists ? settingsSnapshot.data() : null,
    })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.use('/api', (request, response) => {
  response.status(404).json({ error: 'Endpoint tidak ditemukan.' })
})

/* ── Frontend hasil build ────────────────────────────────────────── */
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: '1h', index: false }))
  app.get('*', (request, response, next) => {
    if (request.path.includes('.')) return next()
    response.sendFile(path.join(distDir, 'index.html'))
  })
} else {
  app.get('/', (request, response) => {
    response
      .status(200)
      .type('text/plain')
      .send('E-Cash API aktif. Jalankan `npm run build` lalu restart server untuk menyajikan frontend.')
  })
}

app.listen(PORT, () => {
  console.log(`[api] E-Cash berjalan di http://localhost:${PORT}`)
})
