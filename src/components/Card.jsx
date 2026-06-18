import { TRACK_BY_ID } from '../domain/constants.js'
import { Pill, cx } from './ui.jsx'
import DeadlineBadge from './DeadlineBadge.jsx'
import { formatSalary } from './SalaryInput.jsx'

export default function Card({ app, onClick, now, draggable, onDragStart }) {
  const track = TRACK_BY_ID[app.track]
  const salary = formatSalary(app.salary)

  return (
    <button
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      className={cx(
        'group w-full rounded-xl border bg-white p-3 text-left shadow-sm transition',
        'hover:border-indigo-400 hover:shadow-md',
        'border-slate-200 dark:border-slate-700 dark:bg-slate-800/80',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
      style={{ borderLeft: `3px solid ${track?.color ?? '#64748b'}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold leading-tight">{app.company || 'Untitled'}</div>
          {app.role && <div className="truncate text-xs text-slate-500 dark:text-slate-400">{app.role}</div>}
        </div>
        {app.deadline && <DeadlineBadge deadline={app.deadline} now={now} />}
      </div>

      {(salary || app.tags?.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {salary && (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {salary}
            </span>
          )}
          {app.tags?.slice(0, 3).map((t) => (
            <Pill key={t}>{t}</Pill>
          ))}
          {app.tags?.length > 3 && <span className="text-xs text-slate-400">+{app.tags.length - 3}</span>}
        </div>
      )}
    </button>
  )
}
