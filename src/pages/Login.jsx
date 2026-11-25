import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ReceiptText } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { DEMO_CREDENTIALS } from '../lib/constants'
import { Button, Input } from '../components/ui'

export default function Login() {
  const { user, login, register, isDemo } = useAuth()
  const location = useLocation()
  const from = location.state?.from || '/'
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={from} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      toast.success(mode === 'login' ? 'Berhasil masuk' : 'Akun berhasil dibuat')
    } catch (error) {
      const messages = {
        'auth/invalid-credential': 'Email atau password salah.',
        'auth/user-not-found': 'Email belum terdaftar.',
        'auth/wrong-password': 'Password salah.',
        'auth/email-already-in-use': 'Email sudah terdaftar.',
        'auth/weak-password': 'Password terlalu lemah. Gunakan minimal 6 karakter.',
        'auth/operation-not-allowed':
          'Metode Email/Password belum diaktifkan di Firebase Console.',
        'auth/unauthorized-domain':
          'Domain aplikasi ini belum diizinkan di Firebase Authentication.',
        'auth/network-request-failed':
          'Tidak dapat terhubung ke Firebase. Periksa koneksi internet Anda.',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat.',
      }
      toast.error(messages[error?.code] || error?.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDemo() {
    setLoading(true)
    try {
      await login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password)
      toast.success('Berhasil masuk dengan akun demo')
    } catch (error) {
      toast.error(error.message || 'Gagal masuk dengan akun demo')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setPassword('')
  }

  return (
    <div className="h-dvh overflow-hidden bg-white">
      <div className="grid h-full lg:grid-cols-[1.05fr_1fr]">
        <section className="hidden h-full flex-col justify-between bg-ink-950 p-10 lg:flex xl:p-14">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <ReceiptText size={19} />
            </span>
            <span className="text-base font-extrabold tracking-tight text-white">E-Cash</span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-[2.4rem] font-extrabold leading-[1.15] tracking-tight text-white xl:text-[3rem]">
              Kasir, stok, dan laporan dalam satu alur kerja.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
              Catat penjualan, pantau stok, dan tinjau performa toko tanpa berpindah aplikasi.
            </p>
          </div>

          <p className="text-[11px] text-slate-600">© 2026 E-Cash</p>
        </section>

        <section className="no-scrollbar flex h-full min-h-0 flex-col overflow-y-auto bg-white px-5 py-8 sm:px-8">
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
            <div className="mb-9 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                <ReceiptText size={17} />
              </span>
              <span className="text-sm font-extrabold tracking-tight text-slate-900">E-Cash</span>
            </div>

            <h2 className="text-[1.75rem] font-extrabold tracking-tight text-slate-900">
              {mode === 'login' ? 'Masuk ke E-Cash' : 'Buat akun E-Cash'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {mode === 'register' ? (
                <Input
                  label="Nama"
                  name="name"
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              ) : null}

              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'login' ? 'Masukkan password' : 'Minimal 6 karakter'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required
                minLength={6}
              />

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {mode === 'login' ? 'Masuk' : 'Buat akun'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {mode === 'login' ? 'Daftar' : 'Masuk'}
              </button>
            </p>

            {isDemo ? (
              <div className="mt-8 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={handleDemo}
                  disabled={loading}
                  className="w-full text-center text-xs font-semibold text-brand-700 transition hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Masuk dengan akun demo
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
