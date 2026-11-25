import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, ReceiptText, Share2 } from 'lucide-react'
import { api, dataMode } from '../lib/api'
import { DEFAULT_SETTINGS } from '../lib/constants'
import { isImageLogo } from '../lib/image'
import { buildReceiptText, whatsappLink } from '../lib/receipt'
import ReceiptView from '../components/ReceiptView'
import { Button, Card, EmptyState, Spinner } from '../components/ui'

export default function PublicReceipt() {
  const { saleId } = useParams()
  const [sale, setSale] = useState(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getSale(saleId)
      .then((result) => {
        if (!cancelled) setSale(result)
      })
      .catch(() => {
        if (!cancelled) setSale(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    const unsubscribe = api.subscribeSettings((value) => {
      if (!cancelled) setSettings({ ...DEFAULT_SETTINGS, ...value })
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [saleId])

  useEffect(() => {
    if (sale?.invoiceNo) document.title = `Struk ${sale.invoiceNo} · E-Cash`
    return () => {
      document.title = 'E-Cash — Kasir, Stok & Laporan'
    }
  }, [sale])

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-600 text-lg text-white shadow-sm">
              {isImageLogo(settings.logo) ? (
                <img src={settings.logo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                settings.logo || '☕'
              )}
            </span>
            <div>
              <p className="text-sm font-extrabold tracking-tight text-slate-900">E-Cash</p>
              <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-slate-400">
                Struk Digital
              </p>
            </div>
          </Link>
          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
            {dataMode === 'demo' ? 'Mode Demo' : 'Firebase'}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6 sm:py-10">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Spinner label="Memuat struk…" />
          </div>
        ) : !sale ? (
          <Card>
            <EmptyState
              icon={ReceiptText}
              title="Struk tidak ditemukan"
              description="Tautan struk tidak valid, sudah dihapus, atau dibuka di perangkat yang berbeda pada mode demo."
              action={
                <Button as={Link} to="/" size="sm" icon={ArrowLeft}>
                  Kembali ke E-Cash
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-500">Struk pembayaran</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">{sale.invoiceNo}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {sale.status === 'void' ? 'Transaksi dibatalkan' : 'Pembayaran berhasil'}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
              <ReceiptView sale={sale} settings={settings} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="md" onClick={() => window.print()} icon={Printer}>
                Cetak
              </Button>
              <Button
                as="a"
                href={whatsappLink(buildReceiptText(sale, settings))}
                target="_blank"
                rel="noreferrer"
                size="md"
                icon={Share2}
              >
                WhatsApp
              </Button>
            </div>

            <Button as={Link} to="/" variant="ghost" size="sm" className="w-full" icon={ArrowLeft}>
              Kembali ke E-Cash
            </Button>

            {dataMode === 'demo' ? (
              <p className="text-center text-[10px] leading-relaxed text-slate-400">
                Struk demo tersimpan di perangkat ini. Hubungkan Firebase agar tautan struk dapat
                dibuka dari perangkat lain.
              </p>
            ) : null}
          </div>
        )}
      </main>

      <footer className="pb-6 text-center text-[10px] text-slate-400">
        Dibuat dengan E-Cash · Kasir, stok, laporan dalam satu aplikasi
      </footer>
    </div>
  )
}
