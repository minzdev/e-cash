import { useMemo, useState } from 'react'
import {
  Coins,
  Edit2,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../context/StoreContext'
import { api } from '../lib/api'
import { formatDate, formatRupiah } from '../lib/format'
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
  const { salesPersons, loadingSalesPersons, settings } = useStore()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    feePerPcs: 0,
    active: true,
  })

  // Buka modal tambah
  function handleOpenCreate() {
    setEditingPerson(null)
    setForm({
      name: '',
      feePerPcs: Number(settings?.salesFeePerPcs) || 0,
      active: true,
    })
    setModalOpen(true)
  }

  // Buka modal edit
  function handleOpenEdit(person) {
    setEditingPerson(person)
    setForm({
      name: person.name || '',
      feePerPcs: Number(person.feePerPcs) || 0,
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
        feePerPcs: Math.max(0, Number(form.feePerPcs) || 0),
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
        feePerPcs: person.feePerPcs,
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-semibold uppercase tracking-wider">Default Fee / Pcs</span>
            <Coins size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatRupiah(settings?.salesFeePerPcs || 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Dapat diatur per sales individu</p>
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
            <table className="w-full min-w-[700px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                  <th className="px-3 py-3 text-center w-12">NO</th>
                  <th className="px-4 py-3 text-left">NAMA SALES / PEMBAWA</th>
                  <th className="px-4 py-3 text-right w-44">FEE PER PCS</th>
                  <th className="px-4 py-3 text-center w-36">STATUS</th>
                  <th className="px-4 py-3 text-center w-40">TANGGAL DIBUAT</th>
                  <th className="px-4 py-3 text-center w-28">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((person, index) => {
                  const isActive = person.active !== false
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
                      <td className="px-4 py-3 text-right font-bold text-amber-700">
                        {formatRupiah(person.feePerPcs || 0)}
                        <span className="ml-1 text-[10px] font-normal text-slate-400">/ pcs</span>
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

          <Input
            label="Fee per Pcs (Rp)"
            type="number"
            min="0"
            step="500"
            placeholder="0"
            helperText="Besaran komisi yang diterima per pcs barang terjual oleh sales ini."
            value={form.feePerPcs}
            onChange={(e) => setForm((prev) => ({ ...prev, feePerPcs: e.target.value }))}
          />

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
