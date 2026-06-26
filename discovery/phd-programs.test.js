import { describe, it, expect } from 'vitest'
import { PHD_PROGRAMS, phdProgramListings } from './phd-programs.js'
import { processListings, isTargetListing } from './normalize.js'
import { TARGET_NAMES_BY_TRACK } from './targets.js'
import { DISCOVERY_TRACKS } from './sources.js'

describe('PHD_PROGRAMS', () => {
  it('covers all 29 researched programs with the required fields', () => {
    expect(PHD_PROGRAMS).toHaveLength(29)
    for (const p of PHD_PROGRAMS) {
      expect(p.program).toBeTruthy()
      expect(p.institution).toBeTruthy()
      expect(p.url).toMatch(/^https?:\/\//)
      expect(typeof p.bsEligible).toBe('boolean')
    }
  })

  it('flags IST Austria as BS-eligible and a typical European program as not', () => {
    const ista = PHD_PROGRAMS.find((p) => p.institution === 'IST Austria')
    const donders = PHD_PROGRAMS.find((p) => p.institution === 'Radboud University')
    expect(ista.bsEligible).toBe(true)
    expect(donders.bsEligible).toBe(false)
  })
})

describe('phdProgramListings', () => {
  it('maps every program to a phd-track listing with a stable id', () => {
    const listings = phdProgramListings()
    expect(listings).toHaveLength(PHD_PROGRAMS.length)
    for (const l of listings) {
      expect(l.track).toBe('phd')
      expect(l.source).toBe('phd-program')
      expect(l.id).toMatch(/^d/)
    }
    // Stable across calls.
    const again = phdProgramListings()
    expect(again.map((l) => l.id)).toEqual(listings.map((l) => l.id))
  })

  it('survives processListings (no keyword gate on the phd track) and is ★-tagged', () => {
    const out = processListings(phdProgramListings(), {}, { targetFirms: TARGET_NAMES_BY_TRACK })
    // All 29 kept (none dropped by keyword/exclude filters), each tagged a target.
    expect(out.filter((l) => l.track === 'phd')).toHaveLength(PHD_PROGRAMS.length)
    expect(out.every((l) => l.target)).toBe(true)
  })

  it('matches institutions against the phd target list (e.g. Caltech, MIT)', () => {
    const caltech = phdProgramListings().find((l) => l.company === 'Caltech')
    expect(isTargetListing(caltech, TARGET_NAMES_BY_TRACK)).toBe(true)
  })
})

describe('discovery track config', () => {
  it('no longer sweeps the fusion track', () => {
    expect(DISCOVERY_TRACKS).not.toContain('fusion')
    expect(DISCOVERY_TRACKS).toEqual(['quant', 'neuro', 'defense'])
  })
})
