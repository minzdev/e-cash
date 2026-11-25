import { cn } from '../lib/cn'
import { paymentLabel } from '../lib/constants'
import { formatDateTime, formatRupiah } from '../lib/format'
import { isImageLogo } from '../lib/image'

function Row({ label, value, bold, muted }) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3',
        bold ? 'font-bold text-slate-900' : muted ? 'text-slate-500' : 'text-slate-700',
      )}
    >
      <span>{label}</span>
      <span className="tabular text-right">{value}</span>
    </div>
  )
}

function Barcode({ value = '' }) {
  const seed = String(value).split('').map((char) => char.charCodeAt(0))
  const bars = Array.from({ length: 44 }, (_, index) => {
    const base = seed[index % Math.max(seed.length, 1)] || 7
    return (base * (index + 3)) % 5 < 2 ? 1 : 2
  })
  return (
    <div className="mt-3 flex h-7 items-stretch justify-center gap-[1px]" aria-hidden="true">
      {bars.map((width, index) => (
        <span
          key={index}
          style={{ width: `${width}px`, opacity: index % 7 === 0 ? 0.4 : 0.85 }}
          className="bg-slate-900"
        />
      ))}
    </div>
  )
}

export default function ReceiptView({ sale, settings = {}, className }) {
  if (!sale) return null
  const items = sale.items || []

  return (
    <div id="receipt-print" className={cn('receipt-paper', className)}>
      <div className="text-center">
        {isImageLogo(settings.logo) ? (
          <div className="mb-1.5 flex justify-center">
            <img src={settings.logo} alt="Logo" className="max-h-12 max-w-[120px] object-contain" />
          </div>
        ) : (
          <div className="text-lg leading-none">{settings.logo || '☕'}</div>
        )}
        <p className="mt-1 text-[13px] font-extrabold uppercase leading-tight tracking-wide">
          {settings.storeName || 'E-Cash'}
        </p>
        {settings.tagline ? (
          <p className="text-[10px] italic text-slate-500">{settings.tagline}</p>
        ) : null}
        <p className="mt-1 text-[10px] leading-snug text-slate-600">{settings.address}</p>
        {settings.phone ? <p className="text-[10px] text-slate-600">{settings.phone}</p> : null}
      </div>

      <div className="my-3 border-t border-dashed border-slate-300" />

      <div className="space-y-0.5">
        <Row label="Invoice" value={sale.invoiceNo || '-'} />
        <Row label="Waktu" value={formatDateTime(sale.createdAt)} />
        <Row label="Kasir" value={sale.cashierName || '-'} />
        {sale.customerName ? <Row label="Pelanggan" value={sale.customerName} /> : null}
      </div>

      <div className="my-2.5 border-t border-dashed border-slate-300" />

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${item.productId}-${index}`}>
            <p className="font-semibold leading-snug text-slate-800">
              {item.qty}× {item.name}
            </p>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>
                @{formatRupiah(item.price)}
              </span>
              <span className="tabular font-semibold text-slate-700">{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="my-2.5 border-t border-dashed border-slate-300" />

      <div className="space-y-1">
        {Number(sale.discount) > 0 ? (
          <Row label="Diskon" value={`-${formatRupiah(sale.discount)}`} />
        ) : null}
        {Number(sale.tax) > 0 ? (
          <Row label={`PPN ${sale.taxRate || 0}%`} value={formatRupiah(sale.tax)} />
        ) : null}
        {Number(sale.shipping) > 0 ? (
          <Row label="Ongkir" value={formatRupiah(sale.shipping)} />
        ) : null}
        <div
          className={cn(
            Number(sale.discount) > 0 || Number(sale.tax) > 0 || Number(sale.shipping) > 0
              ? 'border-t border-dashed border-slate-300 pt-1'
              : '',
          )}
        >
          <Row label="TOTAL" value={formatRupiah(sale.total)} bold />
        </div>
      </div>

      {sale.status === 'void' ? (
        <div className="my-3 rounded border border-rose-300 py-1 text-center text-[9px] font-extrabold uppercase tracking-[0.2em] text-rose-500">
          Transaksi dibatalkan
        </div>
      ) : null}

      <div className="my-3 border-t border-dashed border-slate-300" />

      <div className="text-center">
        <p className="text-[10px] leading-relaxed text-slate-600">{settings.receiptFooter}</p>
        <p className="mt-1 text-[9px] font-semibold text-slate-400">Struk digital · E-Cash</p>
        <Barcode value={sale.invoiceNo || sale.id} />
        <p className="mt-1 text-[9px] tracking-[0.18em] text-slate-400">{sale.invoiceNo}</p>
      </div>
    </div>
  )
}
