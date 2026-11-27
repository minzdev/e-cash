import ExcelJS from 'exceljs'
import { formatDate, formatDateTime } from './format'
import { paymentLabel } from './constants'

/**
 * Palet warna tema profesional untuk Excel
 */
const COLORS = {
  headerBg: 'FF0F766E', // Teal / Dark Emerald
  headerText: 'FFFFFFFF',
  navyBg: 'FF1E293B',   // Dark Navy Slate
  navyText: 'FFFFFFFF',
  subHeaderBg: 'FFF1F5F9', // Soft Slate
  altRowBg: 'FFF8FAFC',    // Very light slate
  white: 'FFFFFFFF',
  accentGreen: 'FF10B981',
  softGreen: 'FFDCFCE7',
  accentRose: 'FFE11D48',
  softRose: 'FFFFE4E6',
  accentAmber: 'FFF59E0B',
  softAmber: 'FFFEF3C7',
  border: 'FFE2E8F0',
  darkBorder: 'FF94A3B8',
}

const THIN_BORDER = {
  top: { style: 'thin', color: { argb: COLORS.border } },
  left: { style: 'thin', color: { argb: COLORS.border } },
  bottom: { style: 'thin', color: { argb: COLORS.border } },
  right: { style: 'thin', color: { argb: COLORS.border } },
}

const HEADER_BORDER = {
  top: { style: 'medium', color: { argb: COLORS.darkBorder } },
  left: { style: 'thin', color: { argb: COLORS.darkBorder } },
  bottom: { style: 'medium', color: { argb: COLORS.darkBorder } },
  right: { style: 'thin', color: { argb: COLORS.darkBorder } },
}

const TOTAL_BORDER = {
  top: { style: 'thin', color: { argb: COLORS.darkBorder } },
  left: { style: 'thin', color: { argb: COLORS.darkBorder } },
  bottom: { style: 'double', color: { argb: COLORS.darkBorder } },
  right: { style: 'thin', color: { argb: COLORS.darkBorder } },
}

const BLACK_THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
}

const BLACK_TOTAL_BORDER = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'double', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
}

/**
 * EKSPOR LAPORAN KEUANGAN FORMAT KHUSUS SESUAI TEMPLATE USER (SUSU KAMBING / PRODUK)
 * Menghasilkan tabel persis dengan kolom:
 * NO | TGL | KETERANGAN | IN Dus | Out Dus | Out Bns Dus | Saldo Pcs | OMZET | Pendapatan Magati | Uang Modal | TF Saldo | SALDO | Keterangan Pelanggan
 */
