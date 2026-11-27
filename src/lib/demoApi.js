import { buildSampleProducts, DEFAULT_SETTINGS } from './constants'
import { createDemoStore } from './sampleData'
import { dateKey, toDate, uid } from './format'

const STORAGE_KEY = 'ecash:demo:v1'
const listeners = {
  products: new Set(),
  sales: new Set(),
  settings: new Set(),
  financeRecords: new Set(),
  salesPersons: new Set(),
}

let cache = null

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('[e-cash] gagal menyimpan data demo', error)
  }
}

function load() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.sales)) {
        cache = parsed
        return cache
      }
    }
  } catch (error) {
    console.warn('[e-cash] data demo rusak, dibuat ulang', error)
  }
  cache = createDemoStore()
  persist()
  return cache
}

function sortProducts(list) {
  return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name), 'id'))
}

function sortSales(list) {
  return [...list].sort(
    (a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0),
  )
}

function emit(name) {
  const state = load()
  let payload = null
  if (name === 'products') payload = sortProducts(state.products)
  else if (name === 'sales') payload = sortSales(state.sales)
  else if (name === 'settings') payload = { ...DEFAULT_SETTINGS, ...state.settings }
  else if (name === 'financeRecords') {
    payload = [...(state.financeRecords || [])].sort(
      (a, b) => (toDate(a.date || a.createdAt)?.getTime() || 0) - (toDate(b.date || b.createdAt)?.getTime() || 0),
    )
  } else if (name === 'salesPersons') {
    payload = [...(state.salesPersons || [])].sort((a, b) => String(a.name).localeCompare(String(b.name), 'id'))
  }
  listeners[name]?.forEach((callback) => callback(payload))
}

export function subscribeFinanceRecords(callback) {
  const state = load()
  if (!state.financeRecords) {
    state.financeRecords = []
    persist()
  }
  listeners.financeRecords.add(callback)
  const sorted = [...state.financeRecords].sort(
    (a, b) => (toDate(a.date || a.createdAt)?.getTime() || 0) - (toDate(b.date || b.createdAt)?.getTime() || 0),
  )
  callback(sorted)
  return () => listeners.financeRecords.delete(callback)
}

export async function createFinanceRecord(input) {
  const state = load()
  if (!state.financeRecords) state.financeRecords = []
  const now = new Date().toISOString()
  const record = {
    ...input,
    id: uid(),
    inDus: Number(input.inDus) || 0,
    outDus: Number(input.outDus) || 0,
    outBnsDus: Number(input.outBnsDus) || 0,
    omzet: Number(input.omzet) || 0,
    magatiFee: Number(input.magatiFee) || 0,
    salesFee: Number(input.salesFee) || 0,
    uangModal: Number(input.uangModal) || 0,
    tfSaldo: Number(input.tfSaldo) || 0,
    cashOut: Number(input.cashOut) || 0,
    createdAt: now,
    updatedAt: now,
  }
  state.financeRecords.push(record)
  persist()
  emit('financeRecords')
  return record.id
}

export async function updateFinanceRecord(id, input) {
  const state = load()
  if (!state.financeRecords) state.financeRecords = []
  const index = state.financeRecords.findIndex((r) => r.id === id)
  if (index === -1) throw new Error('Data keuangan tidak ditemukan.')
  state.financeRecords[index] = {
    ...state.financeRecords[index],
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
    updatedAt: new Date().toISOString(),
  }
  persist()
  emit('financeRecords')
}

export async function deleteFinanceRecord(id) {
  const state = load()
  if (!state.financeRecords) return
  state.financeRecords = state.financeRecords.filter((r) => r.id !== id)
  persist()
  emit('financeRecords')
}

export function subscribeProducts(callback) {
  load()
  listeners.products.add(callback)
  callback(sortProducts(cache.products))
  return () => listeners.products.delete(callback)
}

export function subscribeSales(callback) {
  load()
  listeners.sales.add(callback)
  callback(sortSales(cache.sales))
  return () => listeners.sales.delete(callback)
}

export function subscribeSettings(callback) {
  load()
  listeners.settings.add(callback)
  callback({ ...DEFAULT_SETTINGS, ...cache.settings })
  return () => listeners.settings.delete(callback)
}

export async function createProduct(input) {
  const state = load()
  const now = new Date().toISOString()
  const product = {
    ...input,
    id: uid(),
    createdAt: now,
    updatedAt: now,
  }
  state.products.push(product)
  persist()
  emit('products')
  return product.id
}

