import { useMemo, useState } from 'react'
import { subDays } from 'date-fns'
import {
  Ban,
  Download,
  Eye,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { api } from '../lib/api'
import { filterSales, summarize } from '../lib/analytics'
import { PAYMENT_METHODS, paymentLabel } from '../lib/constants'
import { dateKey, formatDate, formatDateTime, formatNumber, formatRupiah } from '../lib/format'
import { buildReceiptText, whatsappLink } from '../lib/receipt'
import { exportSalesCsv, exportSalesExcel } from '../lib/csv'
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
  Textarea,
} from '../components/ui'
import ReceiptView from '../components/ReceiptView'

const METHOD_TONES = {
  cash: 'green',
  qris: 'violet',
  transfer: 'sky',
  card: 'amber',
}

export default function Transactions() {
  const { sales, settings, loadingSales } = useStore()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState(() => dateKey(subDays(new Date(), 29)))
  const [to, setTo] = useState(() => dateKey(new Date()))
  const [method, setMethod] = useState('all')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [voidTarget, setVoidTarget] = useState(null)
  const [voidReason, setVoidReason] = useState('')
  const [voidBusy, setVoidBusy] = useState(false)

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return filterSales(sales, { from: `${from}T00:00:00`, to: `${to}T23:59:59` }).filter((sale) => {
      const key = sale.dateKey || dateKey(sale.createdAt)
      if (key < from || key > to) return false
      if (method !== 'all' && sale.paymentMethod !== method) return false
      if (status !== 'all' && sale.status !== status) return false
      if (!keyword) return true
      return (
        String(sale.invoiceNo || '').toLowerCase().includes(keyword) ||
        String(sale.customerName || '').toLowerCase().includes(keyword) ||
        String(sale.cashierName || '').toLowerCase().includes(keyword)
      )
    })
  }, [sales, from, to, method, status, search])

  const summary = useMemo(() => summarize(filtered), [filtered])
  const selectedText = selected ? buildReceiptText(selected, settings) : ''

  function resetFilters() {
    setSearch('')
    setFrom(dateKey(subDays(new Date(), 29)))
    setTo(dateKey(new Date()))
    setMethod('all')
    setStatus('all')
  }

  async function handleVoid() {
    if (!voidTarget) return
    setVoidBusy(true)
    try {
      await api.voidSale(voidTarget.id, {
        reason: voidReason,
        userId: user?.uid,
      })
      toast.success('Transaksi dibatalkan, stok telah dikembalikan')
      setVoidTarget(null)
      setVoidReason('')
      setSelected(null)
    } catch (error) {
      toast.error(error.message || 'Gagal membatalkan transaksi')
    } finally {
      setVoidBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Transaksi"
        description="Riwayat penjualan, pembatalan, dan cetak ulang struk."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              icon={Download}
              onClick={() => {
                if (!filtered.length) {
                  toast.info('Tidak ada transaksi untuk diekspor pada rentang ini.')
                  return
                }
                exportSalesExcel(filtered, from, to, settings)
                toast.success('Laporan Excel (.xlsx) berhasil diunduh')
              }}
            >
              Ekspor Excel (.xlsx)
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                if (!filtered.length) {
                  toast.info('Tidak ada transaksi untuk diekspor pada rentang ini.')
                  return
                }
                exportSalesCsv(filtered, from, to, settings)
                toast.success('Laporan CSV (Excel) berhasil diunduh')
              }}
            >
              CSV
            </Button>
          </div>
        }
      />

      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_150px_150px_160px_140px_auto]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari invoice, pelanggan, kasir…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Dari tanggal" />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Sampai tanggal" />
          <Select value={method} onChange={(event) => setMethod(event.target.value)} aria-label="Metode bayar">
            <option value="all">Semua metode</option>
            {PAYMENT_METHODS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
            <option value="all">Semua status</option>
            <option value="paid">Lunas</option>
            <option value="void">Void</option>
          </Select>
          <Button
            variant="ghost"
            size="md"
            onClick={resetFilters}
            icon={RotateCcw}
            className="justify-center justify-self-end sm:col-span-2 xl:col-span-1"
          >
            Reset
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <Badge tone="slate">{formatNumber(filtered.length)} transaksi</Badge>
          <Badge tone="green">Omzet {formatRupiah(summary.revenue)}</Badge>
          <Badge tone="violet">Laba {formatRupiah(summary.profit)}</Badge>
          {summary.voidCount > 0 ? <Badge tone="rose">{summary.voidCount} void</Badge> : null}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loadingSales ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Tidak ada transaksi"
            description="Belum ada transaksi pada rentang tanggal atau filter yang dipilih."
            action={
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Reset filter
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[860px] text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3">Invoice</th>
                    <th className="whitespace-nowrap px-3 py-3">Waktu</th>
                    <th className="px-3 py-3">Kasir / Pelanggan</th>
                    <th className="px-3 py-3 text-center">Item</th>
                    <th className="px-3 py-3">Metode</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((sale) => (
                    <tr
                      key={sale.id}
                      onClick={() => setSelected(sale)}
                      className="cursor-pointer transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3">
                        <p className="whitespace-nowrap font-mono text-[11px] font-bold text-slate-700">
                          {sale.invoiceNo}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                        {formatDate(sale.createdAt, 'dd MMM yyyy')}
                        <span className="block text-[10px] text-slate-400">
                          {formatDate(sale.createdAt, 'HH:mm')}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-700">{sale.cashierName}</p>
                        <p className="text-[10px] text-slate-400">{sale.customerName || 'Pelanggan umum'}</p>
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-600">
                        {(sale.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={METHOD_TONES[sale.paymentMethod] || 'slate'}>
                          {paymentLabel(sale.paymentMethod)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-slate-800">
                        {formatRupiah(sale.total)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={sale.status === 'void' ? 'rose' : 'green'} dot>
                          {sale.status === 'void' ? 'Void' : 'Lunas'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelected(sale)
                            }}
                            className="flex h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-bold text-brand-700 transition hover:bg-brand-50"
                          >
                            <Eye size={13} />
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 xl:hidden">
              {filtered.map((sale) => (
                <button
                  key={sale.id}
                  type="button"
                  onClick={() => setSelected(sale)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition active:bg-slate-50"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <ReceiptText size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-mono text-[11px] font-bold text-slate-700">
                        {sale.invoiceNo}
                      </p>
                      <p className="shrink-0 text-xs font-extrabold text-slate-800">
                        {formatRupiah(sale.total)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatDateTime(sale.createdAt)} · {sale.cashierName}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge tone={METHOD_TONES[sale.paymentMethod] || 'slate'}>
                        {paymentLabel(sale.paymentMethod)}
                      </Badge>
                      <Badge tone={sale.status === 'void' ? 'rose' : 'green'}>
                        {sale.status === 'void' ? 'Void' : 'Lunas'}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Detail transaksi"
        description={selected ? `${selected.invoiceNo} · ${formatDateTime(selected.createdAt)}` : ''}
        size="md"
        footer={
          selected ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="md" onClick={() => window.print()} icon={Printer}>
                Cetak
              </Button>
              <Button
                as="a"
                href={whatsappLink(selectedText)}
                target="_blank"
                rel="noreferrer"
                size="md"
                icon={Share2}
              >
                WhatsApp
              </Button>
              {selected.status !== 'void' ? (
                <Button
                  variant="danger"
                  size="md"
                  className="col-span-2"
                  onClick={() => setVoidTarget(selected)}
                  icon={Ban}
                >
                  Batalkan transaksi (void)
                </Button>
              ) : (
                <div className="col-span-2 rounded-xl bg-rose-50 px-3 py-2 text-center text-[11px] font-semibold text-rose-700">
                  Transaksi ini sudah dibatalkan
                  {selected.voidReason ? ` · ${selected.voidReason}` : ''}
                </div>
              )}
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-100/80 p-3 sm:p-4">
              <ReceiptView sale={selected} settings={settings} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-slate-400">Kasir</p>
                <p className="mt-0.5 font-bold text-slate-700">{selected.cashierName}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-slate-400">Pelanggan</p>
                <p className="mt-0.5 font-bold text-slate-700">{selected.customerName || 'Umum'}</p>
              </div>
            </div>
            {selected.note ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                Catatan: {selected.note}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(voidTarget)}
        onClose={() => setVoidTarget(null)}
        title="Batalkan transaksi?"
        description={voidTarget ? voidTarget.invoiceNo : ''}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setVoidTarget(null)} disabled={voidBusy}>
              Kembali
            </Button>
            <Button variant="danger" size="md" onClick={handleVoid} loading={voidBusy} icon={Ban}>
              Ya, batalkan
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl bg-rose-50 p-3.5 text-[11px] leading-relaxed text-rose-700 ring-1 ring-inset ring-rose-100">
            Transaksi akan ditandai void, tidak dihitung dalam omzet, dan stok semua item akan
            dikembalikan secara otomatis. Tindakan ini tercatat pada riwayat.
          </div>
          <Textarea
            label="Alasan pembatalan (opsional)"
            value={voidReason}
            onChange={(event) => setVoidReason(event.target.value)}
            placeholder="Contoh: pesanan dibatalkan pelanggan"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  )
}
