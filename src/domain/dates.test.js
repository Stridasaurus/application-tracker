import { describe, it, expect } from 'vitest'
import { daysUntil, deadlineStatus, dayDiff, startOfWeek, toISODate } from './dates.js'

const NOW = new Date(2026, 5, 18) // 2026-06-18 local

describe('daysUntil', () => {
  it('returns null when no deadline', () => {
    expect(daysUntil(null, NOW)).toBeNull()
    expect(daysUntil('', NOW)).toBeNull()
  })
  it('is 0 for today', () => {
    expect(daysUntil('2026-06-18', NOW)).toBe(0)
  })
  it('is positive for the future', () => {
    expect(daysUntil('2026-06-25', NOW)).toBe(7)
  })
  it('is negative for overdue', () => {
    expect(daysUntil('2026-06-10', NOW)).toBe(-8)
  })
  it('ignores time-of-day', () => {
    expect(daysUntil('2026-06-19T23:30:00', NOW)).toBe(1)
  })
})

describe('deadlineStatus', () => {
  it('classifies buckets', () => {
    expect(deadlineStatus(null, NOW)).toBe('none')
    expect(deadlineStatus('2026-06-10', NOW)).toBe('overdue')
    expect(deadlineStatus('2026-06-18', NOW)).toBe('today')
    expect(deadlineStatus('2026-06-23', NOW)).toBe('soon') // 5d
    expect(deadlineStatus('2026-07-10', NOW)).toBe('upcoming') // 22d
    expect(deadlineStatus('2026-12-01', NOW)).toBe('far')
  })
})

describe('dayDiff', () => {
  it('counts whole days', () => {
    expect(dayDiff(new Date(2026, 0, 1), new Date(2026, 0, 8))).toBe(7)
    expect(dayDiff(new Date(2026, 0, 8), new Date(2026, 0, 1))).toBe(-7)
  })
})

describe('startOfWeek', () => {
  it('snaps to Monday', () => {
    // 2026-06-18 is a Thursday -> Monday 2026-06-15
    expect(toISODate(startOfWeek(NOW))).toBe('2026-06-15')
    // Monday stays put
    expect(toISODate(startOfWeek(new Date(2026, 5, 15)))).toBe('2026-06-15')
    // Sunday belongs to the prior Monday
    expect(toISODate(startOfWeek(new Date(2026, 5, 21)))).toBe('2026-06-15')
  })
})
