import { useMemo, useState } from 'react'
import {
  Banknote,
  Boxes,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  Edit2,
  FileSpreadsheet,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../context/StoreContext'
import { api } from '../lib/api'
import { formatNumber, formatRupiah, dateKey } from '../lib/format'
import { exportFinanceTemplateExcel } from '../lib/excel'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  PageHeading,
  Select,
} from '../components/ui'

export default function Finance() {
  const { settings, financeRecords, loadingFinanceRecords } = useStore()

  // State Dialog Form CRUD Mutasi
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [savingRecord, setSavingRecord] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // State Dialog Pengaturan Parameter Keuangan
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    initialCash: settings?.initialCash ?? 626000,
    initialStockPcs: settings?.initialStockPcs ?? 133,
    magatiFeePerPcs: settings?.magatiFeePerPcs ?? 2000,
    salesFeePerPcs: settings?.salesFeePerPcs ?? 0,
    defaultSalesName: settings?.defaultSalesName || 'Pak bambang',
    reportProductTitle: settings?.reportProductTitle || 'SUSU KAMBING GIARVA',
    reportPeriod: settings?.reportPeriod || 'BULAN JULI 2025',
  })

  // State Filter & Pencarian
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // Form Record Mutasi Kas/Stok
  const [recordForm, setRecordForm] = useState({
    date: dateKey(new Date()),
    keterangan: settings?.defaultSalesName || 'Pak bambang',
    type: 'sale', // 'sale' | 'rumah' | 'tf_saldo' | 'cash_out' | 'in_dus' | 'bns_dus'
    inDus: 0,
    outDus: 0,
    outBnsDus: 0,
    omzet: 0,
    magatiFee: 0,
    salesFee: 0,
    uangModal: 0,
    tfSaldo: 0,
    cashOut: 0,
    customerNote: '',
  })

  // Sinkronisasi form pengaturan ketika modal dibuka
  function openSettingsModal() {
    setSettingsForm({
      initialCash: settings?.initialCash ?? 626000,
      initialStockPcs: settings?.initialStockPcs ?? 133,
      retailPrice: settings?.retailPrice ?? 50000,
      wholesalePrice: settings?.wholesalePrice ?? 45000,
      wholesaleMinQty: settings?.wholesaleMinQty ?? 20,
      magatiFeeRetail: settings?.magatiFeeRetail ?? 5000,
      magatiFeeWholesale: settings?.magatiFeeWholesale ?? 2000,
      magatiFeePerPcs: settings?.magatiFeeWholesale ?? 2000,
      salesFeeRetail: settings?.salesFeeRetail ?? 5000,
      salesFeeWholesale: settings?.salesFeeWholesale ?? 3000,
      salesFeePerPcs: settings?.salesFeeWholesale ?? 3000,
      defaultSalesName: settings?.defaultSalesName || 'Pak bambang',
      reportProductTitle: settings?.reportProductTitle || 'SUSU KAMBING GIARVA',
      reportPeriod: settings?.reportPeriod || 'BULAN JULI 2025',
    })
    setSettingsOpen(true)
  }

  // Simpan Pengaturan Parameter
  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      await api.saveSettings({
        ...settings,
        initialCash: Number(settingsForm.initialCash) || 0,
        initialStockPcs: Number(settingsForm.initialStockPcs) || 0,
        retailPrice: Number(settingsForm.retailPrice) || 50000,
        wholesalePrice: Number(settingsForm.wholesalePrice) || 45000,
        wholesaleMinQty: Number(settingsForm.wholesaleMinQty) || 20,
        magatiFeeRetail: Number(settingsForm.magatiFeeRetail) || 5000,
        magatiFeeWholesale: Number(settingsForm.magatiFeeWholesale) || 2000,
        magatiFeePerPcs: Number(settingsForm.magatiFeeWholesale) || 2000,
        salesFeeRetail: Number(settingsForm.salesFeeRetail) || 5000,
        salesFeeWholesale: Number(settingsForm.salesFeeWholesale) || 3000,
        salesFeePerPcs: Number(settingsForm.salesFeeWholesale) || 3000,
        defaultSalesName: settingsForm.defaultSalesName.trim() || 'Pak bambang',
        reportProductTitle: settingsForm.reportProductTitle.trim() || 'SUSU KAMBING GIARVA',
        reportPeriod: settingsForm.reportPeriod.trim() || 'BULAN JULI 2025',
      })
      toast.success('Pengaturan parameter keuangan berhasil disimpan')
      setSettingsOpen(false)
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengaturan')
    } finally {
      setSavingSettings(false)
    }
  }

  // Buka Modal Tambah Record
  function handleOpenCreate() {
    setEditingRecord(null)
    setRecordForm({
      date: dateKey(new Date()),
      keterangan: settings?.defaultSalesName || 'Pak bambang',
      type: 'sale',
      inDus: 0,
      outDus: 0,
      outBnsDus: 0,
      omzet: 0,
      magatiFee: 0,
      salesFee: 0,
      uangModal: 0,
      tfSaldo: 0,
      cashOut: 0,
      customerNote: '',
    })
    setModalOpen(true)
  }

  // Buka Modal Edit Record
  function handleOpenEdit(rec) {
    setEditingRecord(rec)
    setRecordForm({
      date: rec.date || dateKey(new Date()),
      keterangan: rec.keterangan || '',
      type: rec.type || 'sale',
      inDus: rec.inDus || 0,
      outDus: rec.outDus || 0,
      outBnsDus: rec.outBnsDus || 0,
      omzet: rec.omzet || 0,
      magatiFee: rec.magatiFee || 0,
      salesFee: rec.salesFee || 0,
      uangModal: rec.uangModal || 0,
      tfSaldo: rec.tfSaldo || 0,
      cashOut: rec.cashOut || 0,
      customerNote: rec.customerNote || '',
    })
    setModalOpen(true)
  }

  // Auto hitung fee Magati & Sales saat outDus berubah
  function handleOutDusChange(val) {
    const qty = Number(val) || 0
    const magatiPerPcs = Number(settings?.magatiFeePerPcs) || 2000
    const salesPerPcs = Number(settings?.salesFeePerPcs) || 0
    setRecordForm((prev) => ({
      ...prev,
      outDus: qty,
      magatiFee: qty * magatiPerPcs,
      salesFee: qty * salesPerPcs,
    }))
  }

  // Simpan / Update Record Mutasi
  async function handleSaveRecord() {
    if (!recordForm.keterangan?.trim()) {
      toast.error('Keterangan / nama pembawa wajib diisi.')
      return
    }

    setSavingRecord(true)
    try {
      const payload = {
        date: recordForm.date,
        keterangan: recordForm.keterangan.trim(),
        type: recordForm.type,
        inDus: Number(recordForm.inDus) || 0,
        outDus: Number(recordForm.outDus) || 0,
        outBnsDus: Number(recordForm.outBnsDus) || 0,
        omzet: Number(recordForm.omzet) || 0,
        magatiFee: Number(recordForm.magatiFee) || 0,
        salesFee: Number(recordForm.salesFee) || 0,
        uangModal: Number(recordForm.uangModal) || 0,
        tfSaldo: Number(recordForm.tfSaldo) || 0,
        cashOut: Number(recordForm.cashOut) || 0,
        customerNote: recordForm.customerNote?.trim() || '',
      }

      if (editingRecord?.id) {
        await api.updateFinanceRecord(editingRecord.id, payload)
        toast.success('Entri mutasi keuangan berhasil diperbarui')
      } else {
        await api.createFinanceRecord(payload)
        toast.success('Entri mutasi keuangan berhasil ditambahkan')
      }

      setModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data')
    } finally {
      setSavingRecord(false)
    }
  }

  // Hapus Record Mutasi
  async function handleDeleteRecord() {
    if (!deleteConfirm?.id) return
    setDeleting(true)
    try {
      await api.deleteFinanceRecord(deleteConfirm.id)
      toast.success('Entri mutasi berhasil dihapus')
      setDeleteConfirm(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  // Ekspor Excel Template Khusus Sesuai Gambar User
  async function handleExportExcel() {
    try {
      await exportFinanceTemplateExcel({
        records: financeRecords,
        settings,
        period: settings?.reportPeriod,
        productTitle: settings?.reportProductTitle,
      })
      toast.success('Laporan Excel Saldo & Keluar Masuk berhasil diunduh')
    } catch (err) {
      toast.error('Gagal mengekspor file Excel')
    }
  }

  // Urutkan dan Filter Records
  const sortedRecords = useMemo(() => {
    return [...financeRecords].sort((a, b) => {
      const timeA = new Date(a.date || a.createdAt || 0).getTime()
      const timeB = new Date(b.date || b.createdAt || 0).getTime()
      return timeA - timeB
    })
  }, [financeRecords])

  // Hitung running balances kas & stok secara real-time
  const { tableRows, totals, endingCash, endingStock } = useMemo(() => {
    const initialCash = Number(settings?.initialCash) || 626000
    const initialStockPcs = Number(settings?.initialStockPcs) || 133

    let currentStock = initialStockPcs
    let currentCash = initialCash

    let sumInDus = 0
    let sumOutDus = 0
    let sumOutBns = 0
    let sumOmzet = 0
    let sumMagati = 0
    let sumSalesFee = 0
    let sumModal = 0
    let sumTfSaldo = 0
    let sumCashOut = 0

    const rows = sortedRecords.map((rec, index) => {
      const inD = Number(rec.inDus) || 0
      const outD = Number(rec.outDus) || 0
      const outB = Number(rec.outBnsDus) || 0
      const omz = Number(rec.omzet) || 0
      const mag = Number(rec.magatiFee) || 0
      const sFee = Number(rec.salesFee) || 0
      const mod = Number(rec.uangModal) || 0
      const tf = Number(rec.tfSaldo) || 0
      const outK = Number(rec.cashOut) || 0

      currentStock = currentStock + inD - outD - outB

      // Akumulasi kas sesuai template buku kas (berdasarkan pendapatan fee magati & tf saldo atau omzet)
      if (mag > 0) {
        currentCash += mag + tf - outK
      } else if (omz > 0 && rec.type !== 'rumah') {
        currentCash += omz + tf - outK
      } else {
        currentCash += tf - outK
      }

      sumInDus += inD
      sumOutDus += outD
      sumOutBns += outB
      sumOmzet += omz
      sumMagati += mag
      sumSalesFee += sFee
      sumModal += mod
      sumTfSaldo += tf
      sumCashOut += outK

      return {
        ...rec,
        rowNumber: index + 1,
        runningStock: currentStock,
        runningCash: currentCash,
      }
    })

    return {
      tableRows: rows,
      totals: {
        inDus: sumInDus,
        outDus: sumOutDus,
        outBns: sumOutBns,
        omzet: sumOmzet,
        magati: sumMagati,
        salesFee: sumSalesFee,
        modal: sumModal,
        tfSaldo: sumTfSaldo,
        cashOut: sumCashOut,
      },
      endingCash: currentCash,
      endingStock: currentStock,
    }
  }, [sortedRecords, settings])

  // Filter baris untuk tampilan tabel UI
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tableRows.filter((row) => {
      if (typeFilter === 'cash' && row.paymentMethod !== 'cash') return false
      if (typeFilter === 'transfer' && row.paymentMethod !== 'transfer') return false
      if (typeFilter === 'sale' && row.type !== 'sale') return false
      if (typeFilter === 'rumah' && row.type !== 'rumah') return false
      if (typeFilter === 'tf_saldo' && (row.tfSaldo || 0) <= 0) return false
      if (typeFilter === 'cash_out' && (row.cashOut || 0) <= 0) return false
      if (typeFilter === 'in_dus' && (row.inDus || 0) <= 0) return false
      if (!q) return true
      return (
        String(row.keterangan || '').toLowerCase().includes(q) ||
        String(row.customerNote || '').toLowerCase().includes(q) ||
        String(row.date || '').toLowerCase().includes(q) ||
        String(row.paymentMethod || '').toLowerCase().includes(q)
      )
    })
  }, [tableRows, search, typeFilter])

  return (
    <div className="space-y-4">
      {/* Header Halaman & Aksi Cepat */}
      <PageHeading
        title="Buku Kas & Keuangan"
        description={`${settings?.reportProductTitle || 'SUSU KAMBING GIARVA'} · ${settings?.reportPeriod || 'BULAN JULI 2025'}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              icon={Settings}
              onClick={openSettingsModal}
            >
              Pengaturan Parameter
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={FileSpreadsheet}
              className="border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              onClick={handleExportExcel}
            >
              Unduh Excel (.xlsx)
            </Button>
            <Button size="md" icon={Plus} onClick={handleOpenCreate}>
              Catat Mutasi Baru
            </Button>
          </div>
        }
      />

      {/* Kartu Ringkasan Indikator Keuangan Sesuai Template User */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Saldo Kas */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Kas Realtime</span>
            <Wallet size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatRupiah(endingCash)}</p>
          <div className="mt-2 flex items-center justify-between border-t border-emerald-200/60 pt-2 text-[11px] text-slate-600">
            <span>Saldo Awal Kas:</span>
            <span className="font-bold text-slate-800">{formatRupiah(settings?.initialCash ?? 626000)}</span>
          </div>
        </div>

        {/* Saldo Fisik Barang */}
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-500/10 to-indigo-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between text-sky-800">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Stok (Pcs)</span>
            <Boxes size={18} className="text-sky-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{endingStock} Pcs</p>
          <div className="mt-2 flex items-center justify-between border-t border-sky-200/60 pt-2 text-[11px] text-slate-600">
            <span>Saldo Awal Stok:</span>
            <span className="font-bold text-slate-800">{settings?.initialStockPcs ?? 133} Pcs</span>
          </div>
        </div>

        {/* Pendapatan Fee Magati */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-bold uppercase tracking-wider">Pendapatan Magati</span>
            <TrendingUp size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatRupiah(totals.magati)}</p>
          <div className="mt-2 flex items-center justify-between border-t border-amber-200/60 pt-2 text-[11px] text-slate-600">
            <span>Tarif: {formatRupiah(settings?.magatiFeePerPcs ?? 2000)} / pcs</span>
            <span className="font-bold text-amber-700">{totals.outDus} pcs keluar</span>
          </div>
        </div>

        {/* Total Omzet Penjualan */}
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between text-purple-800">
            <span className="text-xs font-bold uppercase tracking-wider">Total Omzet Penjualan</span>
            <Banknote size={18} className="text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatRupiah(totals.omzet)}</p>
          <div className="mt-2 flex items-center justify-between border-t border-purple-200/60 pt-2 text-[11px] text-slate-600">
            <span>{tableRows.length} entri mutasi</span>
            <span className="font-bold text-purple-700">Realtime</span>
          </div>
        </div>
      </div>

      {/* Filter & Pencarian Baris */}
      <Card className="p-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari keterangan pembawa, pelanggan, tanggal..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 w-52"
              aria-label="Filter Tipe Transaksi"
            >
              <option value="all">Semua Transaksi</option>
              <option value="cash">Tunai (Diterima Kasir)</option>
              <option value="transfer">Transfer (Langsung Owner)</option>
              <option value="sale">Semua Penjualan</option>
              <option value="rumah">Ambilan Rumah</option>
              <option value="tf_saldo">Transfer Saldo (Kas IN)</option>
              <option value="cash_out">Pengeluaran (Kas OUT)</option>
              <option value="in_dus">Stok Masuk (IN Dus)</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabel Mutasi Keuangan Lengkap Sesuai Template Gambar */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-xs">
            {/* Header Bertingkat dengan Background Biru Muda Sesuai Template */}
            <thead>
              <tr className="border-b border-slate-300 bg-[#D9E1F2] text-slate-900 font-bold">
                <th rowSpan={2} className="border border-slate-300 px-2 py-2.5 text-center w-12">NO</th>
                <th rowSpan={2} className="border border-slate-300 px-3 py-2.5 text-center w-28">TGL</th>
                <th rowSpan={2} className="border border-slate-300 px-3 py-2.5 text-left min-w-[140px]">KETERANGAN</th>
                <th className="border border-slate-300 px-2 py-1 text-center w-16">IN</th>
                <th className="border border-slate-300 px-2 py-1 text-center w-16">Out</th>
                <th className="border border-slate-300 px-2 py-1 text-center w-20">Out</th>
                <th className="border border-slate-300 px-2 py-1 text-center w-20">Saldo</th>
                <th colSpan={4} className="border border-slate-300 px-2 py-1 text-center">Transaksi</th>
                <th rowSpan={2} className="border border-slate-300 px-3 py-2.5 text-right w-28">SALDO</th>
                <th rowSpan={2} className="border border-slate-300 px-3 py-2.5 text-left min-w-[150px]">Keterangan Pelanggan</th>
                <th rowSpan={2} className="border border-slate-300 px-2 py-2.5 text-center w-20">Aksi</th>
              </tr>
              <tr className="border-b border-slate-300 bg-[#D9E1F2] text-slate-900 font-bold">
                <th className="border border-slate-300 px-2 py-1 text-center">Dus</th>
                <th className="border border-slate-300 px-2 py-1 text-center">Dus</th>
                <th className="border border-slate-300 px-2 py-1 text-center">Bns Dus</th>
                <th className="border border-slate-300 px-2 py-1 text-center">Pcs</th>
                <th className="border border-slate-300 px-3 py-1 text-right w-28">OMZET</th>
                <th className="border border-slate-300 px-3 py-1 text-right w-28">Pendapatan Magati</th>
                <th className="border border-slate-300 px-3 py-1 text-right w-24">Uang Modal</th>
                <th className="border border-slate-300 px-3 py-1 text-right w-24">TF Saldo</th>
              </tr>
            </thead>

            <tbody>
              {/* Baris Saldo Awal */}
              <tr className="border-b border-slate-300 bg-slate-100/90 font-bold text-slate-900">
                <td colSpan={3} className="border border-slate-300 px-3 py-2 text-center tracking-wider">
                  SALDO AWAL
                </td>
                <td className="border border-slate-300 px-2 py-2 text-center text-slate-400">-</td>
                <td className="border border-slate-300 px-2 py-2 text-center text-slate-400">-</td>
                <td className="border border-slate-300 px-2 py-2 text-center text-slate-400">-</td>
                <td className="border border-slate-300 px-2 py-2 text-center font-extrabold text-sky-800">
                  {settings?.initialStockPcs ?? 133}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right text-slate-400">-</td>
                <td className="border border-slate-300 px-3 py-2 text-right text-slate-400">-</td>
                <td className="border border-slate-300 px-3 py-2 text-right text-slate-400">-</td>
                <td className="border border-slate-300 px-3 py-2 text-right text-slate-400">-</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-extrabold text-emerald-800">
                  {formatNumber(settings?.initialCash ?? 626000)}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-slate-500 italic">Saldo awal acuan</td>
                <td className="border border-slate-300 px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={openSettingsModal}
                    className="rounded p-1 text-slate-500 hover:bg-slate-200"
                    title="Edit Saldo Awal"
                  >
                    <Settings size={13} />
                  </button>
                </td>
              </tr>

              {/* Baris Data Transaksi Realtime */}
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const isRumah = row.customerNote?.toLowerCase() === 'rumah' || row.type === 'rumah'
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-200 transition hover:bg-slate-50 ${
                        isRumah ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="border border-slate-200 px-2 py-2 text-center text-slate-600 font-medium">
                        {row.rowNumber}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center text-slate-700 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>{row.keterangan}</span>
                          {row.paymentMethod === 'cash' ? (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                              Tunai (Kasir)
                            </span>
                          ) : row.paymentMethod === 'transfer' ? (
                            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 ring-1 ring-sky-200">
                              Transfer (Owner)
                            </span>
                          ) : row.sourceType === 'sale' ? (
                            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand-700 ring-1 ring-brand-200/60">
                              POS
                            </span>
                          ) : null}
                          {row.priceTier === 'grosir' ? (
                            <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-bold text-amber-700">
                              Grosir
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center text-slate-700">
                        {row.inDus > 0 ? row.inDus : ''}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center font-bold text-slate-800">
                        {row.outDus > 0 ? row.outDus : ''}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center text-slate-600">
                        {row.outBnsDus > 0 ? row.outBnsDus : ''}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center font-extrabold text-sky-700">
                        {row.runningStock}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-medium text-slate-800">
                        {row.omzet > 0 ? formatNumber(row.omzet) : '-'}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-bold text-amber-700">
                        {row.magatiFee > 0 ? formatNumber(row.magatiFee) : ''}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right">
                        {row.uangModal > 0 ? (
                          <span className="font-semibold text-slate-800">{formatNumber(row.uangModal)}</span>
                        ) : (
                          <span className="font-normal text-slate-400">-</span>
                        )}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-bold text-emerald-700">
                        {row.tfSaldo > 0 ? formatNumber(row.tfSaldo) : ''}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-extrabold text-emerald-700">
                        {formatNumber(row.runningCash)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        {isRumah ? (
                          <div>
                            <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                              Rumah
                            </span>
                            {row.invoiceRef ? (
                              <span className="block text-[9px] text-slate-400 font-mono mt-0.5">{row.invoiceRef}</span>
                            ) : null}
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-800 font-medium">{row.customerNote || '-'}</span>
                            {row.invoiceRef ? (
                              <span className="block text-[9px] text-slate-400 font-mono mt-0.5">{row.invoiceRef}</span>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(row)}
                            className="rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-brand-600"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(row)}
                            className="rounded p-1 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-500">
                    Belum ada data mutasi keuangan pada periode ini.
                  </td>
                </tr>
              )}

              {/* Baris Footer JUMLAH / SALDO AKHIR Sesuai Format Excel */}
              <tr className="border-t-2 border-b-4 border-double border-slate-800 bg-slate-100 font-extrabold text-slate-900">
                <td colSpan={3} className="border border-slate-300 px-3 py-2.5 text-center tracking-wider">
                  JUMLAH/SALDO AKHIR
                </td>
                <td className="border border-slate-300 px-2 py-2.5 text-center">
                  {totals.inDus > 0 ? totals.inDus : ''}
                </td>
                <td className="border border-slate-300 px-2 py-2.5 text-center font-black">
                  {totals.outDus}
                </td>
                <td className="border border-slate-300 px-2 py-2.5 text-center">
                  {totals.outBns}
                </td>
                <td className="border border-slate-300 px-2 py-2.5 text-center text-sky-800 font-black">
                  {endingStock}
                </td>
                <td className="border border-slate-300 px-3 py-2.5 text-right font-black">
                  {formatNumber(totals.omzet)}
                </td>
                <td className="border border-slate-300 px-3 py-2.5 text-right text-amber-800 font-black">
                  {formatNumber(totals.magati)}
                </td>
                <td className="border border-slate-300 px-3 py-2.5 text-right text-slate-600">
                  {totals.modal > 0 ? formatNumber(totals.modal) : '-'}
                </td>
                <td className="border border-slate-300 px-3 py-2.5 text-right text-emerald-800">
                  {totals.tfSaldo > 0 ? formatNumber(totals.tfSaldo) : ''}
                </td>
                <td className="border border-slate-300 px-3 py-2.5 text-right text-emerald-800 font-black">
                  {formatNumber(endingCash)}
                </td>
                <td colSpan={2} className="border border-slate-300 px-3 py-2.5 text-center text-[11px] text-slate-500">
                  Tersinkronisasi
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL 1: PENGATURAN PARAMETER KEUANGAN */}
      <Modal
        open={settingsOpen}
        onClose={() => !savingSettings && setSettingsOpen(false)}
        title="Pengaturan Parameter Laporan Keuangan"
        description="Atur saldo awal, besaran fee Magati, fee pembawa/sales, dan judul laporan."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSettingsOpen(false)} disabled={savingSettings}>
              Batal
            </Button>
            <Button onClick={handleSaveSettings} loading={savingSettings} icon={CheckCircle2}>
              Simpan Pengaturan
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Saldo Awal Kas / Uang (Rp)"
              type="number"
              min="0"
              value={settingsForm.initialCash}
              onChange={(e) => setSettingsForm({ ...settingsForm, initialCash: e.target.value })}
              hint="Contoh: 626000"
              required
            />
            <Input
              label="Saldo Awal Barang (Pcs)"
              type="number"
              min="0"
              value={settingsForm.initialStockPcs}
              onChange={(e) => setSettingsForm({ ...settingsForm, initialStockPcs: e.target.value })}
              hint="Contoh: 133"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Harga Jual Eceran (Rp)"
              type="number"
              min="0"
              step="1000"
              value={settingsForm.retailPrice}
              onChange={(e) => setSettingsForm({ ...settingsForm, retailPrice: e.target.value })}
              hint="Pembelian < 20 pcs (Rp 50.000)"
            />
            <Input
              label="Harga Jual Grosir (Rp)"
              type="number"
              min="0"
              step="1000"
              value={settingsForm.wholesalePrice}
              onChange={(e) => setSettingsForm({ ...settingsForm, wholesalePrice: e.target.value })}
              hint="Pembelian >= 20 pcs (Rp 45.000)"
            />
            <Input
              label="Minimal Pcs Grosir"
              type="number"
              min="1"
              value={settingsForm.wholesaleMinQty}
              onChange={(e) => setSettingsForm({ ...settingsForm, wholesaleMinQty: e.target.value })}
              hint="Default: 20 pcs"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-xs font-bold text-slate-800">Fee Magati</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Eceran (<20)"
                  type="number"
                  min="0"
                  value={settingsForm.magatiFeeRetail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, magatiFeeRetail: e.target.value })}
                  hint="Rp 5.000"
                />
                <Input
                  label="Grosir (>=20)"
                  type="number"
                  min="0"
                  value={settingsForm.magatiFeeWholesale}
                  onChange={(e) => setSettingsForm({ ...settingsForm, magatiFeeWholesale: e.target.value })}
                  hint="Rp 2.000"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-xs font-bold text-slate-800">Fee Sales / Pembawa</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Eceran (<20)"
                  type="number"
                  min="0"
                  value={settingsForm.salesFeeRetail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, salesFeeRetail: e.target.value })}
                  hint="Rp 5.000"
                />
                <Input
                  label="Grosir (>=20)"
                  type="number"
                  min="0"
                  value={settingsForm.salesFeeWholesale}
                  onChange={(e) => setSettingsForm({ ...settingsForm, salesFeeWholesale: e.target.value })}
                  hint="Rp 3.000"
                />
              </div>
            </div>
          </div>

          <Input
            label="Nama Pembawa Default (Sales / Kasir)"
            value={settingsForm.defaultSalesName}
            onChange={(e) => setSettingsForm({ ...settingsForm, defaultSalesName: e.target.value })}
            placeholder="Contoh: Pak bambang"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nama Produk di Judul Laporan"
              value={settingsForm.reportProductTitle}
              onChange={(e) => setSettingsForm({ ...settingsForm, reportProductTitle: e.target.value })}
              placeholder="Contoh: SUSU KAMBING GIARVA"
            />
            <Input
              label="Periode Laporan"
              value={settingsForm.reportPeriod}
              onChange={(e) => setSettingsForm({ ...settingsForm, reportPeriod: e.target.value })}
              placeholder="Contoh: BULAN JULI 2025"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 2: FORM TAMBAH / EDIT MUTASI KEUANGAN (CRUD) */}
      <Modal
        open={modalOpen}
        onClose={() => !savingRecord && setModalOpen(false)}
        title={editingRecord ? 'Edit Mutasi Keuangan' : 'Catat Mutasi Keuangan Baru'}
        description="Lengkapi detail mutasi kas dan keluar-masuk barang."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={savingRecord}>
              Batal
            </Button>
            <Button onClick={handleSaveRecord} loading={savingRecord} icon={CheckCircle2}>
              {editingRecord ? 'Simpan Perubahan' : 'Tambahkan Mutasi'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Tanggal Transaksi"
              type="date"
              value={recordForm.date}
              onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
              required
            />
            <Input
              label="Keterangan (Pembawa / Kasir)"
              value={recordForm.keterangan}
              onChange={(e) => setRecordForm({ ...recordForm, keterangan: e.target.value })}
              placeholder="Contoh: Pak bambang"
              required
            />
            <Input
              label="Keterangan Pelanggan"
              value={recordForm.customerNote}
              onChange={(e) => setRecordForm({ ...recordForm, customerNote: e.target.value })}
              placeholder="Contoh: Ibu Yayuk, Rumah, dll"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <p className="mb-2 text-xs font-bold text-slate-800">Mutasi Fisik Barang</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="IN (Masuk Dus/Pcs)"
                type="number"
                min="0"
                value={recordForm.inDus}
                onChange={(e) => setRecordForm({ ...recordForm, inDus: e.target.value })}
                hint="Stok masuk / restock"
              />
              <Input
                label="Out (Keluar Dus/Pcs)"
                type="number"
                min="0"
                value={recordForm.outDus}
                onChange={(e) => handleOutDusChange(e.target.value)}
                hint="Jumlah item keluar / terjual"
              />
              <Input
                label="Out Bns (Bonus Dus/Pcs)"
                type="number"
                min="0"
                value={recordForm.outBnsDus}
                onChange={(e) => setRecordForm({ ...recordForm, outBnsDus: e.target.value })}
                hint="Pengambilan bonus barang"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <p className="mb-2 text-xs font-bold text-slate-800">Transaksi Keuangan & Kas</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="OMZET (Penjualan Rp)"
                type="number"
                min="0"
                value={recordForm.omzet}
                onChange={(e) => setRecordForm({ ...recordForm, omzet: e.target.value })}
                hint="Total nilai transaksi"
              />
              <Input
                label="Pendapatan Magati (Rp)"
                type="number"
                min="0"
                value={recordForm.magatiFee}
                onChange={(e) => setRecordForm({ ...recordForm, magatiFee: e.target.value })}
                hint="Fee Magati (otomatis terhitung)"
              />
              <Input
                label="Fee Pembawa / Sales (Rp)"
                type="number"
                min="0"
                value={recordForm.salesFee}
                onChange={(e) => setRecordForm({ ...recordForm, salesFee: e.target.value })}
                hint="Fee untuk pembawa"
              />
              <Input
                label="Uang Modal / HPP (Rp)"
                type="number"
                min="0"
                value={recordForm.uangModal}
                onChange={(e) => setRecordForm({ ...recordForm, uangModal: e.target.value })}
                hint="Harga pokok"
              />
              <Input
                label="TF Saldo (Kas Masuk Transfer Rp)"
                type="number"
                min="0"
                value={recordForm.tfSaldo}
                onChange={(e) => setRecordForm({ ...recordForm, tfSaldo: e.target.value })}
                hint="Setoran saldo ke kas"
              />
              <Input
                label="Kas Keluar / Operasional (Rp)"
                type="number"
                min="0"
                value={recordForm.cashOut}
                onChange={(e) => setRecordForm({ ...recordForm, cashOut: e.target.value })}
                hint="Pengurangan saldo kas"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: KONFIRMASI HAPUS */}
      <Modal
        open={Boolean(deleteConfirm)}
        onClose={() => !deleting && setDeleteConfirm(null)}
        title="Hapus Entri Mutasi?"
        description={`Apakah Anda yakin ingin menghapus baris mutasi ${deleteConfirm?.date} - ${deleteConfirm?.customerNote || deleteConfirm?.keterangan}?`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
              Batal
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDeleteRecord}
              loading={deleting}
              icon={Trash2}
            >
              Hapus
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600">
          Tindakan ini akan menghapus entri dari buku kas dan menyesuaikan perhitungan saldo kas & stok berjalan secara real-time.
        </p>
      </Modal>
    </div>
  )
}
