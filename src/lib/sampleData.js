import { buildSampleProducts, DEFAULT_SETTINGS } from './constants'
import { dateKey, uid } from './format'

const CASHIERS = [
  { uid: 'u-sari', name: 'Sari' },
  { uid: 'u-budi', name: 'Budi' },
  { uid: 'u-rina', name: 'Rina' },
]

const CUSTOMERS = ['', '', '', '', 'Andi', 'Dewi', 'Fajar', 'Nadia', 'Rizky', 'Umum']

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickPayment() {
  const roll = Math.random()
  if (roll < 0.46) return 'cash'
  if (roll < 0.8) return 'qris'
  if (roll < 0.92) return 'transfer'
  return 'card'
}

/**
 * Membuat riwayat transaksi demo ±45 hari terakhir agar dashboard dan
 * laporan langsung terisi. Dipakai hanya oleh adapter demo.
 */
export function generateDemoSales(products, settings = DEFAULT_SETTINGS) {
  const sales = []
  let counter = 1000
  const now = new Date()

  for (let dayOffset = 44; dayOffset >= 0; dayOffset -= 1) {
    const base = new Date(now)
    base.setDate(base.getDate() - dayOffset)
    const isWeekend = [0, 6].includes(base.getDay())
    const txCount = randomInt(isWeekend ? 10 : 6, isWeekend ? 18 : 14)

    for (let i = 0; i < txCount; i += 1) {
      const createdAt = new Date(base)
      if (dayOffset === 0) {
        const start = new Date(base)
        start.setHours(8, 0, 0, 0)
        const span = Math.max(60_000, now.getTime() - start.getTime())
        createdAt.setTime(start.getTime() + Math.floor(Math.random() * span))
      } else {
        createdAt.setHours(randomInt(8, 21), randomInt(0, 59), randomInt(0, 59), 0)
      }

      const itemCount = randomInt(1, 4)
      const chosen = new Set()
      const items = []

      for (let j = 0; j < itemCount; j += 1) {
        const product = pick(products)
        if (!product || chosen.has(product.id)) continue
        chosen.add(product.id)
        const qty = Math.random() < 0.78 ? 1 : randomInt(2, 3)
        items.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          emoji: product.emoji,
          category: product.category,
          price: product.price,
          cost: product.cost,
          qty,
          subtotal: product.price * qty,
        })
      }

      if (!items.length) continue

      counter += 1
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
      const discount = Math.random() < 0.12 ? randomInt(1, 3) * 1000 : 0
      const taxEnabled = settings.taxEnabled && settings.taxRate > 0
      const tax = taxEnabled ? Math.round(((subtotal - discount) * settings.taxRate) / 100) : 0
      const total = subtotal - discount + tax
      const paymentMethod = pickPayment()
      const paid = paymentMethod === 'cash' ? Math.ceil(total / 5000) * 5000 : total
      const cashier = pick(CASHIERS)
      const isVoid = Math.random() < 0.015

      sales.push({
        id: `demo-${uid()}`,
        invoiceNo: `INV-${dateKey(createdAt).replaceAll('-', '')}-${String(counter).padStart(4, '0')}`,
        items,
        subtotal,
        discount,
        taxRate: taxEnabled ? settings.taxRate : 0,
        tax,
        total,
        paid,
        change: Math.max(0, paid - total),
        paymentMethod,
        customerName: pick(CUSTOMERS),
        note: '',
        cashierId: cashier.uid,
        cashierName: cashier.name,
        status: isVoid ? 'void' : 'paid',
        createdAt: createdAt.toISOString(),
        dateKey: dateKey(createdAt),
        voidedAt: isVoid ? new Date(createdAt.getTime() + 3600_000).toISOString() : null,
        voidReason: isVoid ? 'Pesanan dibatalkan pelanggan' : '',
      })
    }
  }

  sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return { sales, counter }
}

export function createDemoStore() {
  const products = buildSampleProducts()
  const { sales, counter } = generateDemoSales(products, DEFAULT_SETTINGS)
  return {
    version: 1,
    products,
    sales,
    settings: { ...DEFAULT_SETTINGS },
    counter,
    seededAt: new Date().toISOString(),
  }
}
