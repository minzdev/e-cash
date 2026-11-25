import { buildSampleProducts, DEFAULT_SETTINGS } from './constants'
import { createDemoStore } from './sampleData'
import { dateKey, toDate, uid } from './format'

const STORAGE_KEY = 'ecash:demo:v1'
const listeners = {
  products: new Set(),
  sales: new Set(),
  settings: new Set(),
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
  const payload =
    name === 'products'
      ? sortProducts(state.products)
      : name === 'sales'
        ? sortSales(state.sales)
        : { ...DEFAULT_SETTINGS, ...state.settings }
  listeners[name].forEach((callback) => callback(payload))
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

  const saleItems = lines.map((line) => {
    const product = state.products.find((item) => item.id === String(line.productId))
    if (!product) throw new Error('Ada produk yang sudah tidak tersedia.')
    const qty = Number(line.qty)
    if (!(qty > 0)) throw new Error('Jumlah item tidak valid.')
    if (Number(product.stock) < qty) {
      throw new Error(`Stok ${product.name} tersisa ${product.stock}.`)
    }
    return {
      productId: product.id,
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
  const discount = Math.max(0, Number(input.discount) || 0)
  if (discount > subtotal) throw new Error('Diskon melebihi subtotal.')
  const taxRate = Math.min(100, Math.max(0, Number(input.taxRate) || 0))
  const tax = Math.round(((subtotal - discount) * taxRate) / 100)
  const shipping = Math.max(0, Number(input.shipping) || 0)
  const total = subtotal - discount + tax + shipping
  const method = ['cash', 'qris', 'transfer', 'card'].includes(input.paymentMethod)
    ? input.paymentMethod
    : 'cash'
  const paid = method === 'cash' ? Number(input.paid) || 0 : total
  if (paid < total) throw new Error('Nominal pembayaran kurang dari total.')
  const cashier = input.cashier || {}
  const now = new Date()

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
    customerName: String(input.customerName || '').trim(),
    note: String(input.note || '').trim(),
    cashierId: cashier.uid || '',
    cashierName: cashier.name || 'Kasir',
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

  state.sales.push(sale)
  persist()
  emit('sales')
  emit('products')
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
  return true
}
