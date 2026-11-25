import { useEffect } from 'react'
import { ArrowDownRight, ArrowUpRight, Loader2, X } from 'lucide-react'
import { cn } from '../../lib/cn'

const buttonVariants = {
  primary:
    'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 focus-visible:ring-brand-500/40',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-300/60',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300/60',
  danger:
    'bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700 focus-visible:ring-rose-500/40',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-500/30',
  dark: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-500/40',
  white: 'bg-white text-slate-900 shadow-sm hover:bg-slate-100 focus-visible:ring-white/50',
}

const buttonSizes = {
  xs: 'h-8 gap-1.5 rounded-lg px-2.5 text-xs',
  sm: 'h-9 gap-2 rounded-xl px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-sm',
  icon: 'h-10 w-10 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  as: Component = 'button',
  type = 'button',
  disabled,
  ...props
}) {
  return (
    <Component
      type={Component === 'button' ? type : undefined}
      disabled={Component === 'button' ? disabled || loading : undefined}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-4 active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </Component>
  )
}

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, description, action, icon: Icon, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon size={17} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function Badge({ children, tone = 'slate', className, dot = false }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 ring-slate-500/10',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  }
  const dots = {
    slate: 'bg-slate-400',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    violet: 'bg-violet-500',
    brand: 'bg-brand-500',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} /> : null}
      {children}
    </span>
  )
}

export function Input({ label, hint, error, className, wrapperClassName, required, right, ...props }) {
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label ? (
        <label htmlFor={props.id || props.name} className="mb-1.5 block text-xs font-semibold text-slate-700">
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={props.id || props.name}
          className={cn(
            'h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm transition',
            'placeholder:text-slate-400 focus:outline-none focus:ring-4',
            error
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
              : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/10',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
            right ? 'pr-11' : '',
            className,
          )}
          {...props}
        />
        {right ? (
          <div className="absolute inset-y-0 right-1.5 flex items-center">{right}</div>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function Select({ label, hint, error, className, wrapperClassName, required, children, ...props }) {
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label ? (
        <label htmlFor={props.id || props.name} className="mb-1.5 block text-xs font-semibold text-slate-700">
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      ) : null}
      <select
        id={props.id || props.name}
        className={cn(
          'h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\'%3E%3Cpath d=\'m4 6 4 4 4-4\'/%3E%3C/svg%3E")] bg-[right_12px_center] bg-no-repeat px-3.5 pr-9 text-sm text-slate-900 shadow-sm transition',
          'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10',
          error ? 'border-rose-300' : '',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function Textarea({ label, hint, error, className, wrapperClassName, rows = 3, ...props }) {
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label ? (
        <label htmlFor={props.id || props.name} className="mb-1.5 block text-xs font-semibold text-slate-700">
          {label}
        </label>
      ) : null}
      <textarea
        id={props.id || props.name}
        rows={rows}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400',
          'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10',
          error ? 'border-rose-300' : '',
          className,
        )}
        {...props}
      />
      {error ? <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left disabled:opacity-50"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-slate-500">{description}</span> : null}
      </span>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-[3px]',
          )}
          style={{ height: 18, width: 18 }}
        />
      </span>
    </button>
  )
}

export const modalSizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-5xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  bodyClassName,
  hideClose = false,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-slide-up sm:rounded-2xl',
          modalSizes[size],
          className,
        )}
      >
        {title ? (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
            </div>
            {!hideClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>
        ) : null}
        <div className={cn('min-h-0 flex-1 overflow-y-auto', bodyClassName || 'px-5 py-5 sm:px-6')}>{children}</div>
        {footer ? (
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {Icon ? (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon size={24} />
        </span>
      ) : null}
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-100', className)} />
}

export function Spinner({ label, className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-sm text-slate-500', className)}>
      <Loader2 size={18} className="animate-spin text-brand-600" />
      {label ? <span>{label}</span> : null}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, hint, trend, tone = 'brand', loading, className }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    green: 'bg-emerald-50 text-emerald-600',
  }
  const positive = Number(trend) >= 0
  return (
    <Card className={cn('p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-semibold text-slate-500">{label}</p>
        {Icon ? (
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tones[tone] || tones.brand)}>
            <Icon size={17} />
          </span>
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="mt-2.5 h-7 w-28" />
      ) : (
        <p className="mt-1.5 text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl xl:text-2xl" title={String(value)}>
          {value}
        </p>
      )}
      <div className="mt-2.5 flex items-center gap-2">
        {typeof trend === 'number' ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold',
              positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600',
            )}
          >
            {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        ) : null}
        {hint ? <p className="min-w-0 leading-snug text-[11px] text-slate-400">{hint}</p> : null}
      </div>
    </Card>
  )
}

export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cn('inline-flex items-center rounded-xl bg-slate-100 p-0.5', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'whitespace-nowrap rounded-[10px] px-3 py-1.5 text-xs font-semibold transition',
            value === option.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function PageHeading({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-xs text-slate-500 sm:text-sm">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  )
}

export function Avatar({ name, size = 'md', className }) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  }
  const initialsText =
    String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'EC'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-teal-700 font-bold text-white',
        sizes[size],
        className,
      )}
    >
      {initialsText}
    </span>
  )
}
