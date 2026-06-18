import { describe, it, expect } from 'vitest'
import {
  funnelByStatus,
  countByTrack,
  responseRate,
  averageTimeToResponse,
  applicationsByWeek,
  upcomingDeadlines,
  overdueCount,
  salaryDistribution,
  isActive,
  hasApplied,
  hasResponded,
} from './metrics.js'

const NOW = new Date(2026, 5, 18)

function app(overrides) {
  return {
    id: Math.random().toString(36).slice(2),
    company: 'Co',
    role: 'Role',
    track: 'quant',
    status: 'Applied',
    dateApplied: '2026-06-01',
    deadline: null,
    salary: { type: 'na' },
    timeline: [],
    updatedAt: '2026-06-05',
    ...overrides,
  }
}

describe('isActive / hasApplied / hasResponded', () => {
  it('terminal stages are not active', () => {
    expect(isActive(app({ status: 'Rejected' }))).toBe(false)
    expect(isActive(app({ status: 'Offer' }))).toBe(false)
    expect(isActive(app({ status: 'Phone Screen' }))).toBe(true)
  })
  it('Saved has not applied', () => {
    expect(hasApplied(app({ status: 'Saved' }))).toBe(false)
    expect(hasApplied(app({ status: 'Applied' }))).toBe(true)
    expect(hasApplied(app({ status: 'Rejected' }))).toBe(true)
  })
  it('response stages differ by track kind', () => {
    expect(hasResponded(app({ track: 'quant', status: 'Phone Screen' }))).toBe(true)
    expect(hasResponded(app({ track: 'quant', status: 'Applied' }))).toBe(false)
    expect(hasResponded(app({ track: 'phd', status: 'Interview/Visit' }))).toBe(true)
    expect(hasResponded(app({ track: 'phd', status: 'Applied' }))).toBe(false)
  })
})

describe('funnelByStatus', () => {
  it('counts only matching pipeline kind, all stages present', () => {
    const apps = [
      app({ track: 'quant', status: 'Applied' }),
      app({ track: 'neuro', status: 'Phone Screen' }),
      app({ track: 'phd', status: 'Interview/Visit' }), // excluded from job funnel
    ]
    const job = funnelByStatus(apps, 'job')
    expect(job.find((s) => s.stage === 'Applied').count).toBe(1)
    expect(job.find((s) => s.stage === 'Phone Screen').count).toBe(1)
    expect(job.length).toBe(7)
    const phd = funnelByStatus(apps, 'phd')
    expect(phd.find((s) => s.stage === 'Interview/Visit').count).toBe(1)
  })
})

describe('countByTrack', () => {
  it('includes every track, zero-filled', () => {
    const res = countByTrack([app({ track: 'quant' }), app({ track: 'quant' }), app({ track: 'phd' })])
    expect(res.find((t) => t.id === 'quant').count).toBe(2)
    expect(res.find((t) => t.id === 'phd').count).toBe(1)
    expect(res.find((t) => t.id === 'fusion').count).toBe(0)
    expect(res.length).toBe(6)
  })
})

describe('responseRate', () => {
  it('divides responders by applicants, ignoring Saved', () => {
    const apps = [
      app({ status: 'Saved' }), // not counted
      app({ status: 'Applied' }), // applied, no response
      app({ status: 'Phone Screen' }), // applied + responded
      app({ status: 'Onsite/Final' }), // applied + responded
      app({ status: 'Rejected' }), // applied, no response
    ]
    const r = responseRate(apps)
    expect(r.applied).toBe(4)
    expect(r.responded).toBe(2)
    expect(r.rate).toBeCloseTo(0.5)
  })
  it('is 0 with no applicants', () => {
    expect(responseRate([app({ status: 'Saved' })]).rate).toBe(0)
  })
})

describe('averageTimeToResponse', () => {
  it('averages applied-to-first-response using timeline', () => {
    const apps = [
      app({
        status: 'Phone Screen',
        dateApplied: '2026-06-01',
        timeline: [{ type: 'stage', to: 'Phone Screen', ts: '2026-06-11' }],
      }),
      app({
        status: 'Onsite/Final',
        dateApplied: '2026-06-01',
        timeline: [
          { type: 'stage', to: 'Phone Screen', ts: '2026-06-05' },
          { type: 'stage', to: 'Onsite/Final', ts: '2026-06-20' },
        ],
      }),
    ]
    const r = averageTimeToResponse(apps)
    expect(r.sampleSize).toBe(2)
    expect(r.avgDays).toBeCloseTo((10 + 4) / 2) // 7
  })
  it('returns null average with no responders', () => {
    expect(averageTimeToResponse([app({ status: 'Applied' })]).avgDays).toBeNull()
  })
})

describe('applicationsByWeek', () => {
  it('buckets by Monday week and sorts', () => {
    const res = applicationsByWeek([
      app({ dateApplied: '2026-06-15' }),
      app({ dateApplied: '2026-06-17' }),
      app({ dateApplied: '2026-06-08' }),
      app({ dateApplied: null }), // ignored
    ])
    expect(res).toEqual([
      { weekISO: '2026-06-08', count: 1 },
      { weekISO: '2026-06-15', count: 2 },
    ])
  })
})

describe('upcomingDeadlines / overdueCount', () => {
  const apps = [
    app({ company: 'A', deadline: '2026-06-10', status: 'Applied' }), // overdue
    app({ company: 'B', deadline: '2026-06-20', status: 'Applied' }), // soon
    app({ company: 'C', deadline: '2026-12-01', status: 'Applied' }), // far
    app({ company: 'D', deadline: null }), // no deadline -> excluded
    app({ company: 'E', deadline: '2026-06-19', status: 'Rejected' }), // inactive
  ]
  it('sorts ascending and excludes no-deadline; activeOnly drops terminal', () => {
    const res = upcomingDeadlines(apps, { now: NOW, activeOnly: true })
    expect(res.map((r) => r.app.company)).toEqual(['A', 'B', 'C'])
    expect(res[0].days).toBe(-8)
  })
  it('includes inactive when activeOnly false', () => {
    const res = upcomingDeadlines(apps, { now: NOW, activeOnly: false })
    expect(res.map((r) => r.app.company)).toContain('E')
  })
  it('counts overdue', () => {
    expect(overdueCount(apps, NOW)).toBe(1)
  })
})

describe('salaryDistribution', () => {
  it('excludes na/missing, never zero-fills, midpoints ranges', () => {
    const apps = [
      app({ company: 'R', salary: { type: 'range', min: 100000, max: 200000 } }),
      app({ company: 'S', salary: { type: 'stipend', amount: 45000 } }),
      app({ company: 'N', salary: { type: 'na' } }),
      app({ company: 'M', salary: undefined }),
      app({ company: 'P', salary: { type: 'range' } }), // no numbers -> excluded
    ]
    const { points, excluded } = salaryDistribution(apps)
    expect(points.map((p) => p.value).sort((a, b) => a - b)).toEqual([45000, 150000])
    expect(excluded).toBe(3)
    expect(points.find((p) => p.company === 'R').value).toBe(150000)
  })
})
