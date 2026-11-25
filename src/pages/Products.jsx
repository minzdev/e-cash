import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Boxes,
  Package,
  PackagePlus,
  PackageX,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { api } from '../lib/api'
import { lowStockProducts, inventoryValue, soldOutProducts } from '../lib/analytics'
import { CATEGORIES, PRODUCT_EMOJIS, slugSku } from '../lib/constants'
import { formatNumber, formatRupiah } from '../lib/format'
import { cn } from '../lib/cn'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeading,
  Select,
  Skeleton,
  Toggle,
} from '../components/ui'

function ProductForm({ open, onClose, product, onSaved }) {
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      product
        ? {
            name: product.name || '',
            sku: product.sku || '',
            category: product.category || '',
            price: String(product.price ?? ''),
            cost: String(product.cost ?? ''),
            stock: String(product.stock ?? ''),
            minStock: String(product.minStock ?? ''),
            unit: product.unit || 'Pcs',
            emoji: product.emoji || '📦',
            active: product.active !== false,
          }
        : {
            name: '',
            sku: '',
            category: '',
            price: '',
            cost: '',
            stock: '0',
            minStock: '5',
            unit: 'Pcs',
            emoji: '📦',
            active: true,
          },
    )
  }, [open, product])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!form.name?.trim()) nextErrors.name = 'Nama produk wajib diisi.'
    if (form.price === '' || Number(form.price) < 0) nextErrors.price = 'Harga jual tidak valid.'
    if (form.cost !== '' && Number(form.cost) < 0) nextErrors.cost = 'Harga modal tidak valid.'
    if (Number(form.stock) < 0) nextErrors.stock = 'Stok tidak boleh negatif.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        sku:
          form.sku.trim() ||
          `${slugSku(form.name)}-${Math.floor(Math.random() * 90 + 10)}`,
        category: form.category?.trim() || 'Lainnya',
        price: Number(form.price) || 0,
        cost: Number(form.cost) || 0,
        stock: Number(form.stock) || 0,
        minStock: Number(form.minStock) || 0,
        unit: form.unit?.trim() || 'Pcs',
        emoji: form.emoji || '📦',
        active: form.active !== false,
      }
      if (product?.id) {
        await api.updateProduct(product.id, payload)
        toast.success('Produk berhasil diperbarui')
      } else {
        await api.createProduct(payload)
        toast.success('Produk baru berhasil ditambahkan')
      }
      onSaved?.()
      onClose?.()
    } catch (error) {
      toast.error(error.message || 'Gagal menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? 'Edit produk' : 'Tambah produk'}
      description={product ? 'Perbarui detail dan ketersediaan produk.' : 'Lengkapi detail produk baru Anda.'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button size="md" onClick={handleSubmit} loading={saving}>
            {product ? 'Simpan perubahan' : 'Simpan produk'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
            {form.emoji || '📦'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">{form.name || 'Nama produk baru'}</p>
            <p className="text-xs text-slate-500">
              {formatRupiah(Number(form.price) || 0)} · {form.category || 'Kategori belum diisi'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Nama produk"
            value={form.name || ''}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Contoh: Kopi Susu Gula Aren"
            error={errors.name}
            required
          />
          <Input
            label="SKU"
            value={form.sku || ''}
            onChange={(event) => update('sku', event.target.value)}
            placeholder="Otomatis dari nama"
            hint="Boleh dikosongkan, SKU dibuat otomatis."
          />
          <Input
            label="Kategori"
            list="category-options"
            value={form.category || ''}
            onChange={(event) => update('category', event.target.value)}
            placeholder="Kopi, Makanan, Snack…"
          />
          <datalist id="category-options">
            {CATEGORIES.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <Input
            label="Satuan"
            value={form.unit || ''}
            onChange={(event) => update('unit', event.target.value)}
            placeholder="Cup, Pcs, Porsi"
          />
          <Input
            label="Harga jual (Rp)"
            type="number"
            min="0"
            value={form.price}
            onChange={(event) => update('price', event.target.value)}
            placeholder="0"
            error={errors.price}
            required
          />
          <Input
            label="Harga modal (Rp)"
            type="number"
            min="0"
            value={form.cost}
            onChange={(event) => update('cost', event.target.value)}
            placeholder="0"
            hint="Dipakai untuk perhitungan laba."
            error={errors.cost}
          />
          <Input
            label={product ? 'Stok saat ini' : 'Stok awal'}
            type="number"
            min="0"
            value={form.stock}
            onChange={(event) => update('stock', event.target.value)}
            error={errors.stock}
          />
          <Input
            label="Stok minimum"
            type="number"
            min="0"
            value={form.minStock}
            onChange={(event) => update('minStock', event.target.value)}
            hint="Peringatan muncul saat stok ≤ nilai ini."
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-700">Ikon produk</p>
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
            {PRODUCT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => update('emoji', emoji)}
                className={cn(
                  'flex h-9 items-center justify-center rounded-lg border text-base transition',
                  form.emoji === emoji
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
                aria-label={`Pilih ikon ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <Toggle
            checked={form.active !== false}
            onChange={(value) => update('active', value)}
            label="Produk aktif"
            description="Produk nonaktif tidak tampil di halaman kasir."
          />
        </div>

        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}

function RestockDialog({ product, onClose, onSaved }) {
  const { user } = useAuth()
  const [qty, setQty] = useState('10')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setQty('10')
      setNote('')
    }
  }, [product])

  async function handleSubmit(event) {
    event.preventDefault()
    const amount = Number(qty)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Jumlah restock harus lebih dari 0.')
      return
    }
    setSaving(true)
    try {
      await api.adjustStock(product.id, amount, {
        type: 'restock',
        note,
        userId: user?.uid,
      })
      toast.success(`Stok ${product.name} bertambah ${amount}`)
      onSaved?.()
      onClose?.()
    } catch (error) {
      toast.error(error.message || 'Gagal menambah stok')
    } finally {
      setSaving(false)
    }
  }

  if (!product) return null

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      title="Restock produk"
      description={product.name}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button size="md" onClick={handleSubmit} loading={saving} icon={PackagePlus}>
            Tambah stok
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
            {product.emoji || '📦'}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">{product.name}</p>
            <p className="text-xs text-slate-500">
              Stok sekarang <span className="font-bold text-slate-700">{product.stock}</span> {product.unit}
            </p>
          </div>
        </div>
        <Input
          label="Jumlah tambahan"
          type="number"
          min="1"
          value={qty}
          onChange={(event) => setQty(event.target.value)}
          autoFocus
          required
        />
        <div className="flex flex-wrap gap-1.5">
          {[5, 10, 20, 50, 100].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setQty(String(amount))}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              +{amount}
            </button>
          ))}
        </div>
        <Input
          label="Catatan"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Contoh: pembelian dari supplier"
        />
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-[11px] text-brand-700">
          Stok setelah restock:{' '}
          <span className="font-bold">
            {Number(product.stock) + (Number(qty) || 0)} {product.unit}
          </span>
        </p>
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}

export default function Products() {
  const { products, loadingProducts } = useStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [status, setStatus] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [restocking, setRestocking] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const categories = useMemo(
    () => ['Semua', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  )
  const lowStock = useMemo(() => lowStockProducts(products), [products])
  const outOfStock = useMemo(() => soldOutProducts(products), [products])
  const inventory = useMemo(() => inventoryValue(products), [products])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return products.filter((product) => {
      if (category !== 'Semua' && product.category !== category) return false
      if (status === 'low' && !(Number(product.stock) > 0 && Number(product.stock) <= Number(product.minStock ?? 0))) {
        return false
      }
      if (status === 'out' && Number(product.stock) > 0) return false
      if (status === 'inactive' && product.active !== false) return false
      if (status === 'active' && product.active === false) return false
      if (!keyword) return true
      return (
        product.name.toLowerCase().includes(keyword) ||
        String(product.sku || '').toLowerCase().includes(keyword)
      )
    })
  }, [products, category, status, search])

  async function handleSeed() {
    setSeeding(true)
    try {
      const count = await api.seedProducts()
      toast.success(count ? `${count} produk contoh ditambahkan` : 'Produk sudah tersedia')
    } catch (error) {
      toast.error(error.message || 'Gagal menambahkan produk contoh')
    } finally {
      setSeeding(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      await api.deleteProduct(deleting.id)
      toast.success('Produk dihapus')
      setDeleting(null)
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus produk')
    } finally {
      setDeletingBusy(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(product) {
    setEditing(product)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Produk & Stok"
        description="Kelola katalog, harga, dan ketersediaan produk Anda."
        action={
          <>
            {products.length === 0 ? (
              <Button variant="secondary" size="md" onClick={handleSeed} loading={seeding} icon={Sparkles}>
                Data contoh
              </Button>
            ) : null}
            <Button size="md" icon={Plus} onClick={openCreate}>
              Tambah produk
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Total produk', value: formatNumber(products.length), icon: Boxes, tone: 'bg-sky-50 text-sky-600' },
          { label: 'Stok menipis', value: formatNumber(lowStock.length), icon: AlertTriangle, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Stok habis', value: formatNumber(outOfStock.length), icon: PackageX, tone: 'bg-rose-50 text-rose-600' },
          { label: 'Nilai inventori', value: formatRupiah(inventory), icon: Wallet, tone: 'bg-brand-50 text-brand-600' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-[11px] font-semibold text-slate-500">{stat.label}</p>
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', stat.tone)}>
                <stat.icon size={16} />
              </span>
            </div>
            <p className="mt-2 truncate text-lg font-extrabold text-slate-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama produk atau SKU…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 sm:w-40">
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === 'Semua' ? 'Semua kategori' : item}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 sm:w-40">
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="low">Stok menipis</option>
              <option value="out">Stok habis</option>
              <option value="inactive">Nonaktif</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loadingProducts ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Katalog masih kosong"
            description="Tambahkan produk pertama Anda, atau muat data contoh untuk mencoba lebih cepat."
            action={
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleSeed} loading={seeding} icon={Sparkles}>
                  Muat data contoh
                </Button>
                <Button size="sm" onClick={openCreate} icon={Plus}>
                  Tambah produk
                </Button>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Produk tidak ditemukan"
            description="Coba ubah kata kunci, kategori, atau status filter."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setCategory('Semua')
                  setStatus('all')
                }}
              >
                Reset filter
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Produk</th>
                    <th className="px-3 py-3">Kategori</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right">Harga jual</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right">Modal</th>
                    <th className="whitespace-nowrap px-3 py-3">Stok</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((product) => {
                    const stock = Number(product.stock) || 0
                    const min = Number(product.minStock) || 0
                    const isOut = stock <= 0
                    const isLow = stock > 0 && stock <= min
                    return (
                      <tr key={product.id} className="transition hover:bg-slate-50/60">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base">
                              {product.emoji || '📦'}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-800">{product.name}</p>
                              <p className="font-mono text-[10px] text-slate-400">{product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone="slate">{product.category || 'Lainnya'}</Badge>
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-slate-800">
                          {formatRupiah(product.price)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500">{formatRupiah(product.cost)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              'text-xs font-bold',
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-700',
                            )}
                          >
                            {stock}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {' '}
                            / min {min} {product.unit}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {product.active === false ? (
                            <Badge tone="slate">Nonaktif</Badge>
                          ) : isOut ? (
                            <Badge tone="rose" dot>
                              Habis
                            </Badge>
                          ) : isLow ? (
                            <Badge tone="amber" dot>
                              Menipis
                            </Badge>
                          ) : (
                            <Badge tone="green" dot>
                              Tersedia
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="Edit produk"
                              aria-label={`Edit ${product.name}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRestocking(product)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                              title="Restock"
                              aria-label={`Restock ${product.name}`}
                            >
                              <PackagePlus size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(product)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                              title="Hapus produk"
                              aria-label={`Hapus ${product.name}`}
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

            <div className="divide-y divide-slate-100 xl:hidden">
              {filtered.map((product) => {
                const stock = Number(product.stock) || 0
                const min = Number(product.minStock) || 0
                const isOut = stock <= 0
                const isLow = stock > 0 && stock <= min
                return (
                  <div key={product.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                        {product.emoji || '📦'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800">{product.name}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-slate-400">{product.sku}</p>
                          </div>
                          {product.active === false ? (
                            <Badge tone="slate">Nonaktif</Badge>
                          ) : isOut ? (
                            <Badge tone="rose">Habis</Badge>
                          ) : isLow ? (
                            <Badge tone="amber">Menipis</Badge>
                          ) : (
                            <Badge tone="green">Tersedia</Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                          <span className="font-bold text-slate-800">{formatRupiah(product.price)}</span>
                          <span className="text-slate-400">Modal {formatRupiah(product.cost)}</span>
                          <span
                            className={cn(
                              'font-semibold',
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-500',
                            )}
                          >
                            Stok {stock} {product.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => setRestocking(product)} icon={PackagePlus}>
                        Restock
                      </Button>
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(product)} icon={Pencil}>
                        Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDeleting(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Hapus ${product.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400">
              Menampilkan {filtered.length} dari {products.length} produk
            </div>
          </>
        )}
      </Card>

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editing}
        onSaved={() => setEditing(null)}
      />

      <RestockDialog
        product={restocking}
        onClose={() => setRestocking(null)}
        onSaved={() => setRestocking(null)}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Hapus produk?"
        description="Tindakan ini tidak dapat dibatalkan."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setDeleting(null)} disabled={deletingBusy}>
              Batal
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete} loading={deletingBusy} icon={Trash2}>
              Hapus produk
            </Button>
          </div>
        }
      >
        <div className="rounded-xl bg-rose-50 p-4 text-center ring-1 ring-inset ring-rose-100">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
            <Trash2 size={18} />
          </span>
          <p className="mt-2.5 text-sm font-bold text-slate-800">{deleting?.name}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Riwayat transaksi yang sudah ada tetap tersimpan, namun produk ini akan hilang dari
            katalog dan halaman kasir.
          </p>
        </div>
      </Modal>
    </div>
  )
}
