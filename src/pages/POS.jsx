import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CreditCard,
  Minus,
  PackageSearch,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { formatRupiah } from '../lib/format'
import { cn } from '../lib/cn'
import { Badge, Button, Card, EmptyState, PageHeading, Skeleton } from '../components/ui'
import { Modal } from '../components/ui'
import PaymentDialog from '../components/PaymentDialog'

function CartPanel({
  lines,
  itemCount,
  subtotal,
  discountValue,
  tax,
  taxRate,
  shipping,
  setShipping,
  shippingValue,
  total,
  discount,
  setDiscount,
  customerName,
  setCustomerName,
  note,
  setNote,
  salesPersonId,
  setSalesPersonId,
  salesPersons,
  changeQty,
  removeItem,
  clearCart,
  onCheckout,
  hideHeader = false,
  className,
}) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {!hideHeader ? (
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-brand-600" />
            <p className="text-sm font-bold text-slate-900">Pesanan</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {itemCount}
            </span>
          </div>
          <button
            type="button"
            onClick={clearCart}
            disabled={!lines.length}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-40"
          >
            <Trash2 size={12} />
            Kosongkan
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
              <ShoppingCart size={26} />
            </span>
            <p className="mt-3 text-xs font-bold text-slate-700">Keranjang masih kosong</p>
            <p className="mt-1 max-w-[190px] text-[10px] leading-relaxed text-slate-400">
              Pilih produk di sebelah kiri untuk memulai transaksi baru.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {lines.map((line) => (
              <div key={line.productId} className="flex gap-2.5 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base">
                  {line.product.emoji || '📦'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
                      {line.product.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(line.productId)}
                      className="-mr-0.5 -mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                      aria-label={`Hapus ${line.product.name}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {formatRupiah(line.product.price)} · stok {line.product.stock}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => changeQty(line.productId, line.qty - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-l-lg text-slate-500 transition hover:bg-slate-50 active:bg-slate-100"
                        aria-label="Kurangi jumlah"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-800">{line.qty}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(line.productId, line.qty + 1)}
                        disabled={line.qty >= Number(line.product.stock)}
                        className="flex h-7 w-7 items-center justify-center rounded-r-lg text-slate-500 transition hover:bg-slate-50 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
                        aria-label="Tambah jumlah"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {formatRupiah(line.product.price * line.qty)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-slate-100 px-4 py-3">
        {/* Sales/Pembawa selector */}
        {salesPersons && salesPersons.length > 0 ? (
          <div className="relative">
            <User size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={salesPersonId}
              onChange={(e) => setSalesPersonId(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[11px] text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            >
              <option value="">-- Pilih Sales / Pembawa --</option>
              {salesPersons.filter(sp => sp.active !== false).map(sp => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}{sp.feePerPcs ? ` (Fee: ${formatRupiah(sp.feePerPcs)}/pcs)` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Nama pelanggan"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
          />
          <input
            type="text"
            inputMode="numeric"
            value={discount}
            onChange={(event) => setDiscount(event.target.value.replace(/\D/g, ''))}
            placeholder="Diskon (Rp)"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={shipping}
            onChange={(event) => setShipping(event.target.value.replace(/\D/g, ''))}
            placeholder="Ongkir (Rp)"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
          />
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Catatan (opsional)"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
          />
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal ({itemCount} item)</span>
            <span className="font-semibold text-slate-700">{formatRupiah(subtotal)}</span>
          </div>
          {discountValue > 0 ? (
            <div className="flex justify-between text-emerald-600">
              <span>Diskon</span>
              <span className="font-semibold">−{formatRupiah(discountValue)}</span>
            </div>
          ) : null}
          {tax > 0 ? (
            <div className="flex justify-between text-slate-500">
              <span>PPN {taxRate}%</span>
              <span className="font-semibold text-slate-700">{formatRupiah(tax)}</span>
            </div>
          ) : null}
          {shippingValue > 0 ? (
            <div className="flex justify-between text-slate-600">
              <span>Ongkir</span>
              <span className="font-semibold text-slate-800">+{formatRupiah(shippingValue)}</span>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between border-t border-dashed border-slate-200 pt-2">
            <span className="text-sm font-bold text-slate-900">Total</span>
            <span className="text-base font-extrabold text-brand-700">{formatRupiah(total)}</span>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          icon={CreditCard}
          onClick={onCheckout}
          disabled={!lines.length}
        >
          Bayar sekarang
        </Button>
      </div>
    </div>
  )
}

export default function POS() {
  const { products, salesPersons, settings, loadingProducts } = useStore()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState('')
  const [shipping, setShipping] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [note, setNote] = useState('')
  const [salesPersonId, setSalesPersonId] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  const categories = useMemo(
    () => ['Semua', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  )

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return products.filter((product) => {
      if (product.active === false) return false
      if (category !== 'Semua' && product.category !== category) return false
      if (!keyword) return true
      return (
        product.name.toLowerCase().includes(keyword) ||
        String(product.sku || '').toLowerCase().includes(keyword)
      )
    })
  }, [products, category, search])

  const cartLines = useMemo(
    () =>
      cart
        .map((line) => {
          const product = products.find((item) => item.id === line.productId)
          return product ? { ...line, product } : null
        })
        .filter(Boolean),
    [cart, products],
  )

  const itemCount = cartLines.reduce((sum, line) => sum + line.qty, 0)
  const subtotal = cartLines.reduce((sum, line) => sum + Number(line.product.price) * line.qty, 0)
  const discountValue = Math.min(Math.max(0, Number(discount) || 0), subtotal)
  const taxRate = settings.taxEnabled ? Number(settings.taxRate) || 0 : 0
  const tax = Math.round(((subtotal - discountValue) * taxRate) / 100)
  const shippingValue = Math.max(0, Number(shipping) || 0)
  const total = subtotal - discountValue + tax + shippingValue
  const inCartCount = (productId) => cart.find((line) => line.productId === productId)?.qty || 0

  function addToCart(product) {
    if (Number(product.stock) <= 0) {
      toast.warning('Stok produk ini habis.')
      return
    }
    const existing = cart.find((line) => line.productId === product.id)
    if (existing) {
      if (existing.qty >= Number(product.stock)) {
        toast.warning(`Stok ${product.name} hanya ${product.stock} ${product.unit || ''}`)
        return
      }
      setCart((prev) =>
        prev.map((line) => (line.productId === product.id ? { ...line, qty: line.qty + 1 } : line)),
      )
      return
    }
    setCart((prev) => [...prev, { productId: product.id, qty: 1 }])
  }

  function changeQty(productId, nextQty) {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((line) => line.productId !== productId))
      return
    }
    const product = products.find((item) => item.id === productId)
    if (!product) return
    if (nextQty > Number(product.stock)) {
      toast.warning(`Stok ${product.name} hanya ${product.stock} ${product.unit || ''}`)
      return
    }
    setCart((prev) => prev.map((line) => (line.productId === productId ? { ...line, qty: nextQty } : line)))
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((line) => line.productId !== productId))
  }

  function clearCart() {
    setCart([])
    setDiscount('')
    setShipping('')
    setCustomerName('')
    setNote('')
    setSalesPersonId('')
  }

  function startCheckout() {
    if (!cartLines.length) return
    setCartOpen(false)
    setPayOpen(true)
  }

  function handleSuccess() {
    clearCart()
    setCartOpen(false)
  }

  // Resolve selected salesPerson details
  const selectedSalesPerson = (salesPersons || []).find(sp => sp.id === salesPersonId) || null

  const cartProps = {
    lines: cartLines,
    itemCount,
    subtotal,
    discountValue,
    tax,
    taxRate,
    shipping,
    setShipping,
    shippingValue,
    total,
    discount,
    setDiscount,
    customerName,
    setCustomerName,
    note,
    setNote,
    salesPersonId,
    setSalesPersonId,
    salesPersons: salesPersons || [],
    changeQty,
    removeItem,
    clearCart,
    onCheckout: startCheckout,
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Kasir"
        description="Pilih produk, lakukan pembayaran, stok ter-update otomatis."
        action={<Badge tone="green" dot>Stok real-time</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 space-y-3.5">
          <Card className="p-3">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama produk atau SKU…"
                autoFocus
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
                  aria-label="Bersihkan pencarian"
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>

            <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition',
                    category === item
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </Card>

          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-32" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card>
              <EmptyState
                icon={PackageSearch}
                title="Belum ada produk"
                description="Tambahkan produk terlebih dahulu agar bisa mulai berjualan."
                action={
                  <Button as={Link} to="/produk" size="sm" icon={Plus}>
                    Tambah produk
                  </Button>
                }
              />
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <EmptyState
                icon={Search}
                title="Produk tidak ditemukan"
                description="Coba kata kunci lain atau ubah filter kategori."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      setCategory('Semua')
                    }}
                  >
                    Reset filter
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const qtyInCart = inCartCount(product.id)
                const stock = Number(product.stock) || 0
                const low = stock > 0 && stock <= Number(product.minStock ?? 0)
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={stock <= 0}
                    className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md active:translate-y-0 disabled:pointer-events-none disabled:opacity-55"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-lg">
                        {product.emoji || '📦'}
                      </span>
                      {stock <= 0 ? (
                        <Badge tone="rose">Habis</Badge>
                      ) : low ? (
                        <Badge tone="amber">{stock} sisa</Badge>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">
                          {stock} {product.unit}
                        </span>
                      )}
                    </div>
                    <p className="mt-2.5 line-clamp-2 min-h-[32px] text-xs font-bold leading-snug text-slate-800">
                      {product.name}
                    </p>
                    <div className="mt-auto flex items-end justify-between pt-2">
                      <p className="text-sm font-extrabold text-brand-700">
                        {formatRupiah(product.price)}
                      </p>
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                        <Plus size={14} />
                      </span>
                    </div>
                    {qtyInCart > 0 ? (
                      <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-extrabold text-white shadow-md ring-2 ring-white">
                        {qtyInCart}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}

          <p className="px-1 text-[10px] text-slate-400">
            Menampilkan {filteredProducts.length} produk · stok berkurang otomatis setelah pembayaran.
          </p>
        </div>

        <aside className="hidden lg:block">
          <Card className="sticky top-20 flex h-[calc(100dvh-6.5rem)] max-h-[880px] flex-col overflow-hidden">
            <CartPanel {...cartProps} />
          </Card>
        </aside>
      </div>

      {cartLines.length > 0 ? (
        <div className="fixed inset-x-4 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 lg:hidden">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-ink-900 px-4 py-3 text-white shadow-2xl shadow-slate-900/30 ring-1 ring-white/10 transition active:scale-[0.99]"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <ShoppingCart size={18} />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold">
                {itemCount}
              </span>
            </span>
            <span className="flex-1 text-left">
              <span className="block text-[10px] text-slate-400">{itemCount} item</span>
              <span className="block text-sm font-extrabold">{formatRupiah(total)}</span>
            </span>
            <span className="flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-2 text-[11px] font-bold">
              Lihat keranjang
              <ArrowRight size={13} />
            </span>
          </button>
        </div>
      ) : null}

      <Modal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="Keranjang"
        description={`${itemCount} item · ${formatRupiah(total)}`}
        size="md"
        bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      >
        <CartPanel {...cartProps} hideHeader />
      </Modal>

      <PaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        total={total}
        lines={cartLines}
        discount={discountValue}
        taxRate={taxRate}
        shipping={shippingValue}
        customerName={customerName}
        note={note}
        cashier={{ uid: user?.uid, name: user?.name }}
        settings={settings}
        onSuccess={handleSuccess}
        itemCount={itemCount}
        salesPersonId={salesPersonId}
        salesPersonName={selectedSalesPerson?.name || ''}
        salesFeePerPcs={selectedSalesPerson?.feePerPcs || 0}
      />
    </div>
  )
}
