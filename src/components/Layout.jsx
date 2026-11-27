import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { isImageLogo } from '../lib/image'
import {
  BarChart3,
  Bell,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  ReceiptText,
  Settings as SettingsIcon,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { lowStockProducts } from '../lib/analytics'
import { formatDate } from '../lib/format'
import { cn } from '../lib/cn'
import { Avatar } from './ui'

const NAV_GROUPS = [
  {
    label: 'Utama',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/kasir', label: 'Kasir', icon: ShoppingCart, tag: 'POS' },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { to: '/produk', label: 'Produk & Stok', icon: Package },
      { to: '/transaksi', label: 'Transaksi', icon: ReceiptText },
      { to: '/sales', label: 'Sales & Pembawa', icon: Users },
      { to: '/keuangan', label: 'Keuangan & Kas', icon: Landmark },
      { to: '/laporan', label: 'Laporan', icon: BarChart3 },
    ],
  },
  {
    label: 'Sistem',
    items: [{ to: '/pengaturan', label: 'Pengaturan', icon: SettingsIcon }],
  },
]

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/kasir': 'Kasir',
  '/produk': 'Produk & Stok',
  '/transaksi': 'Transaksi',
  '/sales': 'Sales & Pembawa Pelanggan',
  '/keuangan': 'Buku Kas & Keuangan',
  '/laporan': 'Laporan',
  '/pengaturan': 'Pengaturan',
}

const MOBILE_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/kasir', label: 'Kasir', icon: ShoppingCart },
  { to: '/produk', label: 'Produk', icon: Package },
  { to: '/transaksi', label: 'Transaksi', icon: ReceiptText },
  { to: '/laporan', label: 'Laporan', icon: BarChart3 },
]

function Sidebar({ open, onClose }) {
  const { user, logout, isDemo } = useAuth()
  const { settings } = useStore()

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-ink-900 text-slate-300 transition-transform duration-300 ease-out lg:translate-x-0',
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md ring-1 ring-white/10">
            {isImageLogo(settings.logo) ? (
              <img src={settings.logo} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl">{settings.logo || '☕'}</span>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-base font-extrabold tracking-tight text-white">E-Cash</p>
            <p className="truncate text-[10px] font-medium text-slate-500">Kasir · Stok · Laporan</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                        isActive
                          ? 'bg-white/[0.07] text-white shadow-inner ring-1 ring-inset ring-white/10'
                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={18}
                          className={isActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300'}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.tag ? (
                          <span className="rounded-md bg-brand-400/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-brand-300 ring-1 ring-inset ring-brand-400/20">
                            {item.tag}
                          </span>
                        ) : null}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/[0.06] p-3">
          <div className="flex items-center justify-between px-1">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold ring-1 ring-inset',
                isDemo
                  ? 'bg-amber-400/10 text-amber-300 ring-amber-400/20'
                  : 'bg-brand-400/10 text-brand-300 ring-brand-400/20',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {isDemo ? 'Mode Demo' : 'Firebase aktif'}
            </span>
            <span className="text-[10px] text-slate-600">v1.0</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.06]">
            <Avatar name={user?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{user?.name || 'Kasir'}</p>
              <p className="truncate text-[10px] text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-rose-300"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { settings, products } = useStore()
  const { user, logout, isDemo } = useAuth()
  const location = useLocation()
  const lowStock = lowStockProducts(products).length
  const title = PAGE_TITLES[location.pathname] || 'E-Cash'

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-dvh bg-slate-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
              aria-label="Buka menu"
            >
              <Menu size={19} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {settings.storeName}
              </p>
              <h1 className="truncate text-sm font-extrabold text-slate-900">{title}</h1>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={cn(
                  'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset sm:inline-flex',
                  isDemo
                    ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                    : 'bg-brand-50 text-brand-700 ring-brand-600/20',
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {isDemo ? 'Demo' : 'Live'}
              </span>

              <Link
                to="/produk"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                title={`${lowStock} produk stok menipis`}
                aria-label="Peringatan stok"
              >
                <Bell size={18} />
                {lowStock > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {lowStock > 9 ? '9+' : lowStock}
                  </span>
                ) : null}
              </Link>

              <Link
                to="/kasir"
                className="hidden h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 text-xs font-bold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 sm:inline-flex"
              >
                <Plus size={15} />
                Transaksi Baru
              </Link>

              <span className="mx-1 hidden h-6 w-px bg-slate-200 md:block" />

              <div className="hidden text-right md:block">
                <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                <p className="text-[10px] text-slate-400">{formatDate(new Date(), 'dd MMM yyyy')}</p>
              </div>

              <Link to="/pengaturan" aria-label="Profil" className="rounded-full ring-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <Avatar name={user?.name} />
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 sm:flex lg:hidden xl:flex"
                title="Keluar"
                aria-label="Keluar"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors',
                  isActive ? 'text-brand-600' : 'text-slate-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
