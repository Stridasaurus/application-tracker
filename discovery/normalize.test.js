import { describe, it, expect } from 'vitest'
import {
  hashId,
  normalizeUrl,
  matchesAnyKeyword,
  makeListing,
  dedupeListings,
  filterByKeywords,
  sortByPostedDesc,
  capPerTrack,
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

describe('processListings', () => {
  it('dedupes, keyword-filters every source, sorts, and caps per track', () => {
    const kw = { defense: ['radar'], quant: ['quant'] }
    const ls = [
      makeListing({ title: 'Radar Eng', track: 'defense', url: 'a', postedAt: '2026-06-01', source: 'greenhouse:x' }),
      makeListing({ title: 'Radar Sci', track: 'defense', url: 'b', postedAt: '2026-06-05', source: 'greenhouse:x' }),
      makeListing({ title: 'Recruiter', track: 'defense', url: 'c', source: 'greenhouse:x' }), // filtered out
      makeListing({ title: 'Quant Researcher', track: 'quant', url: 'd', postedAt: '2026-06-02' }),
    ]
    const out = processListings(ls, kw, { maxPerTrack: 1 })
    // company-board listings are now keyword-filtered (no bypass), newest first, 1 per track
    expect(out.map((l) => l.title)).toEqual(['Radar Sci', 'Quant Researcher'])
  })
})
