import { paymentLabel } from './constants'
import { formatDateTime, formatRupiah } from './format'

const WIDTH = 32

function row(left, right) {
  const gap = Math.max(1, WIDTH - String(left).length - String(right).length)
  return `${left}${' '.repeat(gap)}${right}`
}

function money(value) {
  return Math.round(Number(value) || 0).toLocaleString('id-ID')
}

export function buildReceiptText(sale, settings = {}) {
  if (!sale) return ''
  const lines = []
  lines.push(`*${(settings.storeName || 'E-Cash').toUpperCase()}*`)
  if (settings.tagline) lines.push(`_${settings.tagline}_`)
  if (settings.address) lines.push(settings.address)
  if (settings.phone) lines.push(`Telp ${settings.phone}`)
  lines.push('')
  lines.push(`Invoice : ${sale.invoiceNo || '-'}`)
  lines.push(`Waktu   : ${formatDateTime(sale.createdAt)}`)
  lines.push(`Kasir   : ${sale.cashierName || '-'}`)
  if (sale.customerName) lines.push(`Pelanggan: ${sale.customerName}`)
  lines.push('')

  const table = []
  for (const item of sale.items || []) {
    table.push(row(`${item.qty}x ${item.name}`.slice(0, 24), money(item.subtotal)))
  }
  table.push('-'.repeat(WIDTH))
  if (Number(sale.discount) > 0) table.push(row('Diskon', `-${money(sale.discount)}`))
  if (Number(sale.tax) > 0) table.push(row(`PPN ${sale.taxRate || 0}%`, money(sale.tax)))
  if (Number(sale.shipping) > 0) table.push(row('Ongkir', money(sale.shipping)))
  if (Number(sale.discount) > 0 || Number(sale.tax) > 0 || Number(sale.shipping) > 0) {
    table.push('-'.repeat(WIDTH))
  }
  table.push(row('TOTAL', money(sale.total)))

  lines.push('```')
  lines.push(...table)
  lines.push('```')
  if (sale.status === 'void') lines.push('*TRANSAKSI DIBATALKAN*')
  lines.push('')
  if (settings.receiptFooter) lines.push(settings.receiptFooter)
  lines.push('Dicetak dengan E-Cash')
  return lines.join('\n')
}

export function whatsappLink(text, phone) {
  const clean = String(phone || '').replace(/\D/g, '')
  const target = clean ? (clean.startsWith('0') ? `62${clean.slice(1)}` : clean) : ''
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`
}

export function receiptTotals(sale) {
  return {
    subtotal: formatRupiah(sale?.subtotal),
    discount: formatRupiah(sale?.discount),
    tax: formatRupiah(sale?.tax),
    shipping: formatRupiah(sale?.shipping),
    total: formatRupiah(sale?.total),
    paid: formatRupiah(sale?.paid),
    change: formatRupiah(sale?.change),
  }
}
