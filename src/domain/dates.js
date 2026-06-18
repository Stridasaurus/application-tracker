// Date helpers kept pure and timezone-stable by operating on local calendar days.

// Parse an ISO yyyy-mm-dd (or full ISO) into a local Date at midnight.
export function parseDate(iso) {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const MS_PER_DAY = 86400000

// Whole-day difference between two dates (b - a), ignoring time of day.
export function dayDiff(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / MS_PER_DAY)
}

// Days from `now` until `deadline`. Negative = overdue. null if no deadline.
export function daysUntil(deadlineIso, now = new Date()) {
  const d = parseDate(deadlineIso)
  if (!d) return null
  return dayDiff(now, d)
}

// Classify a deadline relative to now.
//   'none' | 'overdue' | 'today' | 'soon' (<=7d) | 'upcoming' (<=30d) | 'far'
export function deadlineStatus(deadlineIso, now = new Date()) {
  const days = daysUntil(deadlineIso, now)
  if (days === null) return 'none'
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 7) return 'soon'
  if (days <= 30) return 'upcoming'
  return 'far'
}

export function toISODate(date) {
  const d = startOfDay(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO() {
  return toISODate(new Date())
}

// Monday-based start of the ISO week containing `date`.
export function startOfWeek(date) {
  const d = startOfDay(date)
  const dow = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - dow)
  return d
}

export function formatDate(iso) {
  const d = parseDate(iso)
  if (!d) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// Human "in 5 days" / "3 days ago" / "today".
export function relativeDeadline(deadlineIso, now = new Date()) {
  const days = daysUntil(deadlineIso, now)
  if (days === null) return ''
  if (days === 0) return 'due today'
  if (days < 0) return `${Math.abs(days)}d overdue`
  return `in ${days}d`
}
