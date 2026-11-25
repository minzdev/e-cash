import { eachDayOfInterval, endOfDay, format, startOfDay, subDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { percentChange, toDate } from './format'

export const isPaid = (sale) => sale && sale.status === 'paid'

export function inRange(sale, from, to) {
  const date = toDate(sale.createdAt)
  if (!date) return false
  if (from && date < startOfDay(toDate(from))) return false
  if (to && date > endOfDay(toDate(to))) return false
  return true
}

export function filterSales(sales, { from, to } = {}) {
  return sales.filter((sale) => inRange(sale, from, to))
}

export function summarize(sales) {
  const paid = sales.filter(isPaid)
  let net = 0
  let gross = 0
  let tax = 0
  let discount = 0
  let shipping = 0
  let cogs = 0
  let items = 0

  for (const sale of paid) {
    const saleSubtotal = Number(sale.subtotal) || 0
    net += saleSubtotal - (Number(sale.discount) || 0)
    gross += Number(sale.total) || 0
    tax += Number(sale.tax) || 0
    discount += Number(sale.discount) || 0
    shipping += Number(sale.shipping) || 0
    items += (sale.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
    cogs += (sale.items || []).reduce(
      (sum, item) => sum + (Number(item.cost) || 0) * (Number(item.qty) || 0),
      0,
    )
  }

  return {
    revenue: net,
    gross,
    profit: net - cogs,
    tax,
    discount,
    shipping,
    cogs,
    count: paid.length,
    items,
    average: paid.length ? net / paid.length : 0,
    voidCount: sales.length - paid.length,
  }
}

export function todayRange(now = new Date()) {
  return { from: startOfDay(now), to: endOfDay(now) }
}

export function yesterdayRange(now = new Date()) {
  const yesterday = subDays(now, 1)
  return { from: startOfDay(yesterday), to: endOfDay(yesterday) }
}

export function dailySeries(sales, from, to) {
  const start = startOfDay(toDate(from) || new Date())
  const end = endOfDay(toDate(to) || new Date())
  if (start > end) return []

  const buckets = new Map()
  const days = eachDayOfInterval({ start, end })
  days.forEach((day) => {
    buckets.set(format(day, 'yyyy-MM-dd'), {
      key: format(day, 'yyyy-MM-dd'),
      label: format(day, 'dd MMM', { locale: localeId }),
      shortLabel: format(day, 'dd/MM'),
      omzet: 0,
      laba: 0,
      ongkir: 0,
      transaksi: 0,
    })
  })

  for (const sale of sales.filter(isPaid)) {
    const date = toDate(sale.createdAt)
    if (!date) continue
    const key = format(date, 'yyyy-MM-dd')
    const bucket = buckets.get(key)
    if (!bucket) continue
    const cogs = (sale.items || []).reduce(
      (sum, item) => sum + (Number(item.cost) || 0) * (Number(item.qty) || 0),
      0,
    )
    const net = (Number(sale.subtotal) || 0) - (Number(sale.discount) || 0)
    bucket.omzet += net
    bucket.laba += net - cogs
    bucket.ongkir += Number(sale.shipping) || 0
    bucket.transaksi += 1
  }

  return Array.from(buckets.values())
}

export function paymentBreakdown(sales) {
  const map = new Map()
  for (const sale of sales.filter(isPaid)) {
    const key = sale.paymentMethod || 'cash'
    const current = map.get(key) || { id: key, value: 0, count: 0 }
    current.value += Number(sale.total) || 0
    current.count += 1
    map.set(key, current)
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

export function categoryBreakdown(sales) {
  const map = new Map()
  for (const sale of sales.filter(isPaid)) {
    for (const item of sale.items || []) {
      const key = item.category || 'Lainnya'
      const current = map.get(key) || { name: key, value: 0, qty: 0 }
      current.value += (Number(item.price) || 0) * (Number(item.qty) || 0)
      current.qty += Number(item.qty) || 0
      map.set(key, current)
    }
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

export function topProducts(sales, limit = 5) {
  const map = new Map()
  for (const sale of sales.filter(isPaid)) {
    for (const item of sale.items || []) {
      const key = item.productId || item.name
      const current = map.get(key) || {
        id: key,
        name: item.name,
        emoji: item.emoji || '📦',
        qty: 0,
        revenue: 0,
        profit: 0,
      }
      const qty = Number(item.qty) || 0
      current.qty += qty
      current.revenue += (Number(item.price) || 0) * qty
      current.profit += ((Number(item.price) || 0) - (Number(item.cost) || 0)) * qty
      map.set(key, current)
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit)
}

export function categoryRevenue(sales) {
  return categoryBreakdown(sales).slice(0, 6)
}

export function lowStockProducts(products) {
  return products
    .filter((product) => product.active !== false && Number(product.stock) <= Number(product.minStock ?? 0))
    .sort((a, b) => Number(a.stock) - Number(b.stock))
}

export function soldOutProducts(products) {
  return products.filter((product) => Number(product.stock) <= 0)
}

export function inventoryValue(products) {
  return products.reduce((sum, product) => sum + (Number(product.stock) || 0) * (Number(product.cost) || 0), 0)
}

export function buildKpi(currentSales, previousSales) {
  const current = summarize(currentSales)
  const previous = summarize(previousSales)
  return {
    current,
    previous,
    trend: {
      revenue: percentChange(current.revenue, previous.revenue),
      profit: percentChange(current.profit, previous.profit),
      shipping: percentChange(current.shipping, previous.shipping),
      count: percentChange(current.count, previous.count),
      items: percentChange(current.items, previous.items),
    },
  }
}
