import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { buildSampleProducts, DEFAULT_SETTINGS } from './constants'
import { dateKey, toDate } from './format'

const SALES_LIMIT = 1000

function mapDocs(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

function sortProducts(list) {
  return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name), 'id'))
}

function sortSales(list) {
  return [...list].sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
}

export function subscribeProducts(callback) {
  const q = query(collection(db, 'products'), orderBy('name', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => callback(sortProducts(mapDocs(snapshot))),
    (error) => {
      console.error('[e-cash] subscribeProducts', error)
      callback([])
    },
  )
}

export function subscribeSales(callback) {
  const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(SALES_LIMIT))
  return onSnapshot(
    q,
    (snapshot) => callback(sortSales(mapDocs(snapshot))),
    (error) => {
      console.error('[e-cash] subscribeSales', error)
      callback([])
    },
  )
}

export function subscribeSettings(callback) {
  return onSnapshot(
    doc(db, 'settings', 'store'),
    (snapshot) => callback({ ...DEFAULT_SETTINGS, ...(snapshot.exists() ? snapshot.data() : {}) }),
    (error) => {
      console.error('[e-cash] subscribeSettings', error)
      callback(DEFAULT_SETTINGS)
    },
  )
}

export async function createProduct(input) {
  const ref = await addDoc(collection(db, 'products'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateProduct(id, input) {
  await updateDoc(doc(db, 'products', id), { ...input, updatedAt: serverTimestamp() })
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', id))
}

export async function adjustStock(productId, delta, options = {}) {
  const quantity = Number(delta)
  if (!Number.isFinite(quantity) || quantity === 0) throw new Error('Jumlah stok tidak valid.')
  const productRef = doc(db, 'products', productId)
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(productRef)
    if (!snapshot.exists()) throw new Error('Produk tidak ditemukan.')
    const product = snapshot.data()
    const before = Number(product.stock) || 0
    const after = before + quantity
    if (after < 0) throw new Error('Stok tidak boleh negatif.')
    tx.update(productRef, { stock: after, updatedAt: serverTimestamp() })
    tx.set(doc(collection(db, 'stockMoves')), {
      productId,
      productName: product.name,
      type: options.type || 'restock',
      qty: quantity,
      before,
      after,
      ref: options.ref || '',
      note: options.note || '',
      userId: options.userId || '',
      createdAt: serverTimestamp(),
    })
  })
}

export async function createSale(input) {
  const items = Array.isArray(input.items) ? input.items : []
  if (!items.length) throw new Error('Keranjang masih kosong.')

  const saleRef = doc(collection(db, 'sales'))
  const counterRef = doc(db, 'counters', 'sales')
  const cashier = input.cashier || {}
  let created = null

  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef)
    const seq = (counterSnap.exists() ? Number(counterSnap.data().seq) || 0 : 0) + 1

    const entries = []
    for (const line of items) {
      const productRef = doc(db, 'products', String(line.productId))
      const snapshot = await tx.get(productRef)
      if (!snapshot.exists()) throw new Error('Ada produk yang sudah tidak tersedia.')
      entries.push({ productRef, snapshot, qty: Number(line.qty) })
    }

    const saleItems = entries.map(({ snapshot, qty }) => {
      const product = snapshot.data()
      if (!(qty > 0)) throw new Error('Jumlah item tidak valid.')
      if (Number(product.stock) < qty) {
        throw new Error(`Stok ${product.name} tersisa ${product.stock}.`)
      }
      return {
        productId: snapshot.id,
        name: product.name,
        sku: product.sku || '',
        emoji: product.emoji || '📦',
        category: product.category || 'Lainnya',
        price: Number(product.price) || 0,
        cost: Number(product.cost) || 0,
        qty,
        subtotal: (Number(product.price) || 0) * qty,
      }
    })

    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0)
    const diskon = Math.max(0, Number(input.discount) || 0)
    if (diskon > subtotal) throw new Error('Diskon melebihi subtotal.')
    const taxRate = Math.min(100, Math.max(0, Number(input.taxRate) || 0))
    const tax = Math.round(((subtotal - diskon) * taxRate) / 100)
    const shipping = Math.max(0, Number(input.shipping) || 0)
    const method = ['cash', 'qris', 'transfer', 'card', 'rumah'].includes(input.paymentMethod)
      ? input.paymentMethod
      : 'cash'
    const totalCost = saleItems.reduce((sum, item) => sum + (Number(item.cost) || 0) * item.qty, 0)
    const isRumah = method === 'rumah'
    const rumahPricing = input.rumahPricing || 'free'
    
    // Perhitungan total: jika ambil rumah dan free => 0, jika modal => totalCost, selain itu normal
    const total = isRumah
      ? rumahPricing === 'free'
        ? 0
        : rumahPricing === 'cost'
          ? totalCost
          : Math.max(0, subtotal - diskon + tax + shipping)
      : Math.max(0, subtotal - diskon + tax + shipping)

    const paid = isRumah
      ? rumahPricing === 'free'
        ? 0
        : Number(input.paid) >= 0
          ? Number(input.paid)
          : total
      : method === 'cash'
        ? Number(input.paid) || 0
        : total

    if (!isRumah && paid < total) throw new Error('Nominal pembayaran kurang dari total.')
    const now = new Date()
    const invoiceNo = `INV-${dateKey(now).replaceAll('-', '')}-${String(seq).padStart(4, '0')}`

    const payload = {
      invoiceNo,
      items: saleItems,
      subtotal,
      discount: diskon,
      taxRate,
      tax,
      shipping,
      total,
      paid,
      change: Math.max(0, paid - total),
      paymentMethod: method,
      rumahPricing: isRumah ? rumahPricing : null,
      customerName: String(input.customerName || (isRumah ? 'Owner (Rumah)' : '')).trim(),
      note: String(input.note || (isRumah ? 'Ambilan Rumah / Owner' : '')).trim(),
      cashierId: cashier.uid || '',
      cashierName: cashier.name || 'Kasir',
      status: 'paid',
      createdAt: serverTimestamp(),
      dateKey: dateKey(now),
      voidedAt: null,
      voidReason: '',
    }

    tx.set(counterRef, { seq }, { merge: true })
    tx.set(saleRef, payload)

    entries.forEach(({ productRef, snapshot }, index) => {
      const product = snapshot.data()
      const item = saleItems[index]
      const before = Number(product.stock) || 0
      const after = before - item.qty
      tx.update(productRef, { stock: after, updatedAt: serverTimestamp() })
      tx.set(doc(collection(db, 'stockMoves')), {
        productId: item.productId,
        productName: item.name,
        type: isRumah ? 'rumah' : 'sale',
        qty: -item.qty,
        before,
        after,
        ref: invoiceNo,
        note: isRumah ? 'Ambilan Rumah' : '',
        userId: cashier.uid || '',
        createdAt: serverTimestamp(),
      })
    })

    created = { id: saleRef.id, ...payload, createdAt: now }
  })

  return created
}

