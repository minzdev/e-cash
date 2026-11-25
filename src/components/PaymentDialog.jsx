import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Printer,
  QrCode,
  Share2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { formatRupiah } from '../lib/format'
import { buildReceiptText, whatsappLink } from '../lib/receipt'
import { Button, Modal } from './ui'
import ReceiptView from './ReceiptView'

const METHODS = [
  { id: 'cash', label: 'Tunai', icon: Banknote, active: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  { id: 'qris', label: 'QRIS', icon: QrCode, active: 'border-violet-500 bg-violet-50 text-violet-700' },
  {
    id: 'transfer',
    label: 'Transfer',
    icon: ArrowRightLeft,
    active: 'border-sky-500 bg-sky-50 text-sky-700',
  },
  { id: 'card', label: 'Kartu', icon: CreditCard, active: 'border-amber-500 bg-amber-50 text-amber-700' },
]

export default function PaymentDialog({
  open,
  onClose,
  total,
  lines,
  discount,
  taxRate,
  shipping = 0,
  customerName,
  note,
  cashier,
  settings,
  onSuccess,
  itemCount,
}) {
  const [method, setMethod] = useState('cash')
  const [paidInput, setPaidInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(null)

  useEffect(() => {
    if (open) {
      setMethod('cash')
      setPaidInput('')
      setProcessing(false)
      setCompleted(null)
    }
  }, [open])

  const paid = method === 'cash' ? Number(paidInput) || 0 : total
  const change = Math.max(0, paid - total)
  const shortfall = Math.max(0, total - paid)

  const quickAmounts = useMemo(() => {
    const raw = [total, Math.ceil(total / 5000) * 5000, 50000, 100000, 150000, 200000]
    return [...new Set(raw.filter((value) => value >= total && value > 0))].sort((a, b) => a - b).slice(0, 5)
  }, [total])

  function handleClose() {
    if (processing) return
    onClose?.()
  }

  async function handlePay() {
    if (processing || completed) return
    if (method === 'cash' && paid < total) {
      toast.error('Nominal pembayaran kurang dari total.')
      return
    }
    setProcessing(true)
    try {
      const sale = await api.createSale({
        items: (lines || []).map((line) => ({ productId: line.productId, qty: line.qty })),
        discount,
        taxRate,
        shipping,
        paymentMethod: method,
        paid: method === 'cash' ? paid : total,
        customerName,
        note,
        cashier,
      })
      setCompleted(sale)
      onSuccess?.(sale)
      toast.success('Pembayaran berhasil disimpan')
    } catch (error) {
      toast.error(error.message || 'Gagal menyimpan transaksi')
    } finally {
      setProcessing(false)
    }
  }

  const receiptText = completed ? buildReceiptText(completed, settings) : ''

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={completed ? 'Transaksi berhasil' : 'Pembayaran'}
      description={
        completed
          ? `${completed.invoiceNo} · ${formatRupiah(completed.total)}`
          : `${itemCount} item · ${formatRupiah(total)}`
      }
      size="md"
      hideClose={processing}
      footer={
        completed ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="md" onClick={() => window.print()} icon={Printer}>
              Cetak struk
            </Button>
            <Button
              as="a"
              href={whatsappLink(receiptText)}
              target="_blank"
              rel="noreferrer"
              size="md"
              icon={Share2}
            >
              WhatsApp
            </Button>
            <Button size="md" className="col-span-2" onClick={handleClose}>
              Transaksi baru
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full"
            onClick={handlePay}
            loading={processing}
            icon={CheckCircle2}
            disabled={method === 'cash' && paid < total}
          >
            Selesaikan pembayaran · {formatRupiah(total)}
          </Button>
        )
      }
    >
      {completed ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
              <CheckCircle2 size={32} />
            </span>
            <p className="mt-4 text-lg font-extrabold text-slate-900">
              {formatRupiah(completed.total)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Dibayar {formatRupiah(completed.paid)} · Kembali{' '}
              <span className="font-bold text-emerald-600">{formatRupiah(completed.change)}</span>
            </p>
            {completed.customerName ? (
              <p className="mt-1 text-[11px] text-slate-400">Pelanggan: {completed.customerName}</p>
            ) : null}
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl bg-slate-100/80 p-3">
            <ReceiptView sale={completed} settings={settings} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 to-ink-800 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Total tagihan
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight">{formatRupiah(total)}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-brand-300">
                <Wallet size={21} />
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-1 border-t border-white/10 pt-2.5 text-[11px] text-slate-400">
              <span>{itemCount} item</span>
              {discount > 0 ? <span>Diskon {formatRupiah(discount)}</span> : null}
              {taxRate > 0 ? <span>PPN {taxRate}%</span> : null}
              {shipping > 0 ? <span>Ongkir {formatRupiah(shipping)}</span> : null}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Metode pembayaran</p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((item) => {
                const active = method === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMethod(item.id)
                      if (item.id !== 'cash') setPaidInput('')
                    }}
                    className={
                      active
                        ? `flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-bold ${item.active}`
                        : 'flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300'
                    }
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {method === 'cash' ? (
            <div className="space-y-2.5">
              <label htmlFor="paid-amount" className="block text-xs font-semibold text-slate-700">
                Uang diterima
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-slate-400">
                  Rp
                </span>
                <input
                  id="paid-amount"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={paidInput}
                  onChange={(event) => setPaidInput(event.target.value)}
                  placeholder="0"
                  autoFocus
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-right text-lg font-extrabold text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((amount, index) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setPaidInput(String(amount))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {index === 0 ? 'Uang pas' : formatRupiah(amount)}
                  </button>
                ))}
              </div>
              <div
                className={
                  shortfall > 0 && paidInput
                    ? 'flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 text-xs ring-1 ring-inset ring-amber-200'
                    : 'flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 text-xs ring-1 ring-inset ring-emerald-200'
                }
              >
                <span className={shortfall > 0 && paidInput ? 'font-medium text-amber-700' : 'font-medium text-emerald-700'}>
                  {shortfall > 0 && paidInput ? 'Kurang bayar' : 'Kembalian'}
                </span>
                <span
                  className={
                    shortfall > 0 && paidInput
                      ? 'font-extrabold text-amber-800'
                      : 'font-extrabold text-emerald-700'
                  }
                >
                  {formatRupiah(shortfall > 0 && paidInput ? shortfall : change)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-600" />
              <p className="text-[11px] leading-relaxed text-slate-600">
                Pastikan pembayaran via {METHODS.find((item) => item.id === method)?.label} sudah
                diterima sebelum menyelesaikan transaksi. Nominal dibayar otomatis sama dengan total.
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
