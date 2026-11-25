import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { endOfDay, startOfDay, subDays } from 'date-fns'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  PackagePlus,
  Plus,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { api } from '../lib/api'
import {
  buildKpi,
  dailySeries,
  filterSales,
  lowStockProducts,
  paymentBreakdown,
  topProducts,
} from '../lib/analytics'
import { paymentLabel } from '../lib/constants'
import { formatCompact, formatDate, formatNumber, formatRupiah, greeting, formatTime } from '../lib/format'
import ReceiptDialog from '../components/ReceiptDialog'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeading,
  Segmented,
  Skeleton,
  StatCard,
} from '../components/ui'

const METHOD_COLORS = {
  cash: '#10b981',
  qris: '#8b5cf6',
  transfer: '#0ea5e9',
  card: '#f59e0b',
}

const METHOD_TONES = {
  cash: 'green',
  qris: 'violet',
  transfer: 'sky',
  card: 'amber',
}

function SalesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="text-xs font-bold text-slate-900">{label}</p>
      <div className="mt-2 space-y-1 text-[11px]">
        <div className="flex items-center justify-between gap-6">
          <span className="text-slate-500">Omzet</span>
          <span className="font-bold text-brand-700">{formatRupiah(point.omzet)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-slate-500">Laba</span>
          <span className="font-semibold text-violet-600">{formatRupiah(point.laba)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-slate-500">Transaksi</span>
          <span className="font-semibold text-slate-700">{point.transaksi}</span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { products, sales, settings, loadingSales, loadingProducts } = useStore()
  const [now] = useState(() => new Date())
  const [range, setRange] = useState(7)
  const [selectedSale, setSelectedSale] = useState(null)
  const [seeding, setSeeding] = useState(false)

  const todaySales = useMemo(
    () => filterSales(sales, { from: startOfDay(now), to: endOfDay(now) }),
    [sales, now],
  )
  const yesterdaySales = useMemo(() => {
    const yesterday = subDays(now, 1)
    return filterSales(sales, { from: startOfDay(yesterday), to: endOfDay(yesterday) })
  }, [sales, now])

  const kpi = useMemo(() => buildKpi(todaySales, yesterdaySales), [todaySales, yesterdaySales])
  const series = useMemo(() => dailySeries(sales, subDays(now, range - 1), now), [sales, range, now])
  const last30Sales = useMemo(
    () => filterSales(sales, { from: subDays(now, 29), to: endOfDay(now) }),
    [sales, now],
  )
  const payments = useMemo(() => paymentBreakdown(last30Sales), [last30Sales])
  const bestSellers = useMemo(() => topProducts(last30Sales, 5), [last30Sales])
  const lowStock = useMemo(() => lowStockProducts(products), [products])
  const recentSales = sales.slice(0, 6)
  const paymentTotal = payments.reduce((sum, item) => sum + item.value, 0)
  const maxQty = bestSellers[0]?.qty || 1
  const firstName = user?.name?.split(' ')[0] || 'Kasir'
  const chartLoading = loadingSales

  async function handleSeed() {
    setSeeding(true)
    try {
      const count = await api.seedProducts()
      toast.success(
        count ? `${count} produk contoh berhasil ditambahkan` : 'Produk sudah tersedia',
      )
    } catch (error) {
      toast.error(error.message || 'Gagal menambahkan produk contoh')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        title={`${greeting()}, ${firstName} 👋`}
        description={`Ringkasan bisnis Anda · ${formatDate(now, 'EEEE, dd MMMM yyyy')}`}
        action={
          <>
            <Button as={Link} to="/laporan" variant="secondary" size="md" icon={BarChart3} className="hidden sm:inline-flex">
              Laporan
            </Button>
            <Button as={Link} to="/kasir" size="md" icon={Plus}>
              Transaksi Baru
            </Button>
          </>
        }
      />

      {!loadingProducts && products.length === 0 ? (
        <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
              <Sparkles size={22} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Toko Anda masih kosong</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Muat 20 produk contoh untuk mencoba alur kasir, stok, dan laporan dalam sekali klik.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={handleSeed} loading={seeding}>
                Muat produk contoh
              </Button>
              <Button as={Link} to="/produk" size="md" icon={Plus}>
                Tambah produk
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Omzet hari ini"
          value={formatRupiah(kpi.current.revenue)}
          icon={Wallet}
          loading={loadingSales}
          trend={loadingSales ? undefined : kpi.trend.revenue}
          hint={`Kemarin ${formatRupiah(kpi.previous.revenue)}`}
        />
        <StatCard
          label="Laba kotor"
          value={formatRupiah(kpi.current.profit)}
          icon={TrendingUp}
          tone="violet"
          loading={loadingSales}
          trend={loadingSales ? undefined : kpi.trend.profit}
          hint="Setelah harga modal"
        />
        <StatCard
          label="Transaksi"
          value={`${formatNumber(kpi.current.count)} struk`}
          icon={ReceiptText}
          tone="sky"
          loading={loadingSales}
          trend={loadingSales ? undefined : kpi.trend.count}
          hint={`${formatNumber(kpi.current.items)} item terjual`}
        />
        <StatCard
          label="Rata-rata / struk"
          value={formatRupiah(kpi.current.average)}
          icon={ShoppingBag}
          tone="amber"
          loading={loadingSales}
          hint={`${kpi.current.voidCount} transaksi void`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader
            title="Tren penjualan"
            description="Omzet bersih dan laba kotor"
            icon={TrendingUp}
            action={
              <Segmented
                value={range}
                onChange={setRange}
                options={[
                  { value: 7, label: '7 hari' },
                  { value: 30, label: '30 hari' },
                ]}
              />
            }
          />
          <div className="px-2 pb-4 pt-5 sm:px-4">
            {chartLoading ? (
              <Skeleton className="mx-2 h-[280px]" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOmzet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradLaba" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={22}
                  />
                  <YAxis
                    tickFormatter={formatCompact}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    width={46}
                  />
                  <Tooltip content={<SalesTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="omzet"
                    name="Omzet"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="url(#gradOmzet)"
                    activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="laba"
                    name="Laba"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#gradLaba)"
                    activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex items-center justify-center gap-5 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-600" /> Omzet
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" /> Laba kotor
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Metode pembayaran"
            description="30 hari terakhir"
            icon={Wallet}
            action={<Badge tone="slate">{formatNumber(last30Sales.length)} trx</Badge>}
          />
          <div className="p-5 pt-4">
            {payments.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Belum ada transaksi"
                description="Komposisi metode bayar muncul setelah transaksi pertama."
                className="py-8"
              />
            ) : (
              <>
                <div className="relative h-[170px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={payments}
                        dataKey="value"
                        nameKey="id"
                        innerRadius={56}
                        outerRadius={78}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {payments.map((entry) => (
                          <Cell key={entry.id} fill={METHOD_COLORS[entry.id] || '#94a3b8'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[10px] font-medium text-slate-400">Total</p>
                    <p className="text-sm font-extrabold text-slate-900">{formatRupiah(paymentTotal)}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {payments.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: METHOD_COLORS[entry.id] || '#94a3b8' }}
                      />
                      <span className="flex-1 font-medium text-slate-600">
                        {paymentLabel(entry.id)}
                      </span>
                      <span className="text-[10px] text-slate-400">{entry.count}×</span>
                      <span className="w-20 text-right font-semibold text-slate-800">
                        {formatRupiah(entry.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Produk terlaris"
            description="Berdasarkan jumlah terjual 30 hari terakhir"
            icon={Boxes}
            action={
              <Link to="/laporan" className="text-[11px] font-bold text-brand-700 hover:text-brand-800">
                Lihat laporan
              </Link>
            }
          />
          <div className="space-y-3 p-5">
            {loadingSales ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12" />)
            ) : bestSellers.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="Belum ada penjualan"
                description="Produk terlaris akan muncul di sini setelah ada transaksi."
                className="py-8"
              />
            ) : (
              bestSellers.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base">
                    {product.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        <span className="mr-1 text-slate-400">#{index + 1}</span>
                        {product.name}
                      </p>
                      <p className="shrink-0 text-[11px] font-bold text-slate-700">
                        {formatRupiah(product.revenue)}
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                          style={{ width: `${Math.max(6, (product.qty / maxQty) * 100)}%` }}
                        />
                      </div>
                      <span className="w-14 text-right text-[10px] font-medium text-slate-400">
                        {product.qty} terjual
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Stok menipis"
            description="Produk yang perlu segera diisi"
            icon={AlertTriangle}
            action={
              <Badge tone={lowStock.length ? 'rose' : 'green'}>{lowStock.length} produk</Badge>
            }
          />
          <div className="space-y-2 p-4">
            {loadingProducts ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-12" />)
            ) : lowStock.length === 0 ? (
              <div className="flex flex-col items-center px-2 py-6 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Sparkles size={20} />
                </span>
                <p className="mt-3 text-xs font-bold text-slate-800">Semua stok aman</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Tidak ada produk di bawah ambang minimum.
                </p>
              </div>
            ) : (
              <>
                {lowStock.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 px-2.5 py-2"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
                      {product.emoji || '📦'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-slate-800">{product.name}</p>
                      <p className="text-[10px] text-slate-400">{product.category}</p>
                    </div>
                    <Badge tone={Number(product.stock) <= 0 ? 'rose' : 'amber'}>
                      {Number(product.stock) <= 0 ? 'Habis' : `${product.stock} ${product.unit}`}
                    </Badge>
                  </div>
                ))}
                <Button
                  as={Link}
                  to="/produk"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  icon={PackagePlus}
                >
                  Kelola stok
                  <ArrowRight size={14} />
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Transaksi terakhir"
          description="Diperbarui otomatis secara real-time"
          icon={ReceiptText}
          action={
            <Link to="/transaksi" className="text-[11px] font-bold text-brand-700 hover:text-brand-800">
              Lihat semua
            </Link>
          }
        />
        {loadingSales ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-11" />
            ))}
          </div>
        ) : recentSales.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Belum ada transaksi"
            description="Mulai transaksi pertama Anda di halaman kasir."
            action={
              <Button as={Link} to="/kasir" size="sm" icon={Plus}>
                Buka kasir
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead className="border-y border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-2.5">Invoice</th>
                    <th className="whitespace-nowrap px-3 py-2.5">Waktu</th>
                    <th className="px-3 py-2.5">Kasir</th>
                    <th className="px-3 py-2.5">Metode</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                    <th className="px-5 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSales.map((sale) => (
                    <tr
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className="cursor-pointer transition hover:bg-brand-50/40"
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] font-semibold text-slate-700">
                        {sale.invoiceNo}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                        {formatDate(sale.createdAt, 'dd MMM')} · {formatTime(sale.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{sale.cashierName}</td>
                      <td className="px-3 py-3">
                        <Badge tone={METHOD_TONES[sale.paymentMethod] || 'slate'}>
                          {paymentLabel(sale.paymentMethod)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-slate-800">
                        {formatRupiah(sale.total)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Badge tone={sale.status === 'void' ? 'rose' : 'green'} dot>
                          {sale.status === 'void' ? 'Void' : 'Lunas'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 xl:hidden">
              {recentSales.map((sale) => (
                <button
                  key={sale.id}
                  type="button"
                  onClick={() => setSelectedSale(sale)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <ReceiptText size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[11px] font-semibold text-slate-700">
                      {sale.invoiceNo}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatDate(sale.createdAt, 'dd MMM')} · {formatTime(sale.createdAt)} ·{' '}
                      {paymentLabel(sale.paymentMethod)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">{formatRupiah(sale.total)}</p>
                    <Badge tone={sale.status === 'void' ? 'rose' : 'green'} className="mt-1">
                      {sale.status === 'void' ? 'Void' : 'Lunas'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      <ReceiptDialog
        open={Boolean(selectedSale)}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        settings={settings}
      />
    </div>
  )
}
