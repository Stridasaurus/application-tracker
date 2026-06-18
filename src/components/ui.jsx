import { useEffect, useRef } from 'react'

export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

// Accessible modal with backdrop, ESC to close, and focus trap-ish behavior.
export function Modal({ open, onClose, children, title, wide }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        className={cx(
          'my-4 w-full rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-700">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ' +
  'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 ' +
  'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

export function Button({ variant = 'primary', className, ...props }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50'
  const styles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500',
    secondary:
      'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
  }
  return <button className={cx(base, styles[variant], className)} {...props} />
}

export function Pill({ color, children, onRemove, active, onClick, className }) {
  return (
    <span
      onClick={onClick}
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        onClick && 'cursor-pointer',
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        className,
      )}
      style={!active && color ? { backgroundColor: color + '22', color } : undefined}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 opacity-60 hover:opacity-100"
          aria-label="Remove"
        >
          ✕
        </button>
      )}
    </span>
  )
}
