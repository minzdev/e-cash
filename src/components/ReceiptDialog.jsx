import { useState } from 'react'
import { Link2, Printer, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal, Button } from './ui'
import ReceiptView from './ReceiptView'
import { buildReceiptText, whatsappLink } from '../lib/receipt'

export default function ReceiptDialog({ open, onClose, sale, settings }) {
  const [copied, setCopied] = useState(false)
  if (!sale) return null

  const text = buildReceiptText(sale, settings)
  const publicUrl = `${window.location.origin}/r/${sale.id}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('Tautan struk disalin')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin tautan. Salin manual: ' + publicUrl)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Struk Transaksi"
      description={`${sale.invoiceNo} · ${sale.status === 'void' ? 'Dibatalkan' : 'Lunas'}`}
      size="sm"
      footer={
        <div className="no-print grid grid-cols-2 gap-2">
          <Button variant="secondary" size="md" onClick={copyLink} icon={Link2} className="col-span-2">
            {copied ? 'Tautan disalin!' : 'Salin tautan struk digital'}
          </Button>
          <Button variant="secondary" size="md" onClick={() => window.print()} icon={Printer}>
            Cetak
          </Button>
          <Button
            as="a"
            href={whatsappLink(text)}
            target="_blank"
            rel="noreferrer"
            size="md"
            icon={Share2}
          >
            WhatsApp
          </Button>
        </div>
      }
    >
      <div className="rounded-xl bg-slate-100/80 p-3 sm:p-4">
        <ReceiptView sale={sale} settings={settings} />
      </div>
    </Modal>
  )
}
