import * as XLSX from 'xlsx'
import { formatDate, formatDateTime } from './format'
import { paymentLabel } from './constants'

function escapeCsvCell(value, delimiter = ';') {
  const text = value === null || value === undefined ? '' : String(value)
  if (text.includes('"') || text.includes('\n') || text.includes('\r') || text.includes(delimiter)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function downloadCsv(filename, rows, delimiter = ';') {
  // sep=; memberitahu Microsoft Excel untuk otomatis menggunakan pemisah titik koma
  const sepHeader = `sep=${delimiter}\r\n`
  const content = rows
    .map((row) => row.map((cell) => escapeCsvCell(cell, delimiter)).join(delimiter))
    .join('\r\n')
  const blob = new Blob([`\uFEFF${sepHeader}${content}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function buildReportRows(sales = [], fromLabel = '', toLabel = '', settings = {}) {
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
      `Total: ${sales.length} transaksi (${validSales.length} Lunas, ${voidSales.length} Void) · Total Omzet: Rp ${totalOmzet.toLocaleString('id-ID')}`,
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
      .join(', ')
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

  return { rows, storeName }
}

/**
 * Ekspor laporan ke file native Microsoft Excel (.xlsx) dengan kolom rapi dan terformat
 */
export function exportSalesExcel(sales = [], fromLabel = '', toLabel = '', settings = {}) {
  const { rows, storeName } = buildReportRows(sales, fromLabel, toLabel, settings)
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Lebar kolom rapi dan proporsional untuk Excel
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 22 }, // No. Invoice
    { wch: 14 }, // Tanggal
    { wch: 10 }, // Waktu
    { wch: 16 }, // Kasir
    { wch: 20 }, // Pelanggan
    { wch: 15 }, // Metode Bayar
    { wch: 14 }, // Status
    { wch: 10 }, // Jml Qty
    { wch: 38 }, // Rincian Produk
    { wch: 16 }, // Subtotal (Rp)
    { wch: 14 }, // Diskon (Rp)
    { wch: 14 }, // PPN (Rp)
    { wch: 14 }, // Ongkir (Rp)
    { wch: 18 }, // Total Akhir (Rp)
    { wch: 16 }, // Dibayar (Rp)
    { wch: 14 }, // Kembalian (Rp)
    { wch: 26 }, // Catatan
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penjualan')
  const safeFilename = `Laporan-Penjualan-${storeName.replace(/[^a-zA-Z0-9]/g, '_')}-${fromLabel}_sd_${toLabel}.xlsx`
  XLSX.writeFile(wb, safeFilename)
}

/**
 * Ekspor laporan ke format CSV dengan pemisah titik koma (;) standar Excel Windows
 */
export function exportSalesCsv(sales = [], fromLabel = '', toLabel = '', settings = {}) {
  const { rows, storeName } = buildReportRows(sales, fromLabel, toLabel, settings)
  const safeFilename = `Laporan-Penjualan-${storeName.replace(/[^a-zA-Z0-9]/g, '_')}-${fromLabel}_sd_${toLabel}.csv`
  downloadCsv(safeFilename, rows, ';')
}
