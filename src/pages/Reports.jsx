import { useMemo, useState } from 'react'
import { endOfMonth, startOfMonth, subDays } from 'date-fns'
import {
  Boxes,
  Download,
  Landmark,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../context/StoreContext'
import {
  categoryBreakdown,
  dailySeries,
  paymentBreakdown,
  summarize,
  topProducts,
} from '../lib/analytics'
import { PAYMENT_METHODS, paymentLabel } from '../lib/constants'
import { dateKey, formatCompact, formatDate, formatNumber, formatRupiah } from '../lib/format'
import { exportSalesCsv, exportSalesExcel } from '../lib/csv'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeading,
  StatCard,
} from '../components/ui'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PRESETS = [
  { id: 'today', label: 'Hari ini' },
  { id: '7d', label: '7 hari' },
  { id: '30d', label: '30 hari' },
  { id: 'month', label: 'Bulan ini' },
  { id: 'custom', label: 'Kustom' },
]

const METHOD_COLORS = {
  cash: '#10b981',
  qris: '#8b5cf6',
  transfer: '#0ea5e9',
  card: '#f59e0b',
}

const CATEGORY_COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f43f5e', '#64748b']

function ReportTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="text-xs font-bold text-slate-900">{label}</p>
      <div className="mt-1.5 space-y-1 text-[11px]">
        <div className="flex items-center justify-between gap-6">
          <span className="text-slate-500">Omzet</span>
          <span className="font-bold text-brand-700">{formatRupiah(point.omzet)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-slate-500">Laba</span>
          <span className="font-semibold text-violet-600">{formatRupiah(point.laba)}</span>
        </div>
        {point.ongkir > 0 ? (
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-500">Ongkir</span>
            <span className="font-semibold text-emerald-600">{formatRupiah(point.ongkir)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-6">
          <span className="text-slate-500">Transaksi</span>
          <span className="font-semibold text-slate-700">{point.transaksi}</span>
        </div>
      </div>
    </div>
  )
}

function rangeForPreset(preset) {
  const now = new Date()
  if (preset === 'today') return { from: dateKey(now), to: dateKey(now) }
  if (preset === '7d') return { from: dateKey(subDays(now, 6)), to: dateKey(now) }
  if (preset === 'month') return { from: dateKey(startOfMonth(now)), to: dateKey(endOfMonth(now)) }
  return { from: dateKey(subDays(now, 29)), to: dateKey(now) }
}

export default function Reports() {
  const { sales, settings, loadingSales } = useStore()
  const [preset, setPreset] = useState('30d')
  const [range, setRange] = useState(() => rangeForPreset('30d'))

  const filtered = useMemo(
    () =>
      sales.filter((sale) => {
        const key = sale.dateKey || dateKey(sale.createdAt)
        return key >= range.from && key <= range.to
      }),
    [sales, range],
  )

  const summary = useMemo(() => summarize(filtered), [filtered])
  const series = useMemo(
    () =>
      dailySeries(
        filtered,
        new Date(`${range.from}T00:00:00`),
        new Date(`${range.to}T23:59:59`),
      ),
    [filtered, range],
  )
  const payments = useMemo(() => paymentBreakdown(filtered), [filtered])
  const categories = useMemo(() => categoryBreakdown(filtered).slice(0, 6), [filtered])
  const bestSellers = useMemo(() => topProducts(filtered, 8), [filtered])
  const paymentTotal = payments.reduce((sum, entry) => sum + entry.value, 0)
  const categoryTotal = categories.reduce((sum, entry) => sum + entry.value, 0)
  const margin = summary.revenue > 0 ? (summary.profit / summary.revenue) * 100 : 0

  function applyPreset(next) {
    setPreset(next)
    if (next !== 'custom') setRange(rangeForPreset(next))
  }

  function handleExport(format = 'excel') {
    if (!filtered.length) {
      toast.info('Tidak ada transaksi pada periode ini.')
      return
    }
    if (format === 'csv') {
      exportSalesCsv(filtered, range.from, range.to, settings)
      toast.success('Laporan CSV (Excel) berhasil diunduh')
    } else {
      exportSalesExcel(filtered, range.from, range.to, settings)
      toast.success('Laporan Excel (.xlsx) berhasil diunduh')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Laporan keuangan"
        description={`Periode ${formatDate(`${range.from}T00:00:00`, 'dd MMM yyyy')} – ${formatDate(`${range.to}T00:00:00`, 'dd MMM yyyy')}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="md" icon={Download} onClick={() => handleExport('excel')}>
              Ekspor Excel (.xlsx)
            </Button>
            <Button variant="secondary" size="md" onClick={() => handleExport('csv')}>
              CSV
            </Button>
          </div>
        }
      />

      <Card className="p-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {PRESETS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyPreset(item.id)}
                className={
                  preset === item.id
                    ? 'shrink-0 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-slate-900 shadow-sm'
                    : 'shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-slate-800'
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={range.from}
              onChange={(event) => {
                setPreset('custom')
                setRange((prev) => ({ ...prev, from: event.target.value }))
              }}
              className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 sm:w-36"
              aria-label="Dari tanggal"
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              type="date"
              value={range.to}
              onChange={(event) => {
                setPreset('custom')
                setRange((prev) => ({ ...prev, to: event.target.value }))
              }}
              className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 sm:w-36"
              aria-label="Sampai tanggal"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Omzet bersih"
          value={formatRupiah(summary.revenue)}
          icon={Wallet}
          loading={loadingSales}
          hint="Tidak termasuk pajak & ongkir"
        />
        <StatCard
          label="Laba kotor"
          value={formatRupiah(summary.profit)}
          icon={TrendingUp}
          tone="violet"
          loading={loadingSales}
          hint={`Margin ${margin.toFixed(1)}%`}
        />
        <StatCard
          label="Total ongkir"
          value={formatRupiah(summary.shipping || 0)}
          icon={Truck}
          tone="emerald"
          loading={loadingSales}
          hint={summary.shipping > 0 ? 'Biaya kirim terkumpul' : 'Belum ada ongkir'}
        />
        <StatCard
          label="Transaksi lunas"
          value={formatNumber(summary.count)}
          icon={ReceiptText}
          tone="sky"
          loading={loadingSales}
          hint={`${summary.voidCount} void`}
        />
        <StatCard
          label="Item terjual"
          value={formatNumber(summary.items)}
          icon={ShoppingBag}
          tone="amber"
          loading={loadingSales}
          hint={`Rata-rata ${formatRupiah(summary.average)}`}
        />
        <StatCard
          label="Pajak terkumpul"
          value={formatRupiah(summary.tax)}
          icon={Landmark}
          tone="slate"
          loading={loadingSales}
          hint={`Diskon ${formatRupiah(summary.discount)}`}
        />
      </div>

      <Card>
        <CardHeader
          title="Omzet & laba harian"
          description="Perbandingan pendapatan bersih dan laba kotor per hari"
          icon={TrendingUp}
          action={<Badge tone="slate">{series.length} hari</Badge>}
        />
        <div className="px-2 pb-4 pt-5 sm:px-4">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="reportOmzet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="reportLaba" x1="0" y1="0" x2="0" y2="1">
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
                minTickGap={24}
              />
              <YAxis
                tickFormatter={formatCompact}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={46}
              />
              <Tooltip content={<ReportTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="omzet" stroke="#059669" strokeWidth={2.5} fill="url(#reportOmzet)" />
              <Area type="monotone" dataKey="laba" stroke="#8b5cf6" strokeWidth={2} fill="url(#reportLaba)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-600" /> Omzet
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" /> Laba kotor
            </span>
            {summary.count === 0 ? (
              <span className="text-amber-600">Belum ada transaksi pada periode ini</span>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader
            title="Produk terlaris"
            description="Kontribusi omzet dan laba per produk"
            icon={Boxes}
          />
          <div className="mt-3 overflow-x-auto">
            {bestSellers.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="Belum ada data penjualan"
                description="Produk terlaris muncul setelah ada transaksi pada periode ini."
                className="py-10"
              />
            ) : (
              <table className="w-full min-w-[460px] text-left text-xs">
                <thead className="border-y border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Produk</th>
                    <th className="px-3 py-2.5 text-right">Terjual</th>
                    <th className="px-3 py-2.5 text-right">Omzet</th>
                    <th className="px-3 py-2.5 text-right">Laba</th>
                    <th className="px-4 py-2.5 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bestSellers.map((product, index) => (
                    <tr key={product.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">
                            {product.emoji}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              <span className="mr-1 text-slate-400">#{index + 1}</span>
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-700">
                        {formatNumber(product.qty)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600">
                        {formatRupiah(product.revenue)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                        {formatRupiah(product.profit)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500">
                        {product.revenue > 0
                          ? `${((product.profit / product.revenue) * 100).toFixed(0)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Metode pembayaran" description="Distribusi nilai transaksi" icon={Wallet} />
            <div className="space-y-3 p-5">
              {payments.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-slate-400">Belum ada transaksi.</p>
              ) : (
                payments.map((entry) => {
                  const percent = paymentTotal > 0 ? (entry.value / paymentTotal) * 100 : 0
                  return (
                    <div key={entry.id}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600">{paymentLabel(entry.id)}</span>
                        <span className="text-slate-500">
                          {formatRupiah(entry.value)} · {percent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(3, percent)}%`,
                            background: METHOD_COLORS[entry.id] || '#94a3b8',
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
              {payments.length > 0 ? (
                <p className="border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                  Total {formatRupiah(paymentTotal)} dari {summary.count} transaksi
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Kategori produk" description="Kontribusi omzet per kategori" icon={Boxes} />
            <div className="space-y-3 p-5">
              {categories.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-slate-400">Belum ada transaksi.</p>
              ) : (
                categories.map((entry, index) => {
                  const percent = categoryTotal > 0 ? (entry.value / categoryTotal) * 100 : 0
                  return (
                    <div key={entry.name}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600">{entry.name}</span>
                        <span className="text-slate-500">{percent.toFixed(0)}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(3, percent)}%`,
                            background: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                          }}
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {entry.qty} item · {formatRupiah(entry.value)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <Badge tone="green">Omzet {formatRupiah(summary.gross)}</Badge>
          <span>Termasuk pajak {formatRupiah(summary.tax)}</span>
          <span className="hidden sm:inline">·</span>
          <span>Ongkir {formatRupiah(summary.shipping || 0)}</span>
          <span className="hidden sm:inline">·</span>
          <span>HPP {formatRupiah(summary.cogs)}</span>
          <span className="hidden sm:inline">·</span>
          <span>Diskon {formatRupiah(summary.discount)}</span>
          <span className="ml-auto text-[10px] text-slate-400">
            {filtered.length} transaksi · {PAYMENT_METHODS.length} metode pembayaran
          </span>
        </div>
      </Card>
    </div>
  )
}
