export const APP_NAME = 'E-Cash'

export const DEMO_CREDENTIALS = {
  email: 'demo@ecash.app',
  password: 'demo1234',
}

export const DEFAULT_SETTINGS = {
  storeName: 'E-Cash Coffee & Eatery',
  tagline: 'Kopi enak, harga bersahabat',
  address: 'Jl. Merdeka No. 12, Jakarta Pusat',
  phone: '0812-3456-7890',
  logo: '☕',
  receiptFooter: 'Terima kasih atas kunjungan Anda 🙏',
  taxEnabled: true,
  taxRate: 11,
  lowStockDefault: 5,
  initialCash: 0,
  currency: 'IDR',
}

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tunai', accent: 'emerald' },
  { id: 'qris', label: 'QRIS', accent: 'violet' },
  { id: 'transfer', label: 'Transfer', accent: 'sky' },
  { id: 'card', label: 'Kartu', accent: 'amber' },
  { id: 'rumah', label: 'Ambilan Rumah', accent: 'rose' },
]

export function paymentLabel(id) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label || 'Lainnya'
}

export const CATEGORIES = ['Kopi', 'Non-Kopi', 'Makanan', 'Snack', 'Dessert']

export const PRODUCT_EMOJIS = [
  '☕', '🥤', '🍵', '🧋', '🍫', '🍋', '💧', '🥐', '🍞', '🍟',
  '🍚', '🍜', '🍗', '🍰', '🍩', '🍪', '🥔', '🍕', '🍔', '🥗',
  '🍦', '🧁', '🍿', '🥛', '🧃',
]

const rawProducts = [
  ['Kopi Susu Gula Aren', 'Kopi', 22000, 9000, 48, 8, 'Cup', '☕'],
  ['Americano', 'Kopi', 18000, 6000, 40, 8, 'Cup', '☕'],
  ['Cappuccino', 'Kopi', 24000, 8500, 36, 8, 'Cup', '☕'],
  ['Caffe Latte', 'Kopi', 25000, 9000, 34, 8, 'Cup', '☕'],
  ['Espresso', 'Kopi', 15000, 4500, 50, 8, 'Shot', '☕'],
  ['Matcha Latte', 'Non-Kopi', 26000, 11000, 28, 6, 'Cup', '🍵'],
  ['Chocolate Ice', 'Non-Kopi', 23000, 8000, 32, 6, 'Cup', '🍫'],
  ['Teh Lemon', 'Non-Kopi', 16000, 5000, 45, 8, 'Cup', '🍋'],
  ['Air Mineral', 'Non-Kopi', 6000, 2500, 80, 12, 'Botol', '💧'],
  ['Teh Botol', 'Non-Kopi', 8000, 5000, 60, 12, 'Botol', '🥤'],
  ['Croissant Butter', 'Snack', 20000, 9000, 18, 6, 'Pcs', '🥐'],
  ['Roti Bakar Coklat', 'Makanan', 18000, 6000, 22, 6, 'Porsi', '🍞'],
  ['French Fries', 'Snack', 20000, 7000, 25, 6, 'Porsi', '🍟'],
  ['Nasi Goreng Spesial', 'Makanan', 32000, 15000, 15, 5, 'Porsi', '🍚'],
  ['Mie Goreng Jawa', 'Makanan', 28000, 12000, 12, 5, 'Porsi', '🍜'],
  ['Ayam Geprek Sambal', 'Makanan', 30000, 14000, 10, 5, 'Porsi', '🍗'],
  ['Cheesecake Slice', 'Dessert', 28000, 13000, 8, 4, 'Slice', '🍰'],
  ['Brownies Fudge', 'Dessert', 22000, 9000, 6, 4, 'Pcs', '🍫'],
  ['Donat Gula', 'Dessert', 12000, 4500, 4, 5, 'Pcs', '🍩'],
  ['Keripik Kentang', 'Snack', 10000, 6000, 30, 8, 'Pack', '🥔'],
]

export function slugSku(name) {
  return (
    String(name || '')
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .toUpperCase()
      .replace(/[\s_-]+/g, '-')
      .slice(0, 14) || 'PRD'
  )
}

export function buildSampleProducts() {
  const stamp = new Date().toISOString()
  return rawProducts.map(([name, category, price, cost, stock, minStock, unit, emoji], index) => ({
    id: `p-${index + 1}`,
    name,
    sku: `${slugSku(name)}-${String(index + 1).padStart(2, '0')}`,
    category,
    price,
    cost,
    stock,
    minStock,
    unit,
    emoji,
    active: true,
    createdAt: stamp,
    updatedAt: stamp,
  }))
}