export async function exportFinanceTemplateExcel({
  records = [],
  settings = {},
  period = '',
  productTitle = '',
}) {
  const storeName = settings?.storeName || 'E-Cash'
  const titleProduct = productTitle || settings?.reportProductTitle || 'SUSU KAMBING GIARVA'
  const reportPeriod = period || settings?.reportPeriod || 'BULAN JULI 2025'
  const initialCash = Number(settings?.initialCash) || 626000
  const initialStockPcs = Number(settings?.initialStockPcs) || 133

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'E-Cash'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Laporan Saldo & Keluar Masuk', {
    views: [{ showGridLines: true }],
  })

  // Set lebar kolom agar teks proporsional dan tidak terpotong
  sheet.columns = [
    { key: 'no', width: 6 },        // A: NO
    { key: 'tgl', width: 14 },       // B: TGL
    { key: 'ket', width: 22 },       // C: KETERANGAN
    { key: 'inDus', width: 8 },      // D: IN Dus
    { key: 'outDus', width: 8 },     // E: Out Dus
    { key: 'outBns', width: 10 },    // F: Out Bns Dus
    { key: 'saldoPcs', width: 10 },  // G: Saldo Pcs
    { key: 'omzet', width: 16 },     // H: OMZET
    { key: 'magati', width: 16 },    // I: Pemdapatan Magati
    { key: 'modal', width: 14 },     // J: Uang Modal
    { key: 'tfSaldo', width: 14 },   // K: TF Saldo
    { key: 'cashOut', width: 16 },   // L: Kas Keluar / Operasional
    { key: 'saldoKas', width: 16 },  // M: SALDO
    { key: 'pelanggan', width: 24 }, // N: Keterangan Pelanggan
  ]

  // 1. JUDUL LAPORAN (Baris 1)
  sheet.mergeCells('A1:N1')
  const title1 = sheet.getCell('A1')
  title1.value = `LAPORAN SALDO DAN KELUAR MASUK ${titleProduct.toUpperCase()}`
  title1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF000000' } }
  title1.alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getRow(1).height = 28

  // 2. SUBJUDUL PERIODE (Baris 2)
  sheet.mergeCells('A2:N2')
  const title2 = sheet.getCell('A2')
  title2.value = reportPeriod.toUpperCase()
  title2.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF000000' } }
  title2.alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getRow(2).height = 24

  // Baris 3: Kosong
  sheet.getRow(3).height = 10

  // 3. HEADER TABEL DUA TINGKAT (Baris 4 & 5)
  // Merge vertikal untuk NO, TGL, KETERANGAN, SALDO, Keterangan Pelanggan
  sheet.mergeCells('A4:A5')
  sheet.getCell('A4').value = 'NO'

  sheet.mergeCells('B4:B5')
  sheet.getCell('B4').value = 'TGL'

  sheet.mergeCells('C4:C5')
  sheet.getCell('C4').value = 'KETERANGAN'

  // Mutasi Fisik:
  sheet.getCell('D4').value = 'IN'
  sheet.getCell('D5').value = 'Dus'

  sheet.getCell('E4').value = 'Out'
  sheet.getCell('E5').value = 'Dus'

  sheet.getCell('F4').value = 'Out'
  sheet.getCell('F5').value = 'Bns Dus'

  sheet.getCell('G4').value = 'Saldo'
  sheet.getCell('G5').value = 'Pcs'

  // Transaksi Grup: H4:L4
  sheet.mergeCells('H4:L4')
  sheet.getCell('H4').value = 'Transaksi'

  sheet.getCell('H5').value = 'OMZET'
  sheet.getCell('I5').value = 'Pemdapatan\nMagati'
  sheet.getCell('J5').value = 'Uang Modal'
  sheet.getCell('K5').value = 'TF Saldo'
  sheet.getCell('L5').value = 'Kas Keluar /\nOperasional'

  sheet.mergeCells('M4:M5')
  sheet.getCell('M4').value = 'SALDO'

  sheet.mergeCells('N4:N5')
  sheet.getCell('N4').value = 'Keterangan Pelanggan'

  // Format styling seluruh sel header di baris 4 dan 5
  const HEADER_FILL = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }, // Biru muda lembut persis template gambar
  }

  for (let r = 4; r <= 5; r += 1) {
    const row = sheet.getRow(r)
    row.height = r === 5 ? 26 : 20
    for (let c = 1; c <= 14; c += 1) {
      const cell = row.getCell(c)
      cell.fill = HEADER_FILL
      cell.border = BLACK_THIN_BORDER
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    }
  }

  // 4. BARIS SALDO AWAL (Baris 6)
  sheet.mergeCells('A6:C6')
  const saldoAwalLabel = sheet.getCell('A6')
  saldoAwalLabel.value = 'SALDO AWAL'
  saldoAwalLabel.font = { name: 'Calibri', size: 11, bold: true }
  saldoAwalLabel.alignment = { vertical: 'middle', horizontal: 'center' }

  // Set nilai saldo awal di kolom G (Pcs) dan Kolom M (SALDO Kas)
  sheet.getCell('G6').value = initialStockPcs
  sheet.getCell('G6').font = { name: 'Calibri', size: 11, bold: true }
  sheet.getCell('G6').alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getCell('G6').numFmt = '#,##0'

  sheet.getCell('M6').value = initialCash
  sheet.getCell('M6').font = { name: 'Calibri', size: 11, bold: true }
  sheet.getCell('M6').alignment = { vertical: 'middle', horizontal: 'right' }
  sheet.getCell('M6').numFmt = '#,##0'

  const row6 = sheet.getRow(6)
  row6.height = 24
  for (let c = 1; c <= 14; c += 1) {
    const cell = row6.getCell(c)
    cell.border = BLACK_THIN_BORDER
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF1F5' } }
  }

  // 5. ISI TRANSAKSI BERJALAN (Baris 7 dst)
  let currentStock = initialStockPcs
  let currentCash = initialCash

  let sumInDus = 0
  let sumOutDus = 0
  let sumOutBns = 0
  let sumOmzet = 0
  let sumMagati = 0
  let sumModal = 0
  let sumTfSaldo = 0
  let sumCashOut = 0

  records.forEach((rec, idx) => {
    const rIdx = 7 + idx
    const row = sheet.getRow(rIdx)
    row.height = 22

    const inD = Number(rec.inDus) || 0
    const outD = Number(rec.outDus) || 0
    const outB = Number(rec.outBnsDus) || 0
    const omz = Number(rec.omzet) || 0
    const mag = Number(rec.magatiFee) || 0
    const mod = Number(rec.uangModal) || 0
    const tf = Number(rec.tfSaldo) || 0
    const outKas = Number(rec.cashOut) || 0

    // Hitung running balance
    currentStock = currentStock + inD - outD - outB
    
    // Perhitungan kas: sesuai template user, kas bertambah dengan fee magati dan tf saldo, atau omzet dikurangi pengeluaran operasional
    if (mag > 0) {
      currentCash += mag + tf - outKas
    } else if (omz > 0 && rec.type !== 'rumah') {
      currentCash += omz + tf - outKas
    } else {
      currentCash += tf - outKas
    }

    sumInDus += inD
    sumOutDus += outD
    sumOutBns += outB
    sumOmzet += omz
    sumMagati += mag
    sumModal += mod
    sumTfSaldo += tf
    sumCashOut += outKas

    // Format tanggal
    let dateStr = rec.date || ''
    if (dateStr && dateStr.includes('-')) {
      try {
        dateStr = formatDate(`${dateStr}T00:00:00`, 'd-MMM-yy')
      } catch (e) {
        // fallback
      }
    }

    row.getCell(1).value = idx + 1
    row.getCell(2).value = dateStr || '-'
    row.getCell(3).value = rec.keterangan || (settings?.defaultSalesName || 'Pak bambang')
    row.getCell(4).value = inD > 0 ? inD : ''
    row.getCell(5).value = outD > 0 ? outD : ''
    row.getCell(6).value = outB > 0 ? outB : ''
    row.getCell(7).value = currentStock
    row.getCell(8).value = omz > 0 ? omz : (omz === 0 && rec.outDus > 0 ? '-' : '')
    row.getCell(9).value = mag > 0 ? mag : ''
    row.getCell(10).value = mod > 0 ? mod : ''
    row.getCell(11).value = tf > 0 ? tf : ''
    row.getCell(12).value = outKas > 0 ? -outKas : ''
    row.getCell(13).value = currentCash
    row.getCell(14).value = rec.customerNote || (rec.type === 'rumah' ? 'Rumah' : '-')

    // Border & format angka
    for (let c = 1; c <= 14; c += 1) {
      const cell = row.getCell(c)
      cell.border = BLACK_THIN_BORDER
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } }

      if (c === 1 || c === 2 || c === 4 || c === 5 || c === 6 || c === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        if (c >= 4 && c <= 7 && typeof cell.value === 'number') cell.numFmt = '#,##0'
      } else if (c >= 8 && c <= 13) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        if (typeof cell.value === 'number') cell.numFmt = '#,##0'
        if (c === 12 && typeof cell.value === 'number') {
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FFDC2626' } } // Warna merah untuk kas keluar
        }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }
    }
  })

  // 6. BARIS FOOTER: JUMLAH / SALDO AKHIR
  const footerRowIdx = 7 + records.length
  const footerRow = sheet.getRow(footerRowIdx)
  footerRow.height = 26

  sheet.mergeCells(`A${footerRowIdx}:C${footerRowIdx}`)
  const footerLabel = sheet.getCell(`A${footerRowIdx}`)
  footerLabel.value = 'JUMLAH/SALDO AKHIR'
  footerLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } }
  footerLabel.alignment = { vertical: 'middle', horizontal: 'center' }

  footerRow.getCell(4).value = sumInDus > 0 ? sumInDus : ''
  footerRow.getCell(5).value = sumOutDus
  footerRow.getCell(6).value = sumOutBns
  footerRow.getCell(7).value = currentStock // Sisa Saldo Pcs Akhir
  footerRow.getCell(8).value = sumOmzet
  footerRow.getCell(9).value = sumMagati
  footerRow.getCell(10).value = sumModal > 0 ? sumModal : '-'
  footerRow.getCell(11).value = sumTfSaldo > 0 ? sumTfSaldo : ''
  footerRow.getCell(12).value = sumCashOut > 0 ? -sumCashOut : ''
  footerRow.getCell(13).value = currentCash // Saldo Akhir Kas
  footerRow.getCell(14).value = ''

  for (let c = 1; c <= 14; c += 1) {
    const cell = footerRow.getCell(c)
    cell.border = BLACK_TOTAL_BORDER
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } }

    if (c === 1 || c === 4 || c === 5 || c === 6 || c === 7) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      if (typeof cell.value === 'number') cell.numFmt = '#,##0'
    } else if (c >= 8 && c <= 13) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
      if (typeof cell.value === 'number') cell.numFmt = '#,##0'
      if (c === 12 && typeof cell.value === 'number') {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFDC2626' } }
      }
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
    }
  }

  // Download XLSX ke browser
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `Laporan-Keuangan-${titleProduct.replace(/[^a-zA-Z0-9]/g, '_')}-${reportPeriod.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * 1. EKSPOR LAPORAN PENJUALAN & TRANSAKSI KASIR (.XLSX)
 */
export async function exportSalesReportExcel(sales = [], fromLabel = '', toLabel = '', settings = {}) {
  const storeName = settings?.storeName || 'E-Cash POS'
  const generatedAt = formatDateTime(new Date())
  const validSales = sales.filter((s) => s.status !== 'void')
  const voidSales = sales.filter((s) => s.status === 'void')

  const totalOmzet = validSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0)
  const totalSubtotal = validSales.reduce((sum, s) => sum + (Number(s.subtotal) || 0), 0)
  const totalDiscount = validSales.reduce((sum, s) => sum + (Number(s.discount) || 0), 0)
  const totalTax = validSales.reduce((sum, s) => sum + (Number(s.tax) || 0), 0)
  const totalShipping = validSales.reduce((sum, s) => sum + (Number(s.shipping) || 0), 0)
  const totalPaid = validSales.reduce((sum, s) => sum + (Number(s.paid) || 0), 0)
  const totalChange = validSales.reduce((sum, s) => sum + (Number(s.change) || 0), 0)
  const totalQty = validSales.reduce(
    (sum, s) => sum + (s.items || []).reduce((acc, item) => acc + (Number(item.qty) || 0), 0),
    0,
  )

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'E-Cash'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Laporan Penjualan', {
    views: [{ showGridLines: true }],
  })

  // Set lebar kolom
  sheet.columns = [
    { key: 'no', width: 6 },
    { key: 'invoice', width: 22 },
    { key: 'date', width: 14 },
    { key: 'time', width: 10 },
    { key: 'cashier', width: 16 },
    { key: 'customer', width: 20 },
    { key: 'method', width: 16 },
    { key: 'status', width: 14 },
    { key: 'qty', width: 10 },
    { key: 'items', width: 38 },
    { key: 'subtotal', width: 16 },
    { key: 'discount', width: 14 },
    { key: 'tax', width: 14 },
    { key: 'shipping', width: 14 },
    { key: 'total', width: 18 },
    { key: 'paid', width: 16 },
    { key: 'change', width: 14 },
    { key: 'note', width: 28 },
  ]

  // 1. Judul Laporan
  sheet.mergeCells('A1:R1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'LAPORAN PENJUALAN & TRANSAKSI KASIR'
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getRow(1).height = 36

  // 2. Info Metadata
  const metaRows = [
    ['Nama Toko', `: ${storeName}`],
    ['Periode Laporan', `: ${fromLabel} s/d ${toLabel}`],
    ['Waktu Ekspor', `: ${generatedAt}`],
    [
      'Ringkasan Transaksi',
      `: ${sales.length} Total (${validSales.length} Lunas, ${voidSales.length} Dibatalkan) · Total Omzet: Rp ${totalOmzet.toLocaleString('id-ID')}`,
    ],
  ]

  metaRows.forEach((row, i) => {
    const rowNum = 3 + i
    sheet.getCell(`B${rowNum}`).value = row[0]
    sheet.getCell(`B${rowNum}`).font = { bold: true, color: { argb: 'FF475569' } }
    sheet.getCell(`C${rowNum}`).value = row[1]
    sheet.getCell(`C${rowNum}`).font = { color: { argb: 'FF1E293B' } }
  })

  // 3. Header Tabel (Baris 8)
  const headerRowIndex = 8
  const headers = [
    'No',
    'No. Invoice',
    'Tanggal',
    'Waktu',
    'Kasir',
    'Pelanggan',
    'Metode Bayar',
    'Status',
    'Qty',
    'Rincian Produk',
    'Subtotal (Rp)',
    'Diskon (Rp)',
    'PPN (Rp)',
    'Ongkir (Rp)',
    'Total Akhir (Rp)',
    'Dibayar (Rp)',
    'Kembalian (Rp)',
    'Catatan',
  ]

  const headerRow = sheet.getRow(headerRowIndex)
  headerRow.values = headers
  headerRow.height = 28

  headers.forEach((_, colIndex) => {
    const cell = headerRow.getCell(colIndex + 1)
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.headerText } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = HEADER_BORDER
  })

  // 4. Data Transaksi
  sales.forEach((sale, index) => {
    const rowIndex = headerRowIndex + 1 + index
    const isVoid = sale.status === 'void'
    const isRumah = sale.paymentMethod === 'rumah'

    const itemDetails = (sale.items || []).map((item) => `${item.qty}x ${item.name}`).join(', ')
    const itemCount = (sale.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0)

    const row = sheet.getRow(rowIndex)
    row.values = [
      index + 1,
      sale.invoiceNo || '-',
      formatDate(sale.createdAt, 'dd/MM/yyyy'),
      formatDate(sale.createdAt, 'HH:mm'),
      sale.cashierName || '-',
      sale.customerName || (isRumah ? 'Owner (Rumah)' : 'Pelanggan Umum'),
      isRumah ? 'Ambilan Rumah' : paymentLabel(sale.paymentMethod),
      isVoid ? 'DIBATALKAN' : 'LUNAS',
      itemCount,
      itemDetails || '-',
      Number(sale.subtotal) || 0,
      Number(sale.discount) || 0,
      Number(sale.tax) || 0,
      Number(sale.shipping) || 0,
      Number(sale.total) || 0,
      Number(sale.paid) || 0,
      Number(sale.change) || 0,
      isVoid && sale.voidReason
        ? `[BATAL: ${sale.voidReason}] ${sale.note || ''}`.trim()
        : sale.note || (isRumah ? 'Ambilan Rumah/Pribadi' : '-'),
    ]

    row.height = 22

    // Pewarnaan baris & formatting
    const isEven = index % 2 === 0
    let rowBg = isEven ? COLORS.white : COLORS.altRowBg
    if (isVoid) rowBg = 'FFFEE2E2' // Light red
    if (isRumah && !isVoid) rowBg = COLORS.softRose // Soft pink

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = THIN_BORDER
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
      cell.font = { name: 'Calibri', size: 10, color: { argb: isVoid ? 'FF991B1B' : 'FF1E293B' } }

      // Alignment & Number format
      if (colNumber === 1 || colNumber === 3 || colNumber === 4 || colNumber === 7 || colNumber === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      } else if (colNumber === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.numFmt = '#,##0'
      } else if (colNumber >= 11 && colNumber <= 17) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = '#,##0'
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }

      if (colNumber === 8 && !isVoid) {
        cell.font = { bold: true, color: { argb: 'FF065F46' } }
      }
    })
  })

  // 5. Baris Total Akumulasi
  const totalRowIndex = headerRowIndex + 1 + sales.length
  const totalRow = sheet.getRow(totalRowIndex)
  totalRow.values = [
    'TOTAL KESELURUHAN (LUNAS)',
    '',
    '',
    '',
    '',
    '',
    '',
    `${validSales.length} Lunas`,
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
  ]

  totalRow.height = 26

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = TOTAL_BORDER
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.subHeaderBg } }
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } }

    if (colNumber === 9) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.numFmt = '#,##0'
    } else if (colNumber >= 11 && colNumber <= 17) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
      cell.numFmt = '#,##0'
    } else if (colNumber === 1) {
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    }
  })

  // Download XLSX ke browser
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `Laporan-Penjualan-${storeName.replace(/[^a-zA-Z0-9]/g, '_')}-${fromLabel}_sd_${toLabel}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * 2. EKSPOR LAPORAN KEUANGAN REAL-TIME (SALDO KAS & STOK REAL-TIME) (.XLSX)
 */
