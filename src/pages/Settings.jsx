import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Landmark,
  LogOut,
  ReceiptText,
  Save,
  Store,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { api } from '../lib/api'
import { DEFAULT_SETTINGS, PRODUCT_EMOJIS } from '../lib/constants'
import { formatRupiah } from '../lib/format'
import { compressImageFile, isImageLogo } from '../lib/image'
import { cn } from '../lib/cn'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  PageHeading,
  Textarea,
  Toggle,
} from '../components/ui'
import ReceiptView from '../components/ReceiptView'

const LOGO_OPTIONS = ['☕', '🍰', '🍔', '🏪', '🛒', '🧾', '🍜', '🥐', '🍩', '🧋']

export default function SettingsPage() {
  const { settings, products } = useStore()
  const { user, logout, isDemo } = useAuth()
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!dirty) setForm({ ...DEFAULT_SETTINGS, ...settings })
  }, [settings, dirty])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  async function handleSave() {
    if (!form.storeName?.trim()) {
      toast.error('Nama toko wajib diisi.')
      return
    }
    const rate = Number(form.taxRate)
    if (form.taxEnabled && (!Number.isFinite(rate) || rate < 0 || rate > 100)) {
      toast.error('Tarif pajak harus antara 0 dan 100.')
      return
    }
    setSaving(true)
    try {
      const { updatedAt, ...rest } = form
      await api.saveSettings({
        ...rest,
        storeName: form.storeName.trim(),
        taxRate: Number(form.taxRate) || 0,
        lowStockDefault: Number(form.lowStockDefault) || 0,
        initialCash: Number(form.initialCash) || 0,
        initialStockPcs: Number(form.initialStockPcs) || 0,
        magatiFeePerPcs: Number(form.magatiFeePerPcs) || 0,
        salesFeePerPcs: Number(form.salesFeePerPcs) || 0,
        defaultSalesName: String(form.defaultSalesName || 'Pak bambang').trim(),
        reportProductTitle: String(form.reportProductTitle || 'SUSU KAMBING GIARVA').trim(),
        reportPeriod: String(form.reportPeriod || 'BULAN JULI 2025').trim(),
      })
      setDirty(false)
      toast.success('Pengaturan berhasil disimpan')
    } catch (error) {
      toast.error(error.message || 'Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const previewSale = useMemo(() => {
    const items = (products.length ? products.slice(0, 2) : [
      { id: 'sample', name: 'Contoh Produk', price: 20000, emoji: '📦' },
    ]).map((product) => ({
      productId: product.id,
      name: product.name,
      emoji: product.emoji || '📦',
      price: Number(product.price) || 0,
      qty: 1,
      subtotal: Number(product.price) || 0,
    }))
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const taxRate = form.taxEnabled ? Number(form.taxRate) || 0 : 0
    const tax = Math.round((subtotal * taxRate) / 100)
    const total = subtotal + tax
    return {
      id: 'preview',
      invoiceNo: 'INV-PREVIEW-0001',
      items,
      subtotal,
      discount: 0,
      taxRate,
      tax,
      shipping: 0,
      total,
      paid: total,
      change: 0,
      paymentMethod: 'cash',
      customerName: 'Pelanggan',
      cashierName: user?.name || 'Kasir',
      status: 'paid',
      createdAt: new Date(),
    }
  }, [products, form.taxEnabled, form.taxRate, user?.name])

  return (
    <div className="space-y-4">
      <PageHeading
        title="Pengaturan"
        description="Sesuaikan identitas toko, logo kustom, pajak, dan struk."
        action={
          <Button size="md" icon={Save} onClick={handleSave} loading={saving} disabled={!dirty}>
            Simpan perubahan
          </Button>
        }
      />

      {dirty ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] font-medium text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Anda memiliki perubahan yang belum disimpan.
          <button
            type="button"
            onClick={() => {
              setForm({ ...DEFAULT_SETTINGS, ...settings })
              setDirty(false)
            }}
            className="ml-auto font-bold underline underline-offset-2"
          >
            Batalkan
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Profil toko" description="Tampil pada struk dan dashboard." icon={Store} />
            <div className="space-y-3.5 p-5">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-2xl shadow-sm">
                  {isImageLogo(form.logo) ? (
                    <img src={form.logo} alt="Logo" className="h-full w-full object-contain p-1" />
                  ) : (
                    form.logo || '☕'
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {form.storeName || 'Nama toko Anda'}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{form.tagline || 'Tagline toko'}</p>
                </div>
                <Badge tone="brand">Pratinjau</Badge>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">Logo toko</p>
                  {isImageLogo(form.logo) ? (
                    <button
                      type="button"
                      onClick={() => update('logo', '☕')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 transition hover:text-rose-700"
                    >
                      <Trash2 size={12} />
                      Hapus logo kustom
                    </button>
                  ) : null}
                </div>

                {/* Upload dari galeri pribadi */}
                <div className="mb-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3.5 transition hover:border-brand-400 hover:bg-brand-50/20">
                  <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                        {isImageLogo(form.logo) ? (
                          <img src={form.logo} alt="Logo" className="h-full w-full object-contain p-0.5" />
                        ) : (
                          <span className="text-2xl">{form.logo || '☕'}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {isImageLogo(form.logo) ? 'Logo kustom aktif' : 'Unggah logo dari galeri pribadi'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Pilih foto / gambar logo dari perangkat (JPG, PNG, WebP)
                        </p>
                      </div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-95">
                      <Upload size={14} />
                      <span>{isImageLogo(form.logo) ? 'Ganti dari galeri' : 'Pilih dari galeri'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          try {
                            const compressed = await compressImageFile(file)
                            update('logo', compressed)
                            toast.success('Logo berhasil diunggah')
                          } catch (error) {
                            toast.error(error.message || 'Gagal memproses gambar logo')
                          } finally {
                            event.target.value = ''
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Preset emoji */}
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-slate-500">Atau pilih ikon emoji:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LOGO_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => update('logo', emoji)}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg border text-base transition',
                          form.logo === emoji
                            ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300',
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Nama toko"
                  value={form.storeName || ''}
                  onChange={(event) => update('storeName', event.target.value)}
                  placeholder="Nama usaha Anda"
                  required
                />
                <Input
                  label="Tagline"
                  value={form.tagline || ''}
                  onChange={(event) => update('tagline', event.target.value)}
                  placeholder="Slogan singkat"
                />
                <Input
                  label="Nomor telepon"
                  value={form.phone || ''}
                  onChange={(event) => update('phone', event.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                />
                <Input
                  label="Footer struk"
                  value={form.receiptFooter || ''}
                  onChange={(event) => update('receiptFooter', event.target.value)}
                  placeholder="Terima kasih 🙏"
                />
              </div>
              <Textarea
                label="Alamat"
                rows={2}
                value={form.address || ''}
                onChange={(event) => update('address', event.target.value)}
                placeholder="Alamat lengkap toko"
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Parameter Laporan Keuangan & Fee"
              description="Saldo awal kas, saldo barang (pcs), fee Magati, dan nama pembawa."
              icon={Landmark}
            />
            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Saldo Awal Kas / Uang (Rp)"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.initialCash ?? 626000}
                  onChange={(event) => update('initialCash', event.target.value)}
                  hint="Contoh: 626.000"
                />
                <Input
                  label="Saldo Awal Barang (Pcs)"
                  type="number"
                  min="0"
                  value={form.initialStockPcs ?? 133}
                  onChange={(event) => update('initialStockPcs', event.target.value)}
                  hint="Stok awal barang dalam bentuk pcs (contoh: 133)"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Fee Magati per Pcs (Rp)"
                  type="number"
                  min="0"
                  value={form.magatiFeePerPcs ?? 2000}
                  onChange={(event) => update('magatiFeePerPcs', event.target.value)}
                  hint="Default Rp 2.000 per transaksi/pcs (bisa dicustom)"
                />
                <Input
                  label="Fee Sales / Pembawa per Pcs (Rp)"
                  type="number"
                  min="0"
                  value={form.salesFeePerPcs ?? 0}
                  onChange={(event) => update('salesFeePerPcs', event.target.value)}
                  hint="Fee untuk orang yang membawa barang"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Nama Pembawa Default (Sales)"
                  value={form.defaultSalesName ?? 'Pak bambang'}
                  onChange={(event) => update('defaultSalesName', event.target.value)}
                  placeholder="Contoh: Pak bambang"
                />
                <Input
                  label="Judul Produk di Laporan"
                  value={form.reportProductTitle ?? 'SUSU KAMBING GIARVA'}
                  onChange={(event) => update('reportProductTitle', event.target.value)}
                  placeholder="SUSU KAMBING GIARVA"
                />
                <Input
                  label="Periode Laporan"
                  value={form.reportPeriod ?? 'BULAN JULI 2025'}
                  onChange={(event) => update('reportPeriod', event.target.value)}
                  placeholder="BULAN JULI 2025"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button size="md" icon={Save} onClick={handleSave} loading={saving} disabled={!dirty}>
              Simpan perubahan
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Akun" description="Informasi pengguna aktif." icon={User} />
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
                </div>
                <Badge tone="brand">Owner</Badge>
              </div>
              <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status akun</span>
                  <span className="font-semibold text-emerald-600">Aktif</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode login</span>
                  <span className="font-semibold text-slate-700">
                    {isDemo ? 'Demo lokal' : 'Firebase Auth'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peran</span>
                  <span className="font-semibold text-slate-700">Pemilik usaha</span>
                </div>
              </div>
              <Button variant="secondary" size="md" className="mt-4 w-full" icon={LogOut} onClick={() => logout()}>
                Keluar dari akun
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Pratinjau struk"
              description="Tampilan 80 mm dengan pengaturan saat ini."
              icon={ReceiptText}
            />
            <div className="p-4">
              <div className="max-h-[620px] overflow-y-auto rounded-xl bg-slate-100/80 p-3">
                <ReceiptView sale={previewSale} settings={form} />
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400">
                Total pratinjau {formatRupiah(previewSale.total)}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <div className="hidden items-center gap-2 text-[10px] text-slate-400 sm:flex">
        <CheckCircle2 size={12} className="text-brand-500" />
        E-Cash v1.0 · Sistem kasir, manajemen stok, dan laporan keuangan
        <span className="ml-auto">{PRODUCT_EMOJIS.length} ikon produk tersedia</span>
      </div>
    </div>
  )
}
