import { deadlineStatus, relativeDeadline, formatDate } from '../domain/dates.js'
import { cx } from './ui.jsx'

const STYLES = {
  overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  today: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  soon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  upcoming: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  far: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

const ICON = { overdue: '⚠', today: '⏰', soon: '⏳', upcoming: '📅', far: '📅' }

export default function DeadlineBadge({ deadline, now, showDate }) {
  if (!deadline) return null
  const status = deadlineStatus(deadline, now)
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
        STYLES[status],
      )}
      title={`Deadline: ${formatDate(deadline)}`}
    >
      <span aria-hidden>{ICON[status]}</span>
      {showDate ? formatDate(deadline) : relativeDeadline(deadline, now)}
    </span>
  )
}
