import { useMemo, useState } from 'react'
import {
  Banknote,
  Coins,
  Edit2,
  PackageCheck,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../context/StoreContext'
import { api } from '../lib/api'
import { formatDate, formatNumber, formatRupiah } from '../lib/format'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeading,
  Skeleton,
  Toggle,
} from '../components/ui'

export default function SalesPersons() {
  const { salesPersons, loadingSalesPersons, settings, financeRecords } = useStore()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    feeRetail: 5000,
    feeWholesale: 3000,
    active: true,
  })

  // Buka modal tambah
  function handleOpenCreate() {
    setEditingPerson(null)
    setForm({
      name: '',
      feeRetail: Number(settings?.salesFeeRetail ?? 5000),
      feeWholesale: Number(settings?.salesFeeWholesale ?? 3000),
      active: true,
    })
    setModalOpen(true)
  }

  // Buka modal edit
  function handleOpenEdit(person) {
    setEditingPerson(person)
    setForm({
      name: person.name || '',
      feeRetail: person.feeRetail !== undefined ? Number(person.feeRetail) : Number(person.feePerPcs ?? settings?.salesFeeRetail ?? 5000),
      feeWholesale: person.feeWholesale !== undefined ? Number(person.feeWholesale) : Number(person.feePerPcs ?? settings?.salesFeeWholesale ?? 3000),
      active: person.active !== false,
    })
    setModalOpen(true)
  }

  // Simpan Sales (Create / Update)
  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Nama sales / pembawa tidak boleh kosong')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        feeRetail: Math.max(0, Number(form.feeRetail) || 0),
        feeWholesale: Math.max(0, Number(form.feeWholesale) || 0),
        feePerPcs: Math.max(0, Number(form.feeWholesale) || 0), // fallback
        active: form.active !== false,
      }

      if (editingPerson?.id) {
        await api.updateSalesPerson(editingPerson.id, payload)
        toast.success('Data sales berhasil diperbarui')
      } else {
        await api.createSalesPerson(payload)
        toast.success('Sales baru berhasil ditambahkan')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data sales')
    } finally {
      setSaving(false)
    }
  }

  // Hapus Sales
  async function handleDelete() {
    if (!deleteConfirm?.id) return
    setDeleting(true)
    try {
      await api.deleteSalesPerson(deleteConfirm.id)
      toast.success('Sales berhasil dihapus')
      setDeleteConfirm(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus sales')
    } finally {
      setDeleting(false)
    }
  }

  // Quick toggle status aktif/nonaktif
  async function handleToggleActive(person) {
    try {
      await api.updateSalesPerson(person.id, {
        name: person.name,
        feeRetail: person.feeRetail,
        feeWholesale: person.feeWholesale,
        feePerPcs: person.feeWholesale || person.feePerPcs,
        active: !person.active,
      })
      toast.success(
        person.active
          ? `${person.name} dinonaktifkan`
          : `${person.name} diaktifkan kembali`,
      )
    } catch (err) {
      toast.error('Gagal memperbarui status sales')
    }
  }

  // Hitung akumulasi real-time komisi fee, total transaksi, dan total pcs per sales
  const salesStatsMap = useMemo(() => {
    const map = {}
    ;(salesPersons || []).forEach((p) => {
      map[p.id] = { totalTx: 0, totalPcs: 0, totalFee: 0, totalOmzet: 0 }
    })

    const records = financeRecords || []
    records.forEach((rec) => {
      if (rec.type === 'void') return
      // Cocokkan berdasarkan salesPersonId atau nama keterangan
      const matched = (salesPersons || []).find((p) =>
        (rec.salesPersonId && p.id === rec.salesPersonId) ||
        (rec.keterangan && p.name && rec.keterangan.trim().toLowerCase() === p.name.trim().toLowerCase())
      )

      if (matched) {
        if (!map[matched.id]) {
          map[matched.id] = { totalTx: 0, totalPcs: 0, totalFee: 0, totalOmzet: 0 }
        }
        const pcs = Number(rec.outDus) || 0
        const fee = Number(rec.salesFee) || 0
        const omz = Number(rec.omzet) || 0
        map[matched.id].totalTx += 1
        map[matched.id].totalPcs += pcs
        map[matched.id].totalFee += fee
        map[matched.id].totalOmzet += omz
      }
    })

    return map
  }, [salesPersons, financeRecords])

  const totalAccumulatedFee = useMemo(() => {
    return Object.values(salesStatsMap).reduce((sum, s) => sum + (s.totalFee || 0), 0)
  }, [salesStatsMap])

  const totalAccumulatedPcs = useMemo(() => {
    return Object.values(salesStatsMap).reduce((sum, s) => sum + (s.totalPcs || 0), 0)
  }, [salesStatsMap])

  // Filter list
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (salesPersons || []).filter((p) => {
      if (!q) return true
      return p.name?.toLowerCase().includes(q)
    })
  }, [salesPersons, search])

  // Summary stats
  const stats = useMemo(() => {
    const list = salesPersons || []
    const total = list.length
    const active = list.filter((p) => p.active !== false).length
    const inactive = total - active
    return { total, active, inactive }
  }, [salesPersons])

  return (
    <div className="space-y-4">
      <PageHeading
        title="Sales & Pembawa Pelanggan"
        description="Kelola daftar sales/pembawa pelanggan yang membawa penjualan beserta besaran fee per pcs."
        action={
          <Button size="md" icon={UserPlus} onClick={handleOpenCreate}>
            Tambah Sales Baru
          </Button>
        }
      />

      {/* Stat Cards Realtime */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
            <Users size={18} className="text-brand-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-[11px] text-slate-400">Terdaftar di sistem kasir</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-semibold uppercase tracking-wider">Sales Aktif</span>
            <UserCheck size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">{stats.active}</p>
          <p className="mt-1 text-[11px] text-slate-400">Dapat dipilih langsung di Kasir</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold uppercase tracking-wider">Total Fee Didapat (Realtime)</span>
            <Banknote size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">{formatRupiah(totalAccumulatedFee)}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">Akumulasi komisi seluruh sales</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-bold uppercase tracking-wider">Barang Terjual via Sales</span>
            <PackageCheck size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{totalAccumulatedPcs} Pcs</p>
          <p className="mt-1 text-[11px] text-slate-500">Total volume penjualan sales</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama sales atau pembawa..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
      </Card>

      {/* Daftar Sales Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        {loadingSalesPersons ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Sales tidak ditemukan' : 'Belum ada data sales/pembawa'}
            description={
              search
                ? 'Tidak ada sales yang cocok dengan kata kunci pencarian.'
                : 'Tambahkan sales atau pembawa pelanggan agar transaksi kasir dapat otomatis mencatat komisi fee.'
            }
            action={
              !search ? (
                <Button size="sm" icon={Plus} onClick={handleOpenCreate}>
                  Tambah Sales Pertama
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                  <th className="px-3 py-3 text-center w-12">NO</th>
                  <th className="px-4 py-3 text-left">NAMA SALES / PEMBAWA</th>
                  <th className="px-4 py-3 text-right w-44">TARIF KOMISI / PCS</th>
                  <th className="px-4 py-3 text-center w-36">BARANG TERJUAL</th>
                  <th className="px-4 py-3 text-right w-48">TOTAL FEE (REALTIME)</th>
                  <th className="px-4 py-3 text-center w-28">STATUS</th>
                  <th className="px-4 py-3 text-center w-32">TGL DIBUAT</th>
                  <th className="px-4 py-3 text-center w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((person, index) => {
                  const isActive = person.active !== false
                  const pStats = salesStatsMap[person.id] || { totalTx: 0, totalPcs: 0, totalFee: 0 }
                  return (
                    <tr key={person.id} className="transition hover:bg-slate-50/80">
                      <td className="px-3 py-3 text-center text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${
                              isActive
                                ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-100'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {person.name?.[0]?.toUpperCase() || 'S'}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">{person.name}</p>
                            <p className="text-[10px] text-slate-400">ID: {person.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-slate-800">
                            Eceran: <span className="font-bold text-brand-700">{formatRupiah(person.feeRetail !== undefined ? person.feeRetail : (person.feePerPcs ?? 5000))}</span>
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Grosir: <span className="font-bold text-amber-700">{formatRupiah(person.feeWholesale !== undefined ? person.feeWholesale : (person.feePerPcs ?? 3000))}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-slate-800">{pStats.totalPcs} Pcs</span>
                          <span className="text-[10px] text-slate-400">{pStats.totalTx} transaksi</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-extrabold text-emerald-700">
                            {formatRupiah(pStats.totalFee)}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Realtime
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(person)}
                          className="cursor-pointer"
                          title="Klik untuk ubah status aktif/nonaktif"
                        >
                          {isActive ? (
                            <Badge tone="green" dot>
                              Aktif
                            </Badge>
                          ) : (
                            <Badge tone="rose" dot>
                              Nonaktif
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 whitespace-nowrap">
                        {person.createdAt ? formatDate(person.createdAt) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(person)}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-brand-600"
                            title="Edit Sales"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(person)}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Hapus Sales"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Tambah / Edit Sales */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPerson ? 'Edit Data Sales / Pembawa' : 'Tambah Sales / Pembawa Baru'}
        description="Sales ini akan muncul sebagai opsi pilihan di kasir dan tercatat dalam buku kas."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button loading={saving} onClick={handleSave}>
              Simpan Sales
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nama Sales / Pembawa *"
            placeholder="Contoh: Pak Bambang, Mas Rian"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
            autoFocus
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Fee Eceran per Pcs (Rp)"
              type="number"
              min="0"
              step="500"
              placeholder="5000"
              helperText="Komisi untuk penjualan eceran (< 20 pcs). Default Rp 5.000"
              value={form.feeRetail}
              onChange={(e) => setForm((prev) => ({ ...prev, feeRetail: e.target.value }))}
            />
            <Input
              label="Fee Grosir per Pcs (Rp)"
              type="number"
              min="0"
              step="500"
              placeholder="3000"
              helperText="Komisi untuk penjualan grosir (≥ 20 pcs). Default Rp 3.000"
              value={form.feeWholesale}
              onChange={(e) => setForm((prev) => ({ ...prev, feeWholesale: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div>
              <p className="text-xs font-bold text-slate-800">Status Aktif</p>
              <p className="text-[11px] text-slate-500">
                Jika dinonaktifkan, nama tidak akan muncul di opsi pilihan kasir.
              </p>
            </div>
            <Toggle
              checked={form.active}
              onChange={(val) => setForm((prev) => ({ ...prev, active: val }))}
            />
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus Sales / Pembawa?"
        description={`Anda yakin ingin menghapus "${deleteConfirm?.name}"? Transaksi sebelumnya tetap aman tercatat.`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Ya, Hapus
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600">
          Tindakan ini tidak dapat dibatalkan. Riwayat transaksi yang sudah tersimpan di buku kas tidak akan terhapus.
        </p>
      </Modal>
    </div>
  )
}
