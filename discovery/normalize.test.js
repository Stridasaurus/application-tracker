import { describe, it, expect } from 'vitest'
import {
  hashId,
  normalizeUrl,
  matchesAnyKeyword,
  makeListing,
  dedupeListings,
  filterByKeywords,
  filterByExcludeKeywords,
  sortByPostedDesc,
  capPerTrack,
  capPerCompany,
  isLocalListing,
  boostLocalListings,
  processListings,
} from './normalize.js'

describe('hashId', () => {
  it('is deterministic and stable', () => {
    expect(hashId('abc')).toBe(hashId('abc'))
    expect(hashId('abc')).not.toBe(hashId('abd'))
  })
})

describe('normalizeUrl', () => {
  it('strips protocol, query, fragment, trailing slash, and lowercases', () => {
    expect(normalizeUrl('https://Boards.io/Job/1/?utm=x#frag')).toBe('boards.io/job/1')
    expect(normalizeUrl('http://a.com/')).toBe('a.com')
    expect(normalizeUrl('')).toBe('')
    expect(normalizeUrl(null)).toBe('')
  })
})

describe('matchesAnyKeyword', () => {
  it('is case-insensitive substring match', () => {
    expect(matchesAnyKeyword('Senior Signal Processing Eng', ['signal processing'])).toBe(true)
    expect(matchesAnyKeyword('Frontend Dev', ['signal processing', 'quant'])).toBe(false)
    expect(matchesAnyKeyword('', ['x'])).toBe(false)
  })
})

describe('makeListing', () => {
  it('produces stable ids from url and trims fields', () => {
    const a = makeListing({ title: ' Quant ', company: ' TS ', url: 'https://x.com/j/1?a=2', track: 'quant' })
    const b = makeListing({ title: 'Quant', company: 'TS', url: 'http://x.com/j/1', track: 'quant' })
    expect(a.id).toBe(b.id) // same normalized url -> same id
    expect(a.title).toBe('Quant')
    expect(a.company).toBe('TS')
  })
  it('falls back to company|title id when no url', () => {
    const a = makeListing({ title: 'Quant', company: 'TS', track: 'quant' })
    expect(a.id).toBe(makeListing({ title: 'Quant', company: 'TS', track: 'neuro' }).id)
  })
})

describe('dedupeListings', () => {
  it('collapses by url and by company+title', () => {
    const ls = [
      makeListing({ title: 'Quant', company: 'TS', url: 'https://x.com/1' }),
      makeListing({ title: 'Quant', company: 'TS', url: 'http://x.com/1/' }), // same url
      makeListing({ title: 'Quant Researcher', company: 'TS', url: '' }),
      makeListing({ title: 'quant researcher', company: 'ts', url: 'https://y.com/2' }), // same c+t
    ]
    const out = dedupeListings(ls)
    expect(out.length).toBe(2)
  })
})

describe('filterByKeywords', () => {
  const kw = { quant: ['quant', 'signal processing'], neuro: ['bci'] }
  it('keeps matches and drops non-matches per track', () => {
    const ls = [
      makeListing({ title: 'Quant Researcher', track: 'quant', url: 'a' }),
      makeListing({ title: 'Cook', track: 'quant', url: 'b' }),
      makeListing({ title: 'BCI Engineer', track: 'neuro', url: 'c' }),
    ]
    const out = filterByKeywords(ls, kw)
    expect(out.map((l) => l.title)).toEqual(['Quant Researcher', 'BCI Engineer'])
  })
  it('alwaysKeepSources bypass the keyword filter', () => {
    const ls = [makeListing({ title: 'Anything', track: 'quant', url: 'a', source: 'greenhouse:twosigma' })]
    expect(filterByKeywords(ls, kw, { alwaysKeepSources: ['greenhouse:'] }).length).toBe(1)
  })
})

describe('filterByExcludeKeywords', () => {
  const excl = ['senior', 'nurse', 'oracle', 'vp ']
  it('removes listings whose title matches an exclude keyword', () => {
    const ls = [
      makeListing({ title: 'Senior Plasma Physicist', url: 'a', track: 'fusion' }),
      makeListing({ title: 'Plasma Physicist', url: 'b', track: 'fusion' }),
      makeListing({ title: 'Neuro ICU Nurse', url: 'c', track: 'neuro' }),
      makeListing({ title: 'Oracle Fusion Consultant', url: 'd', track: 'fusion' }),
      makeListing({ title: 'VP Engineering', url: 'e', track: 'quant' }),
    ]
    const out = filterByExcludeKeywords(ls, excl)
    expect(out.map((l) => l.title)).toEqual(['Plasma Physicist'])
  })
  it('returns all listings when excludeKeywords is empty', () => {
    const ls = [makeListing({ title: 'Senior Engineer', url: 'a', track: 'quant' })]
    expect(filterByExcludeKeywords(ls, []).length).toBe(1)
  })
})

describe('sortByPostedDesc', () => {
  it('newest first, undated last', () => {
    const ls = [
      makeListing({ title: 'a', url: 'a', postedAt: '2026-06-01' }),
      makeListing({ title: 'b', url: 'b', postedAt: null }),
      makeListing({ title: 'c', url: 'c', postedAt: '2026-06-10' }),
    ]
    expect(sortByPostedDesc(ls).map((l) => l.title)).toEqual(['c', 'a', 'b'])
  })
})

describe('capPerTrack', () => {
  it('limits each track independently, preserving order', () => {
    const ls = [
      makeListing({ title: 'd1', url: 'd1', track: 'defense' }),
      makeListing({ title: 'd2', url: 'd2', track: 'defense' }),
      makeListing({ title: 'd3', url: 'd3', track: 'defense' }),
      makeListing({ title: 'q1', url: 'q1', track: 'quant' }),
    ]
    const out = capPerTrack(ls, 2)
    expect(out.map((l) => l.title)).toEqual(['d1', 'd2', 'q1'])
  })
})

