import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { Button } from '../components/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass size={30} />
      </span>
      <p className="mt-5 text-5xl font-extrabold tracking-tight text-slate-900">404</p>
      <h1 className="mt-2 text-lg font-bold text-slate-800">Halaman tidak ditemukan</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Halaman yang Anda cari mungkin sudah dipindahkan atau tidak pernah ada.
      </p>
      <Button as={Link} to="/" size="md" className="mt-5" icon={ArrowLeft}>
        Kembali ke dashboard
      </Button>
    </div>
  )
}