export async function voidSale(saleId, options = {}) {
  const saleRef = doc(db, 'sales', saleId)
  await runTransaction(db, async (tx) => {
    const saleSnap = await tx.get(saleRef)
    if (!saleSnap.exists()) throw new Error('Transaksi tidak ditemukan.')
    const sale = saleSnap.data()
    if (sale.status === 'void') throw new Error('Transaksi sudah dibatalkan.')

    const restores = []
    for (const item of sale.items || []) {
      const productRef = doc(db, 'products', String(item.productId))
      const snapshot = await tx.get(productRef)
      if (snapshot.exists()) restores.push({ productRef, snapshot, item })
    }

    tx.update(saleRef, {
      status: 'void',
      voidedAt: serverTimestamp(),
      voidReason: String(options.reason || '').trim(),
    })

    restores.forEach(({ productRef, snapshot, item }) => {
      const before = Number(snapshot.data().stock) || 0
      const qty = Number(item.qty) || 0
      const after = before + qty
      tx.update(productRef, { stock: after, updatedAt: serverTimestamp() })
      tx.set(doc(collection(db, 'stockMoves')), {
        productId: item.productId,
        productName: item.name,
        type: 'void',
        qty,
        before,
        after,
        ref: sale.invoiceNo || '',
        note: options.reason || '',
        userId: options.userId || '',
        createdAt: serverTimestamp(),
      })
    })
  })
}

export async function getSale(saleId) {
  const snapshot = await getDoc(doc(db, 'sales', saleId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function saveSettings(next) {
  await setDoc(doc(db, 'settings', 'store'), { ...next, updatedAt: serverTimestamp() }, { merge: true })
}

export async function seedProducts() {
  const existing = await getDocs(query(collection(db, 'products'), limit(1)))
  if (!existing.empty) return 0
  const batch = writeBatch(db)
  for (const sample of buildSampleProducts()) {
    const { id, createdAt, updatedAt, ...data } = sample
    batch.set(doc(collection(db, 'products')), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
  return buildSampleProducts().length
}

export async function resetDemoData() {
  return false
}