describe('capPerCompany', () => {
  it('limits each company independently, preserving order', () => {
    const ls = [
      makeListing({ title: 'a1', url: 'a1', company: 'Anduril' }),
      makeListing({ title: 'a2', url: 'a2', company: 'anduril' }), // case-insensitive
      makeListing({ title: 'a3', url: 'a3', company: 'Anduril' }),
      makeListing({ title: 'e1', url: 'e1', company: 'Epirus' }),
    ]
    expect(capPerCompany(ls, 2).map((l) => l.title)).toEqual(['a1', 'a2', 'e1'])
  })
})

describe('isLocalListing', () => {
  it('matches Space Coast / Brevard towns, not all of Florida', () => {
    expect(isLocalListing(makeListing({ location: 'Melbourne, FL', url: 'a' }))).toBe(true)
    expect(isLocalListing(makeListing({ location: 'Palm Bay, Florida', url: 'b' }))).toBe(true)
    expect(isLocalListing(makeListing({ location: 'Cape Canaveral, FL', url: 'c' }))).toBe(true)
    expect(isLocalListing(makeListing({ location: 'Miami, FL', url: 'd' }))).toBe(false)
    expect(isLocalListing(makeListing({ location: 'Remote, USA', url: 'e' }))).toBe(false)
  })
})

describe('boostLocalListings', () => {
  it('floats local listings to the front, preserving relative order', () => {
    const ls = [
      makeListing({ title: 'remote', location: 'Austin, TX', url: 'a' }),
      makeListing({ title: 'local1', location: 'Palm Bay, FL', url: 'b' }),
      makeListing({ title: 'remote2', location: 'Denver, CO', url: 'c' }),
      makeListing({ title: 'local2', location: 'Melbourne, FL', url: 'd' }),
    ]
    expect(boostLocalListings(ls).map((l) => l.title)).toEqual(['local1', 'local2', 'remote', 'remote2'])
  })
})

describe('filterByKeywords keepLocal', () => {
  const kw = { defense: ['radar'] }
  it('keeps local listings even when keywords do not match', () => {
    const ls = [
      makeListing({ title: 'Avionics Technician', track: 'defense', location: 'Melbourne, FL', url: 'a' }),
      makeListing({ title: 'Avionics Technician', track: 'defense', location: 'Seattle, WA', url: 'b' }),
    ]
    expect(filterByKeywords(ls, kw, { keepLocal: true }).map((l) => l.location)).toEqual(['Melbourne, FL'])
    expect(filterByKeywords(ls, kw, { keepLocal: false }).length).toBe(0)
  })
})

describe('processListings', () => {
  it('keepLocal lets a non-keyword local role through but still drops senior local roles', () => {
    const kw = { defense: ['radar'] }
    const ls = [
      makeListing({ title: 'Avionics Technician', track: 'defense', location: 'Melbourne, FL', url: 'a', postedAt: '2026-06-05' }),
      makeListing({ title: 'Senior Avionics Engineer', track: 'defense', location: 'Palm Bay, FL', url: 'b', postedAt: '2026-06-06' }),
      makeListing({ title: 'Janitor', track: 'defense', location: 'Boston, MA', url: 'c', postedAt: '2026-06-07' }),
    ]
    const out = processListings(ls, kw, { maxPerTrack: 50, maxPerCompany: 10, excludeTitleKeywords: ['senior'], keepLocal: true })
    // local non-keyword role kept; senior local role excluded; non-local non-keyword dropped
    expect(out.map((l) => l.title)).toEqual(['Avionics Technician'])
  })

  it('dedupes, keyword-filters every source, sorts, and caps per track', () => {
    const kw = { defense: ['radar'], quant: ['quant'] }
    const ls = [
      makeListing({ title: 'Radar Eng', track: 'defense', url: 'a', postedAt: '2026-06-01', source: 'greenhouse:x' }),
      makeListing({ title: 'Radar Sci', track: 'defense', url: 'b', postedAt: '2026-06-05', source: 'greenhouse:x' }),
      makeListing({ title: 'Recruiter', track: 'defense', url: 'c', source: 'greenhouse:x' }), // filtered out
      makeListing({ title: 'Quant Researcher', track: 'quant', url: 'd', postedAt: '2026-06-02' }),
    ]
    const out = processListings(ls, kw, { maxPerTrack: 1, maxPerCompany: 10 })
    // company-board listings are now keyword-filtered (no bypass), newest first, 1 per track
    expect(out.map((l) => l.title)).toEqual(['Radar Sci', 'Quant Researcher'])
  })

  it('caps per company so one employer cannot fill a track', () => {
    const kw = { defense: ['radar'] }
    const ls = [
      makeListing({ title: 'Radar 1', track: 'defense', url: 'r1', company: 'Anduril', postedAt: '2026-06-05' }),
      makeListing({ title: 'Radar 2', track: 'defense', url: 'r2', company: 'Anduril', postedAt: '2026-06-04' }),
      makeListing({ title: 'Radar 3', track: 'defense', url: 'r3', company: 'Anduril', postedAt: '2026-06-03' }),
      makeListing({ title: 'Radar X', track: 'defense', url: 'rx', company: 'Epirus', postedAt: '2026-06-02' }),
    ]
    const out = processListings(ls, kw, { maxPerTrack: 50, maxPerCompany: 2 })
    expect(out.map((l) => l.title)).toEqual(['Radar 1', 'Radar 2', 'Radar X'])
  })
})
