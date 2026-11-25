import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white shadow-lg shadow-brand-600/25">
          E
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Loader2 size={16} className="animate-spin text-brand-600" />
          Menyiapkan E-Cash…
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