export async function updateProduct(id, input) {
  const state = load()
  const index = state.products.findIndex((product) => product.id === id)
  if (index === -1) throw new Error('Produk tidak ditemukan.')
  state.products[index] = { ...state.products[index], ...input, updatedAt: new Date().toISOString() }
  persist()
  emit('products')
}

export async function deleteProduct(id) {
  const state = load()
  state.products = state.products.filter((product) => product.id !== id)
  persist()
  emit('products')
}

export async function adjustStock(productId, delta, options = {}) {
  const state = load()
  const quantity = Number(delta)
  if (!Number.isFinite(quantity) || quantity === 0) throw new Error('Jumlah stok tidak valid.')
  const product = state.products.find((item) => item.id === productId)
  if (!product) throw new Error('Produk tidak ditemukan.')
  const before = Number(product.stock) || 0
  const after = before + quantity
  if (after < 0) throw new Error('Stok tidak boleh negatif.')
  product.stock = after
  product.updatedAt = new Date().toISOString()
  persist()
  emit('products')
}

export async function createSale(input) {
  const state = load()
  const lines = Array.isArray(input.items) ? input.items : []
  if (!lines.length) throw new Error('Keranjang masih kosong.')

  const wholesaleThreshold = Number(input.wholesaleMinQty) || 20
  const rawTotalQty = lines.reduce((sum, line) => sum + (Number(line.qty) || 0), 0)
  const isGrosir = input.priceTier === 'wholesale' || (input.priceTier !== 'retail' && rawTotalQty >= wholesaleThreshold)

  const saleItems = lines.map((line) => {
    const product = state.products.find((item) => item.id === String(line.productId))
    if (!product) throw new Error('Ada produk yang sudah tidak tersedia.')
    const qty = Number(line.qty)
    if (!(qty > 0)) throw new Error('Jumlah item tidak valid.')
    if (Number(product.stock) < qty) {
      throw new Error(`Stok ${product.name} tersisa ${product.stock}.`)
    }

    const basePrice = Number(product.price) || 50000
    const wholesalePrice = Number(product.wholesalePrice) || (basePrice >= 50000 ? 45000 : basePrice)
    const effectivePrice = isGrosir ? wholesalePrice : basePrice

    return {
      productId: product.id,
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
  const discount = Math.max(0, Number(input.discount) || 0)
  if (discount > subtotal) throw new Error('Diskon melebihi subtotal.')
  const taxRate = Math.min(100, Math.max(0, Number(input.taxRate) || 0))
  const tax = Math.round(((subtotal - discount) * taxRate) / 100)
  const shipping = Math.max(0, Number(input.shipping) || 0)
  const method = ['cash', 'qris', 'transfer', 'card', 'rumah'].includes(input.paymentMethod)
    ? input.paymentMethod
    : 'cash'
  const totalCost = saleItems.reduce((sum, item) => sum + (Number(item.cost) || 0) * item.qty, 0)
  const isRumah = method === 'rumah'
  const rumahPricing = input.rumahPricing || 'free'

  const total = isRumah
    ? rumahPricing === 'free'
      ? 0
      : rumahPricing === 'cost'
        ? totalCost
        : Math.max(0, subtotal - discount + tax + shipping)
    : Math.max(0, subtotal - discount + tax + shipping)

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
  const cashier = input.cashier || {}
  const now = new Date()

  const isTunai = method === 'cash'
  const isTransfer = method === 'transfer'
  const uangModal = isTunai ? totalCost : 0

  const customerName = String(input.customerName || (isRumah ? 'Owner (Rumah)' : '')).trim()
  let displayCustomerNote = customerName
  if (isTransfer && !displayCustomerNote.toLowerCase().includes('transfer')) {
    displayCustomerNote = displayCustomerNote ? `${displayCustomerNote} (Transfer Owner)` : 'Transfer Owner'
  }

  const totalQty = saleItems.reduce((sum, item) => sum + item.qty, 0)
  const magatiRate = isRumah
    ? 0
    : isGrosir
      ? Number(input.magatiFeeWholesale ?? 2000)
      : Number(input.magatiFeeRetail ?? 5000)
  const magatiFee = totalQty * magatiRate

  const salesRate = isRumah
    ? 0
    : isGrosir
      ? Number(input.salesFeeWholesale ?? input.salesFeePerPcs ?? 3000)
      : Number(input.salesFeeRetail ?? input.salesFeePerPcs ?? 5000)
  const salesFee = totalQty * salesRate

  state.counter = (Number(state.counter) || 0) + 1
  const sale = {
    id: uid(),
    invoiceNo: `INV-${dateKey(now).replaceAll('-', '')}-${String(state.counter).padStart(4, '0')}`,
    items: saleItems,
    subtotal,
    discount,
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
    salesPersonId: String(input.salesPersonId || ''),
    salesPersonName: String(input.salesPersonName || ''),
    magatiFee,
    salesFee,
    uangModal,
    status: 'paid',
    createdAt: now.toISOString(),
    dateKey: dateKey(now),
    voidedAt: null,
    voidReason: '',
  }

  saleItems.forEach((item) => {
    const product = state.products.find((entry) => entry.id === item.productId)
    if (product) {
      product.stock = Math.max(0, Number(product.stock) - item.qty)
      product.updatedAt = now.toISOString()
    }
  })

  // Auto-create financeRecord agar transaksi masuk ke Buku Kas & Keuangan
  if (!state.financeRecords) state.financeRecords = []
  const keterangan = String(input.salesPersonName || input.defaultSalesName || cashier.name || 'Kasir')
  state.financeRecords.push({
    id: uid(),
    sourceType: isRumah ? 'rumah' : 'sale',
    sourceId: sale.id,
    date: dateKey(now),
    keterangan,
    salesPersonId: String(input.salesPersonId || ''),
    salesPersonName: String(input.salesPersonName || ''),
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
    invoiceRef: sale.invoiceNo,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  })

  state.sales.push(sale)
  persist()
  emit('sales')
  emit('products')
  emit('financeRecords')
  return sale
}

export async function voidSale(saleId, options = {}) {
  const state = load()
  const sale = state.sales.find((entry) => entry.id === saleId)
  if (!sale) throw new Error('Transaksi tidak ditemukan.')
  if (sale.status === 'void') throw new Error('Transaksi sudah dibatalkan.')

  sale.status = 'void'
  sale.voidedAt = new Date().toISOString()
  sale.voidReason = String(options.reason || '').trim()

  for (const item of sale.items || []) {
    const product = state.products.find((entry) => entry.id === item.productId)
    if (product) {
      product.stock = Number(product.stock) + Number(item.qty || 0)
      product.updatedAt = new Date().toISOString()
    }
  }

  persist()
  emit('sales')
  emit('products')
}

export async function getSale(saleId) {
  const state = load()
  return state.sales.find((sale) => sale.id === saleId) || null
}

export async function saveSettings(next) {
  const state = load()
  state.settings = { ...DEFAULT_SETTINGS, ...state.settings, ...next, updatedAt: new Date().toISOString() }
  persist()
  emit('settings')
}

export async function seedProducts() {
  const state = load()
  if (state.products.length) return 0
  state.products = buildSampleProducts()
  persist()
  emit('products')
  return state.products.length
}

export async function resetDemoData() {
  const fresh = createDemoStore()
  cache = fresh
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
  } catch (error) {
    console.error('[e-cash] gagal mereset data demo', error)
  }
  emit('products')
  emit('sales')
  emit('settings')
  emit('financeRecords')
  emit('salesPersons')
  return true
}

// ── Sales Persons (Daftar Sales / Pembawa) ──────────────────────────────────
export function subscribeSalesPersons(callback) {
  const state = load()
  if (!state.salesPersons) state.salesPersons = []
  listeners.salesPersons.add(callback)
  callback([...state.salesPersons].sort((a, b) => String(a.name).localeCompare(String(b.name), 'id')))
  return () => listeners.salesPersons.delete(callback)
}

export async function createSalesPerson(input) {
  const state = load()
  if (!state.salesPersons) state.salesPersons = []
  const now = new Date().toISOString()
  const person = {
    id: uid(),
    name: String(input.name || '').trim(),
    feePerPcs: Number(input.feePerPcs) || 0,
    active: input.active !== false,
    createdAt: now,
    updatedAt: now,
  }
  state.salesPersons.push(person)
  persist()
  emit('salesPersons')
  return person.id
}

export async function updateSalesPerson(id, input) {
  const state = load()
  if (!state.salesPersons) state.salesPersons = []
  const index = state.salesPersons.findIndex((p) => p.id === id)
  if (index === -1) throw new Error('Sales tidak ditemukan.')
  state.salesPersons[index] = {
    ...state.salesPersons[index],
    name: String(input.name || '').trim(),
    feePerPcs: Number(input.feePerPcs) || 0,
    active: input.active !== false,
    updatedAt: new Date().toISOString(),
  }
  persist()
  emit('salesPersons')
}

export async function deleteSalesPerson(id) {
  const state = load()
  if (!state.salesPersons) return
  state.salesPersons = state.salesPersons.filter((p) => p.id !== id)
  persist()
  emit('salesPersons')
}
