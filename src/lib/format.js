import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') return value.toDate()
  if (typeof value === 'number') return new Date(value)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatRupiah(value) {
  const number = Math.round(Number(value) || 0)
  return `Rp ${number.toLocaleString('id-ID')}`
}

export function formatNumber(value) {
  return (Number(value) || 0).toLocaleString('id-ID')
}

export function formatCompact(value) {
  const number = Number(value) || 0
  if (Math.abs(number) >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(1)} M`
  if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(1)} jt`
  if (Math.abs(number) >= 1_000) return `${Math.round(number / 1_000)} rb`
  return String(number)
}

export function formatDate(value, pattern = 'dd MMM yyyy') {
  const date = toDate(value)
  return date ? format(date, pattern, { locale: localeId }) : '—'
}

export function formatDateTime(value) {
  return formatDate(value, 'dd MMM yyyy, HH:mm')
}

export function formatTime(value) {
  return formatDate(value, 'HH:mm')
}

export function dateKey(value = new Date()) {
  const date = toDate(value) || new Date()
  return format(date, 'yyyy-MM-dd')
}

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'EC'
  )
}

export function greeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function percentChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
