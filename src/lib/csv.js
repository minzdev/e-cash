import { formatDate, formatDateTime } from './format'
import { paymentLabel } from './constants'

function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r;]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

export function downloadCsv(filename, rows) {
  const content = rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * Ekspor laporan penjualan dalam format CSV profesional
 */
export function exportSalesCsv(sales = [], fromLabel = '', toLabel = '', settings = {}) {
  const storeName = settings?.storeName || 'E-Cash POS'
  const generatedAt = formatDateTime(new Date())
  const validSales = sales.filter((s) => s.status !== 'void')
  const voidSales = sales.filter((s) => s.status === 'void')

  const totalQty = validSales.reduce(
    (sum, s) => sum + (s.items || []).reduce((acc, item) => acc + (Number(item.qty) || 0), 0),
    0,
  )
  const totalSubtotal = validSales.reduce((sum, s) => sum + (Number(s.subtotal) || 0), 0)
  const totalDiscount = validSales.reduce((sum, s) => sum + (Number(s.discount) || 0), 0)
  const totalTax = validSales.reduce((sum, s) => sum + (Number(s.tax) || 0), 0)
  const totalShipping = validSales.reduce((sum, s) => sum + (Number(s.shipping) || 0), 0)
  const totalOmzet = validSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0)
  const totalPaid = validSales.reduce((sum, s) => sum + (Number(s.paid) || 0), 0)
  const totalChange = validSales.reduce((sum, s) => sum + (Number(s.change) || 0), 0)

  const rows = [
    // Header Metadata Laporan
    ['LAPORAN PENJUALAN & TRANSAKSI KASIR'],
    ['Nama Toko', storeName],
    ['Periode', `${fromLabel} s/d ${toLabel}`],
    ['Waktu Ekspor', generatedAt],
    [
      'Ringkasan',
      `Total: ${sales.length} transaksi`,
      `Lunas: ${validSales.length}`,
      `Void: ${voidSales.length}`,
      `Total Omzet: Rp ${totalOmzet.toLocaleString('id-ID')}`,
    ],
    [], // Baris kosong pemisah

    // Header Tabel Utama
    [
      'No',
      'No. Invoice',
      'Tanggal',
      'Waktu',
      'Kasir',
      'Pelanggan',
      'Metode Bayar',
      'Status',
      'Jml Qty',
      'Rincian Produk',
      'Subtotal (Rp)',
      'Diskon (Rp)',
      'PPN (Rp)',
      'Ongkir (Rp)',
      'Total Akhir (Rp)',
      'Dibayar (Rp)',
      'Kembalian (Rp)',
      'Catatan',
    ],
  ]

  // Data Baris
  sales.forEach((sale, index) => {
    const itemDetails = (sale.items || [])
      .map((item) => `${item.qty}x ${item.name}`)
      .join('; ')
    const itemCount = (sale.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0)

    rows.push([
      index + 1,
      sale.invoiceNo || '-',
      formatDate(sale.createdAt, 'dd/MM/yyyy'),
      formatDate(sale.createdAt, 'HH:mm'),
      sale.cashierName || '-',
      sale.customerName || 'Pelanggan Umum',
      paymentLabel(sale.paymentMethod),
      sale.status === 'void' ? 'VOID / BATAL' : 'LUNAS',
      itemCount,
      itemDetails || '-',
      Number(sale.subtotal) || 0,
      Number(sale.discount) || 0,
      Number(sale.tax) || 0,
      Number(sale.shipping) || 0,
      Number(sale.total) || 0,
      Number(sale.paid) || 0,
      Number(sale.change) || 0,
      sale.status === 'void' && sale.voidReason
        ? `[VOID: ${sale.voidReason}] ${sale.note || ''}`.trim()
        : sale.note || '-',
    ])
  })

  // Baris Ringkasan Total Akumulasi
  rows.push([])
  rows.push([
    'TOTAL KESELURUHAN (LUNAS)',
    '',
    '',
    '',
    '',
    '',
    '',
    `${validSales.length} transaksi`,
    totalQty,
    '',
    totalSubtotal,
    totalDiscount,
    totalTax,
    totalShipping,
    totalOmzet,
    totalPaid,
    totalChange,
    'Nilai dalam Rupiah (IDR)',
  ])

  const safeFilename = `Laporan-Penjualan-${storeName.replace(/[^a-zA-Z0-9]/g, '_')}-${fromLabel}_sd_${toLabel}.csv`
  downloadCsv(safeFilename, rows)
}
