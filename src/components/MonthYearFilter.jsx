import { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { Select } from './ui'

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

/**
 * Komponen reusable untuk filter rentang Bulan dan Tahun
 * @param {string|number} selectedMonth - 'all' atau index 0..11
 * @param {function} onMonthChange
 * @param {string|number} selectedYear - 'all' atau tahun (e.g. 2026)
 * @param {function} onYearChange
 * @param {Array<number>} availableYears - daftar tahun unik yang bisa dipilih
 * @param {boolean} showAllOption - apakah opsi "Semua Bulan" / "Semua Tahun" diizinkan (default: true)
 * @param {string} className
 */
export default function MonthYearFilter({
  selectedMonth,
  onMonthChange,
  selectedYear,
  onYearChange,
  availableYears,
  showAllOption = true,
  className = '',
}) {
  const years = useMemo(() => {
    const set = new Set(availableYears || [])
    const currentYear = new Date().getFullYear()
    set.add(currentYear)
    set.add(currentYear - 1)
    set.add(currentYear - 2)
    return Array.from(set).sort((a, b) => b - a)
  }, [availableYears])

  return (
    <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
        <Calendar size={14} className="text-slate-400 shrink-0" />
        <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Periode:</span>

        {/* Selector Bulan */}
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="h-8 rounded-lg border-0 bg-transparent py-0 pl-1 pr-6 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-0 cursor-pointer"
          aria-label="Pilih Bulan"
        >
          {showAllOption && <option value="all">Semua Bulan</option>}
          {MONTH_NAMES.map((name, idx) => (
            <option key={idx} value={String(idx)}>
              {name}
            </option>
          ))}
        </select>

        <span className="text-slate-300">/</span>

        {/* Selector Tahun */}
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="h-8 rounded-lg border-0 bg-transparent py-0 pl-1 pr-6 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-0 cursor-pointer"
          aria-label="Pilih Tahun"
        >
          {showAllOption && <option value="all">Semua Tahun</option>}
          {years.map((yr) => (
            <option key={yr} value={String(yr)}>
              {yr}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
