import { TRACK_BY_ID } from '../domain/constants.js'
import { upcomingDeadlines } from '../domain/metrics.js'
import { formatDate, relativeDeadline, deadlineStatus } from '../domain/dates.js'
import { Pill, cx } from './ui.jsx'

const ROW_STYLE = {
  overdue: 'border-l-rose-500 bg-rose-50/60 dark:bg-rose-900/10',
  today: 'border-l-orange-500 bg-orange-50/60 dark:bg-orange-900/10',
  soon: 'border-l-amber-500 bg-amber-50/60 dark:bg-amber-900/10',
  upcoming: 'border-l-sky-500',
  far: 'border-l-slate-300 dark:border-l-slate-700',
}

// Sorted "what's due next" list — overdue first, flagged. The headline feature.
export default function DeadlinesView({ apps, now, onOpen, limit }) {
  const items = upcomingDeadlines(apps, { now, activeOnly: true })
  const shown = limit ? items.slice(0, limit) : items
  const overdue = items.filter((i) => i.days < 0).length

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
        No upcoming deadlines on active applications. Add deadlines to your cards to see them surfaced here.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {overdue > 0 && (
        <div className="rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
          ⚠ {overdue} overdue {overdue === 1 ? 'item' : 'items'} need attention.
        </div>
      )}
      {shown.map(({ app, days }) => {
        const status = deadlineStatus(app.deadline, now)
        const track = TRACK_BY_ID[app.track]
        return (
          <button
            key={app.id}
            onClick={() => onOpen?.(app.id)}
            className={cx(
              'flex w-full items-center justify-between gap-3 rounded-lg border-l-4 bg-white px-3 py-2 text-left shadow-sm transition hover:shadow-md dark:bg-slate-800',
              ROW_STYLE[status],
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{app.company}</span>
                <Pill color={track?.color}>{track?.label}</Pill>
              </div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                {app.role} · {app.status}
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div
                className={cx(
                  'text-sm font-semibold',
                  days < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200',
                )}
              >
                {relativeDeadline(app.deadline, now)}
              </div>
              <div className="text-xs text-slate-400">{formatDate(app.deadline)}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