export async function exportFinancialReportExcel({
  sales = [],
  products = [],
  fromLabel = '',
  toLabel = '',
  settings = {},
}) {
  const storeName = settings?.storeName || 'E-Cash POS'
  const generatedAt = formatDateTime(new Date())
  const initialCash = Number(settings?.initialCash) || 0

  // Filter transaksi lunas (tidak void) dalam periode
  const validSales = sales.filter((s) => s.status !== 'void')

  // Hitung total kas masuk dari penjualan
  const cashSales = validSales.filter((s) => s.paymentMethod !== 'rumah')
  const totalCashIn = cashSales.reduce((sum, s) => sum + (Number(s.paid) || 0), 0)

  // Ambilan rumah
  const rumahSales = validSales.filter((s) => s.paymentMethod === 'rumah')
  const totalRumahCashIn = rumahSales.reduce((sum, s) => sum + (Number(s.paid) || 0), 0)
  const totalRumahCogs = rumahSales.reduce(
    (sum, s) =>
      sum +
      (s.items || []).reduce(
        (acc, item) => acc + (Number(item.cost) || 0) * (Number(item.qty) || 0),
        0,
      ),
    0,
  )

  // Saldo Akhir Kas = Saldo Awal + Total Kas Masuk Penjualan + Total Kas Masuk Ambilan Rumah (jika bayar)
  const endingCash = initialCash + totalCashIn + totalRumahCashIn

  // Nilai Persediaan Stok Terkini (Real-time dari katalog produk saat ini)
  const currentTotalStockQty = (products || []).reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
  const currentStockValuation = (products || []).reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.cost) || 0),
    0,
  )

  // Total stok keluar selama transaksi periode ini
  const totalQtySoldInPeriod = validSales.reduce(
    (sum, s) => sum + (s.items || []).reduce((acc, item) => acc + (Number(item.qty) || 0), 0),
    0,
  )
  const totalCogsSoldInPeriod = validSales.reduce(
    (sum, s) =>
      sum +
      (s.items || []).reduce(
        (acc, item) => acc + (Number(item.cost) || 0) * (Number(item.qty) || 0),
        0,
      ),
    0,
  )

  // Saldo Awal Stok Barang (Sebelum transaksi periode ini berjalan)
  const initialStockQty = currentTotalStockQty + totalQtySoldInPeriod
  const initialStockValuation = currentStockValuation + totalCogsSoldInPeriod

  // Inisialisasi Workbook Excel
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'E-Cash'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Laporan Keuangan & Stok', {
    views: [{ showGridLines: true }],
  })

  // Set lebar kolom
  sheet.columns = [
    { key: 'no', width: 6 },
    { key: 'datetime', width: 18 },
    { key: 'invoice', width: 22 },
    { key: 'type', width: 18 },
    { key: 'desc', width: 34 },
    { key: 'cash_in', width: 18 },
    { key: 'cash_out', width: 16 },
    { key: 'cash_balance', width: 20 },
    { key: 'stock_change', width: 14 },
    { key: 'cogs_out', width: 18 },
    { key: 'stock_valuation', width: 22 },
    { key: 'note', width: 26 },
  ]

  // 1. JUDUL HEADER UTAMA
  sheet.mergeCells('A1:L1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'LAPORAN KEUANGAN, ARUS KAS & MUTASI STOK REAL-TIME'
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyBg } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getRow(1).height = 38

  // 2. Metadata Toko
  sheet.getCell('B3').value = 'Nama Toko'
  sheet.getCell('B3').font = { bold: true, color: { argb: 'FF475569' } }
  sheet.getCell('C3').value = `: ${storeName}`

  sheet.getCell('B4').value = 'Periode Laporan'
  sheet.getCell('B4').font = { bold: true, color: { argb: 'FF475569' } }
  sheet.getCell('C4').value = `: ${fromLabel} s/d ${toLabel}`

  sheet.getCell('B5').value = 'Waktu Update Realtime'
  sheet.getCell('B5').font = { bold: true, color: { argb: 'FF475569' } }
  sheet.getCell('C5').value = `: ${generatedAt}`

  // 3. TABEL RINGKASAN SALDO AWAL & POSISI KEUANGAN DI KOLOM ATAS
  // Sesuai instruksi: "pertama kolom atas ada saldo awal uang, saldo awal stok barang, kemudian di bawahnya transaksi realtime"
  const summaryStartRow = 7

  // Header Box Saldo Awal & Saldo Akhir
  sheet.mergeCells(`B${summaryStartRow}:E${summaryStartRow}`)
  const boxKasHeader = sheet.getCell(`B${summaryStartRow}`)
  boxKasHeader.value = 'POSISI KAS & KEUANGAN'
  boxKasHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  boxKasHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }
  boxKasHeader.alignment = { vertical: 'middle', horizontal: 'center' }

  sheet.mergeCells(`G${summaryStartRow}:J${summaryStartRow}`)
  const boxStokHeader = sheet.getCell(`G${summaryStartRow}`)
  boxStokHeader.value = 'POSISI PERSEDIAAN & STOK BARANG'
  boxStokHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  boxStokHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }
  boxStokHeader.alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getRow(summaryStartRow).height = 24

  // Baris-baris Ringkasan Kas & Stok
  const summaryItems = [
    {
      kasLabel: 'SALDO AWAL UANG (KAS)',
      kasVal: initialCash,
      stokLabel: 'SALDO AWAL STOK BARANG (NILAI MODAL)',
      stokVal: initialStockValuation,
      isInitial: true,
    },
    {
      kasLabel: 'Kas Masuk dari Penjualan',
      kasVal: totalCashIn,
      stokLabel: 'Total Qty Saldo Awal Persediaan',
      stokVal: `${initialStockQty.toLocaleString('id-ID')} unit`,
      isInitial: false,
    },
    {
      kasLabel: 'Penerimaan Kas dari Ambilan Rumah',
      kasVal: totalRumahCashIn,
      stokLabel: 'Total Nilai HPP Barang Keluar (Terjual/Ambil)',
      stokVal: totalCogsSoldInPeriod,
      isInitial: false,
    },
    {
      kasLabel: 'Ambilan Rumah Pemilik (Nilai Modal / Prive)',
      kasVal: totalRumahCogs,
      stokLabel: 'Total Qty Barang Keluar (Terjual/Ambil)',
      stokVal: `${totalQtySoldInPeriod.toLocaleString('id-ID')} unit`,
      isInitial: false,
    },
    {
      kasLabel: 'SALDO AKHIR KAS (REAL-TIME)',
      kasVal: endingCash,
      stokLabel: 'SISA NILAI STOK AKHIR (REAL-TIME)',
      stokVal: currentStockValuation,
      isFinal: true,
    },
  ]

  summaryItems.forEach((item, idx) => {
    const rNum = summaryStartRow + 1 + idx
    sheet.getRow(rNum).height = 22

    // Kolom Kas
    sheet.getCell(`B${rNum}`).value = item.kasLabel
    sheet.getCell(`B${rNum}`).font = {
      bold: item.isInitial || item.isFinal,
      color: { argb: item.isFinal ? 'FF065F46' : 'FF1E293B' },
    }
    sheet.mergeCells(`B${rNum}:D${rNum}`)
    sheet.getCell(`B${rNum}`).border = THIN_BORDER
    sheet.getCell(`C${rNum}`).border = THIN_BORDER
    sheet.getCell(`D${rNum}`).border = THIN_BORDER

    const kasValCell = sheet.getCell(`E${rNum}`)
    kasValCell.value = item.kasVal
    kasValCell.border = THIN_BORDER
    kasValCell.numFmt = '#,##0'
    kasValCell.alignment = { horizontal: 'right', vertical: 'middle' }
    kasValCell.font = {
      bold: item.isInitial || item.isFinal,
      size: item.isFinal ? 11 : 10,
      color: { argb: item.isFinal ? 'FF065F46' : 'FF1E293B' },
    }
    if (item.isInitial) {
      sheet.getCell(`B${rNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.softGreen } }
      kasValCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.softGreen } }
    } else if (item.isFinal) {
      sheet.getCell(`B${rNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA7F3D0' } }
      kasValCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA7F3D0' } }
    }

    // Kolom Stok
    sheet.getCell(`G${rNum}`).value = item.stokLabel
    sheet.getCell(`G${rNum}`).font = {
      bold: item.isInitial || item.isFinal,
      color: { argb: item.isFinal ? 'FF1E3A8A' : 'FF1E293B' },
    }
    sheet.mergeCells(`G${rNum}:I${rNum}`)
    sheet.getCell(`G${rNum}`).border = THIN_BORDER
    sheet.getCell(`H${rNum}`).border = THIN_BORDER
    sheet.getCell(`I${rNum}`).border = THIN_BORDER

    const stokValCell = sheet.getCell(`J${rNum}`)
    stokValCell.value = item.stokVal
    stokValCell.border = THIN_BORDER
    if (typeof item.stokVal === 'number') {
      stokValCell.numFmt = '#,##0'
      stokValCell.alignment = { horizontal: 'right', vertical: 'middle' }
    } else {
      stokValCell.alignment = { horizontal: 'center', vertical: 'middle' }
    }
    stokValCell.font = {
      bold: item.isInitial || item.isFinal,
      size: item.isFinal ? 11 : 10,
      color: { argb: item.isFinal ? 'FF1E3A8A' : 'FF1E293B' },
    }
    if (item.isInitial) {
      sheet.getCell(`G${rNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
      stokValCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
    } else if (item.isFinal) {
      sheet.getCell(`G${rNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFDBFE' } }
      stokValCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFDBFE' } }
    }
  })

  // 4. HEADER TABEL TRANSAKSI MUTASI REAL-TIME (Di Bawah Ringkasan Saldo Awal)
  const txTableStartRow = summaryStartRow + summaryItems.length + 3

  sheet.mergeCells(`A${txTableStartRow - 1}:L${txTableStartRow - 1}`)
  const tableTitle = sheet.getCell(`A${txTableStartRow - 1}`)
  tableTitle.value = 'BUKU KAS & MUTASI TRANSAKSI REAL-TIME (DENGAN SALDO BERJALAN)'
  tableTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
  tableTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navyBg } }
  tableTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  sheet.getRow(txTableStartRow - 1).height = 26

  const txHeaders = [
    'No',
    'Tanggal & Waktu',
    'No. Invoice / Ref',
    'Tipe Transaksi',
    'Keterangan & Item',
    'Kas Masuk (Rp)',
    'Kas Keluar/Prive (Rp)',
    'Saldo Kas Berjalan (Rp)',
    'Qty Keluar',
    'Nilai HPP Keluar (Rp)',
    'Sisa Nilai Stok (Rp)',
    'Catatan Khusus',
  ]

  const txHeaderRow = sheet.getRow(txTableStartRow)
  txHeaderRow.values = txHeaders
  txHeaderRow.height = 28

  txHeaders.forEach((_, colIndex) => {
    const cell = txHeaderRow.getCell(colIndex + 1)
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = HEADER_BORDER
  })

  // Baris Saldo Awal Berjalan (Row 0 dalam tabel)
  const initialRunningRowIndex = txTableStartRow + 1
  const initialRunningRow = sheet.getRow(initialRunningRowIndex)
  initialRunningRow.values = [
    '-',
    `${fromLabel} 00:00`,
    'SALDO AWAL',
    'SALDO AWAL KAS & STOK',
    'Saldo Awal Uang Kas & Nilai Persediaan Barang',
    0,
    0,
    initialCash,
    0,
    0,
    initialStockValuation,
    'Saldo awal sebelum transaksi',
  ]
  initialRunningRow.height = 24
  initialRunningRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = THIN_BORDER
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.softGreen } }
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } }
    if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    } else if (colNumber === 9) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.numFmt = '#,##0'
    } else if (colNumber >= 6 && colNumber <= 11) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
      cell.numFmt = '#,##0'
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
    }
  })

  // Urutkan transaksi dari terlama ke terbaru untuk running balance yang runtut
  const sortedSales = [...sales].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime()
    const timeB = new Date(b.createdAt || 0).getTime()
    return timeA - timeB
  })

  let runningCash = initialCash
  let runningStockVal = initialStockValuation

  sortedSales.forEach((sale, index) => {
    const rowIndex = initialRunningRowIndex + 1 + index
    const isVoid = sale.status === 'void'
    const isRumah = sale.paymentMethod === 'rumah'

    const saleQty = (sale.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
    const saleCogs = (sale.items || []).reduce(
      (sum, item) => sum + (Number(item.cost) || 0) * (Number(item.qty) || 0),
      0,
    )

    let cashIn = 0
    let cashOut = 0

    if (!isVoid) {
      if (isRumah) {
        // Ambilan rumah: jika bayar modal/normal, uang masuk kas. Jika free, kasIn = 0
        cashIn = Number(sale.paid) || 0
      } else {
        // Penjualan umum: uang masuk kas
        cashIn = Number(sale.paid) || 0
      }
      runningCash += cashIn - cashOut
      runningStockVal = Math.max(0, runningStockVal - saleCogs)
    }

    const itemNames = (sale.items || []).map((item) => `${item.qty}x ${item.name}`).join(', ')
    const row = sheet.getRow(rowIndex)

    const transactionType = isVoid
      ? 'DIBATALKAN'
      : isRumah
        ? 'AMBILAN RUMAH (OWNER)'
        : `PENJUALAN (${paymentLabel(sale.paymentMethod).toUpperCase()})`

    row.values = [
      index + 1,
      formatDate(sale.createdAt, 'dd/MM/yyyy HH:mm'),
      sale.invoiceNo || '-',
      transactionType,
      itemNames || '-',
      isVoid ? 0 : cashIn,
      isVoid ? 0 : cashOut,
      runningCash,
      isVoid ? 0 : saleQty,
      isVoid ? 0 : saleCogs,
      runningStockVal,
      isVoid
        ? `[BATAL: ${sale.voidReason || 'Dibatalkan'}]`
        : isRumah
          ? sale.note || 'Pengambilan keperluan rumah tangga'
          : sale.note || '-',
    ]

    row.height = 22

    // Background warna per baris
    let bg = index % 2 === 0 ? COLORS.white : COLORS.altRowBg
    if (isVoid) bg = 'FFFEE2E2' // Merah muda
    if (isRumah && !isVoid) bg = COLORS.softRose // Rose lembut untuk ambilan rumah

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = THIN_BORDER
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      cell.font = { name: 'Calibri', size: 10, color: { argb: isVoid ? 'FF991B1B' : 'FF1E293B' } }

      if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      } else if (colNumber === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.numFmt = '#,##0'
      } else if (colNumber >= 6 && colNumber <= 11) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = '#,##0'
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }

      // Beri warna khusus pada saldo berjalan
      if (colNumber === 8) {
        cell.font = { bold: true, color: { argb: 'FF065F46' } }
      }
      if (colNumber === 11) {
        cell.font = { bold: true, color: { argb: 'FF1E3A8A' } }
      }
      if (isRumah && colNumber === 4 && !isVoid) {
        cell.font = { bold: true, color: { argb: 'FFE11D48' } }
      }
    })
  })

  // Baris Total Penutup Real-time
  const finalRowIndex = initialRunningRowIndex + 1 + sortedSales.length
  const finalRow = sheet.getRow(finalRowIndex)
  finalRow.values = [
    'POSISI REAL-TIME SAAT INI',
    '',
    '',
    'AKUMULASI AKHIR',
    `${validSales.length} Transaksi Berhasil`,
    totalCashIn + totalRumahCashIn,
    0,
    runningCash,
    totalQtySoldInPeriod,
    totalCogsSoldInPeriod,
    currentStockValuation,
    'Tersinkronisasi Realtime',
  ]

  finalRow.height = 28
  finalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = TOTAL_BORDER
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } }

    if (colNumber === 9) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.numFmt = '#,##0'
    } else if (colNumber >= 6 && colNumber <= 11) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
      cell.numFmt = '#,##0'
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    }
  })

  // Download XLSX ke browser
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `Laporan-Keuangan-Kas-Stok-${storeName.replace(/[^a-zA-Z0-9]/g, '_')}-${fromLabel}_sd_${toLabel}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
