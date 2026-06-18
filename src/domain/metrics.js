import {
  PIPELINES,
  TRACKS,
  TRACK_BY_ID,
  APPLIED_STAGE,
  TERMINAL_STAGES,
  RESPONDED_STAGES,
  pipelineForTrack,
} from './constants.js'
import { parseDate, dayDiff, daysUntil, startOfWeek, toISODate } from './dates.js'

function kindOf(app) {
  return TRACK_BY_ID[app.track]?.kind ?? 'job'
}

// An app is "active" if it isn't in a terminal stage.
export function isActive(app) {
  return !TERMINAL_STAGES.has(app.status)
}

// Has the application been submitted (reached Applied or beyond)?
export function hasApplied(app) {
  const pipe = pipelineForTrack(app.track)
  const idx = pipe.indexOf(app.status)
  const appliedIdx = pipe.indexOf(APPLIED_STAGE)
  // Rejected/terminal stages sit at the end of the pipe but still count as applied
  // if the app was ever submitted. Treat anything not in pre-apply as applied.
  if (app.status === 'Saved') return false
  return idx >= appliedIdx || idx === -1 || TERMINAL_STAGES.has(app.status)
}

// Did the application advance past "Applied" into a real response stage?
export function hasResponded(app) {
  const set = RESPONDED_STAGES[kindOf(app)]
  return set.has(app.status)
}

// Funnel: ordered stage counts for a given pipeline kind ('job' | 'phd').
export function funnelByStatus(apps, kind = 'job') {
  const stages = PIPELINES[kind]
  const counts = Object.fromEntries(stages.map((s) => [s, 0]))
  for (const app of apps) {
    if (kindOf(app) !== kind) continue
    if (counts[app.status] !== undefined) counts[app.status] += 1
  }
  return stages.map((stage) => ({ stage, count: counts[stage] }))
}

// Count applications grouped by track (all tracks present, even if zero).
export function countByTrack(apps) {
  const counts = Object.fromEntries(TRACKS.map((t) => [t.id, 0]))
  for (const app of apps) {
    if (counts[app.track] !== undefined) counts[app.track] += 1
  }
  return TRACKS.map((t) => ({ id: t.id, label: t.label, color: t.color, count: counts[t.id] }))
}

// Response rate = (apps that advanced past Applied) / (apps that were submitted).
// Returns { responded, applied, rate } where rate is 0..1 (0 if none applied).
export function responseRate(apps) {
  let applied = 0
  let responded = 0
  for (const app of apps) {
    if (!hasApplied(app)) continue
    applied += 1
    if (hasResponded(app)) responded += 1
  }
  return { responded, applied, rate: applied === 0 ? 0 : responded / applied }
}

// Average days from dateApplied to first response, across apps that responded
// and have both timestamps. Uses timeline entries to find first advance if present,
// else falls back to updatedAt. Returns { avgDays, sampleSize }.
export function averageTimeToResponse(apps) {
  const durations = []
  for (const app of apps) {
    if (!hasResponded(app)) continue
    const applied = parseDate(app.dateApplied)
    if (!applied) continue
    const respondedAt = firstResponseDate(app)
    if (!respondedAt) continue
    const d = dayDiff(applied, respondedAt)
    if (d >= 0) durations.push(d)
  }
  if (durations.length === 0) return { avgDays: null, sampleSize: 0 }
  const sum = durations.reduce((a, b) => a + b, 0)
  return { avgDays: sum / durations.length, sampleSize: durations.length }
}

// Find the date a card first advanced into a response stage, from its timeline.
function firstResponseDate(app) {
  const respondedSet = RESPONDED_STAGES[kindOf(app)]
  const stageEvents = (app.timeline ?? [])
    .filter((e) => e.type === 'stage' && respondedSet.has(e.to))
    .map((e) => parseDate(e.ts))
    .filter(Boolean)
    .sort((a, b) => a - b)
  if (stageEvents.length) return stageEvents[0]
  // Fallback: updatedAt if the card is currently in a response stage.
  return parseDate(app.updatedAt)
}

// Weekly histogram of applications by dateApplied. Returns sorted [{ weekISO, count }].
export function applicationsByWeek(apps) {
  const buckets = new Map()
  for (const app of apps) {
    const d = parseDate(app.dateApplied)
    if (!d) continue
    const wk = toISODate(startOfWeek(d))
    buckets.set(wk, (buckets.get(wk) ?? 0) + 1)
  }
  return [...buckets.entries()]
    .map(([weekISO, count]) => ({ weekISO, count }))
    .sort((a, b) => (a.weekISO < b.weekISO ? -1 : 1))
}

// Upcoming deadlines: apps with a deadline, sorted ascending, with day counts.
// Optionally restrict to active apps. Overdue items come first (most overdue top).
export function upcomingDeadlines(apps, { now = new Date(), activeOnly = true } = {}) {
  return apps
    .filter((app) => app.deadline && (!activeOnly || isActive(app)))
    .map((app) => ({ app, days: daysUntil(app.deadline, now) }))
    .sort((a, b) => a.days - b.days)
}

export function overdueCount(apps, now = new Date()) {
  return upcomingDeadlines(apps, { now }).filter((d) => d.days < 0).length
}

// Salary/stipend distribution. EXCLUDES entries with no salary (type 'na' or
// missing) — never zero-filled. Normalizes ranges to a midpoint annual figure
// where possible so figures are comparable. Returns { points, excluded }.
export function salaryDistribution(apps) {
  const points = []
  let excluded = 0
  for (const app of apps) {
    const s = app.salary
    if (!s || s.type === 'na') {
      excluded += 1
      continue
    }
    let value = null
    if (s.type === 'range') {
      const lo = num(s.min)
      const hi = num(s.max)
      if (lo != null && hi != null) value = (lo + hi) / 2
      else value = lo ?? hi
    } else if (s.type === 'stipend') {
      value = num(s.amount)
    }
    if (value == null) {
      excluded += 1
      continue
    }
    points.push({
      id: app.id,
      company: app.company,
      track: app.track,
      type: s.type,
      value,
      period: s.period ?? 'year',
      currency: s.currency ?? 'USD',
    })
  }
  return { points, excluded }
}

function num(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}
