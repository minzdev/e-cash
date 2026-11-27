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

export function subscribeFinanceRecords(callback) {
  const q = query(collection(db, 'financeRecords'), orderBy('createdAt', 'desc'), limit(SALES_LIMIT))
  return onSnapshot(
    q,
    (snapshot) => {
      const records = mapDocs(snapshot).sort((a, b) => {
        const timeA = toDate(a.date || a.createdAt)?.getTime() || 0
        const timeB = toDate(b.date || b.createdAt)?.getTime() || 0
        return timeA - timeB
      })
      callback(records)
    },
    (error) => {
      console.error('[e-cash] subscribeFinanceRecords', error)
      callback([])
    },
  )
}

// ── Sales Persons (Daftar Sales / Pembawa) ───────────────────────────────────
export function subscribeSalesPersons(callback) {
  const q = query(collection(db, 'salesPersons'), orderBy('name', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => callback(mapDocs(snapshot)),
    (error) => {
      console.error('[e-cash] subscribeSalesPersons', error)
      callback([])
    },
  )
}

export async function createSalesPerson(input) {
  const feeRetail = Math.max(0, Number(input.feeRetail ?? input.feePerPcs ?? 5000))
  const feeWholesale = Math.max(0, Number(input.feeWholesale ?? input.feePerPcs ?? 3000))
  const ref = await addDoc(collection(db, 'salesPersons'), {
    name: String(input.name || '').trim(),
    feeRetail,
    feeWholesale,
    feePerPcs: feeWholesale, // fallback backward compatibility
    active: input.active !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateSalesPerson(id, input) {
  const feeRetail = Math.max(0, Number(input.feeRetail ?? input.feePerPcs ?? 5000))
  const feeWholesale = Math.max(0, Number(input.feeWholesale ?? input.feePerPcs ?? 3000))
  await updateDoc(doc(db, 'salesPersons', id), {
    name: String(input.name || '').trim(),
    feeRetail,
    feeWholesale,
    feePerPcs: feeWholesale,
    active: input.active !== false,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteSalesPerson(id) {
  await deleteDoc(doc(db, 'salesPersons', id))
}

export async function createFinanceRecord(input) {
  const ref = await addDoc(collection(db, 'financeRecords'), {
    ...input,
    inDus: Number(input.inDus) || 0,
    outDus: Number(input.outDus) || 0,
    outBnsDus: Number(input.outBnsDus) || 0,
    omzet: Number(input.omzet) || 0,
    magatiFee: Number(input.magatiFee) || 0,
    salesFee: Number(input.salesFee) || 0,
    uangModal: Number(input.uangModal) || 0,
    tfSaldo: Number(input.tfSaldo) || 0,
    cashOut: Number(input.cashOut) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateFinanceRecord(id, input) {
  await updateDoc(doc(db, 'financeRecords', id), {
    ...input,
    inDus: Number(input.inDus) || 0,
    outDus: Number(input.outDus) || 0,
    outBnsDus: Number(input.outBnsDus) || 0,
    omzet: Number(input.omzet) || 0,
    magatiFee: Number(input.magatiFee) || 0,
    salesFee: Number(input.salesFee) || 0,
    uangModal: Number(input.uangModal) || 0,
    tfSaldo: Number(input.tfSaldo) || 0,
    cashOut: Number(input.cashOut) || 0,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteFinanceRecord(id) {
  await deleteDoc(doc(db, 'financeRecords', id))
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

    const wholesaleThreshold = Number(input.wholesaleMinQty) || 20
    const rawTotalQty = items.reduce((sum, line) => sum + (Number(line.qty) || 0), 0)
    const isGrosir = input.priceTier === 'wholesale' || (input.priceTier !== 'retail' && rawTotalQty >= wholesaleThreshold)

    const saleItems = entries.map(({ snapshot, qty }) => {
      const product = snapshot.data()
      if (!(qty > 0)) throw new Error('Jumlah item tidak valid.')
      if (Number(product.stock) < qty) {
        throw new Error(`Stok ${product.name} tersisa ${product.stock}.`)
      }

      // Tiering harga eceran vs grosir: jika grosir (>=20 pcs) Rp 45.000, eceran Rp 50.000 (atau harga produk)
      const basePrice = Number(product.price) || 50000
      const wholesalePrice = Number(product.wholesalePrice) || (basePrice >= 50000 ? 45000 : basePrice)
      const effectivePrice = isGrosir ? wholesalePrice : basePrice

      return {
        productId: snapshot.id,
        name: product.name,
        sku: product.sku || '',
        emoji: product.emoji || '📦',
        category: product.category || 'Lainnya',
        price: effectivePrice,
        cost: Number(product.cost) || 0,
        qty,
        subtotal: effectivePrice * qty,
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

    const salesPersonId = String(input.salesPersonId || '')
    const salesPersonName = String(input.salesPersonName || '')
    const totalQty = saleItems.reduce((sum, item) => sum + item.qty, 0)

    // Perhitungan Fee Magati otomatis: eceran 5.000/pcs, grosir (>=20) 2.000/pcs
    const magatiRate = isRumah
      ? 0
      : isGrosir
        ? Number(input.magatiFeeWholesale ?? 2000)
        : Number(input.magatiFeeRetail ?? 5000)
    const magatiFee = totalQty * magatiRate

    // Perhitungan Fee Sales otomatis: eceran 5.000/pcs, grosir (>=20) 3.000/pcs
    const salesRate = isRumah
      ? 0
      : isGrosir
        ? Number(input.salesFeeWholesale ?? input.salesFeePerPcs ?? 3000)
        : Number(input.salesFeeRetail ?? input.salesFeePerPcs ?? 5000)
    const salesFee = totalQty * salesRate

    // Uang Modal: jika Tunai diterima admin -> modal terisi. Jika Transfer -> modal tidak masuk (0) karena langsung ke owner
    const isTunai = method === 'cash'
    const isTransfer = method === 'transfer'
    const uangModal = isTunai ? totalCost : 0

    const customerName = String(input.customerName || (isRumah ? 'Owner (Rumah)' : '')).trim()
    let displayCustomerNote = customerName
    if (isTransfer && !displayCustomerNote.toLowerCase().includes('transfer')) {
      displayCustomerNote = displayCustomerNote ? `${displayCustomerNote} (Transfer Owner)` : 'Transfer Owner'
    }

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
      priceTier: isGrosir ? 'grosir' : 'eceran',
      rumahPricing: isRumah ? rumahPricing : null,
      customerName,
      note: String(input.note || (isRumah ? 'Ambilan Rumah / Owner' : '')).trim(),
      cashierId: cashier.uid || '',
      cashierName: cashier.name || 'Kasir',
      salesPersonId,
      salesPersonName,
      magatiFee,
      salesFee,
      uangModal,
      status: 'paid',
      createdAt: serverTimestamp(),
      dateKey: dateKey(now),
      voidedAt: null,
      voidReason: '',
    }

    tx.set(counterRef, { seq }, { merge: true })
    tx.set(saleRef, payload)

    // Auto-create financeRecord agar transaksi masuk ke Buku Kas & Keuangan
    const financeRef = doc(collection(db, 'financeRecords'))
    const keterangan = salesPersonName || input.defaultSalesName || cashier.name || 'Kasir'
    tx.set(financeRef, {
      sourceType: isRumah ? 'rumah' : 'sale',
      sourceId: saleRef.id,
      date: dateKey(now),
      keterangan,
      salesPersonId,
      salesPersonName,
      type: isRumah ? 'rumah' : 'sale',
      paymentMethod: method,
      priceTier: isGrosir ? 'grosir' : 'eceran',
      inDus: 0,
      outDus: totalQty,
      outBnsDus: 0,
      omzet: total,
      magatiFee,
      salesFee,
      uangModal, // Hanya terisi jika Tunai (diterima kasir), 0 jika Transfer (langsung ke owner)
      tfSaldo: 0,
      cashOut: 0,
      customerNote: displayCustomerNote,
      invoiceRef: invoiceNo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

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
