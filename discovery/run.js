// Daily discovery runner. Sweeps company ATS boards + USAJOBS + Adzuna, filters
// to the user's keywords, dedupes, and writes public/discovered-jobs.json.
//
// Never hard-fails on a single bad source: each is wrapped, errors are logged,
// and the run still produces a file from whatever succeeded. Designed to be run
// in GitHub Actions (Node 20, global fetch).
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  COMPANY_BOARDS,
  WORKDAY_BOARDS,
  PHENOM_BOARDS,
  KEYWORDS_BY_TRACK,
  DISCOVERY_TRACKS,
  ADZUNA_COMPANY_HINTS,
  EXCLUDE_TITLE_KEYWORDS,
  LOCAL_SWEEP,
} from './sources.js'
import { TARGET_NAMES_BY_TRACK } from './targets.js'
import { fetchCompanyBoard, fetchWorkday, fetchPhenom, fetchUsaJobs, fetchAdzuna } from './fetchers.js'
import { processListings } from './normalize.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/discovered-jobs.json')

const env = process.env
const usajobs = { apiKey: env.USAJOBS_API_KEY, email: env.USAJOBS_EMAIL }
const adzuna = { appId: env.ADZUNA_APP_ID, appKey: env.ADZUNA_APP_KEY }

async function safe(label, fn) {
  try {
    const items = await fn()
    console.log(`  ✓ ${label}: ${items.length}`)
    return items
  } catch (e) {
    console.log(`  ✗ ${label}: ${e.message}`)
    return []
  }
}

async function main() {
  const all = []
  const sourceCounts = {}

  console.log('Company boards:')
  for (const board of COMPANY_BOARDS) {
    const items = await safe(`${board.company} (${board.ats}:${board.token})`, () => fetchCompanyBoard(board))
    sourceCounts[`${board.ats}:${board.token}`] = items.length
    all.push(...items)
  }

  // Workday boards for the defense/aerospace primes (no API key needed). Queried
  // with local searchText so the Melbourne/Space Coast roles surface; keepLocal
  // + boostLocalListings then keep them. Wrapped so a bad slug never fails the run.
  console.log('Workday (local — Melbourne, FL):')
  for (const board of WORKDAY_BOARDS) {
    for (const searchText of LOCAL_SWEEP.workdaySearch) {
      const items = await safe(`${board.company}/"${searchText}"`, () =>
        fetchWorkday({ ...board, searchText }),
      )
      sourceCounts[`workday:${board.tenant}`] = (sourceCounts[`workday:${board.tenant}`] ?? 0) + items.length
      all.push(...items)
    }
  }

  // Phenom career sites (e.g. L3Harris). Empty until a tenant's refNum/endpoint
  // is confirmed (see PHENOM_BOARDS) — the loop no-ops until then.
  if (PHENOM_BOARDS.length) {
    console.log('Phenom (local — Melbourne, FL):')
    for (const board of PHENOM_BOARDS) {
      for (const keyword of LOCAL_SWEEP.workdaySearch) {
        const items = await safe(`${board.company}/"${keyword}"`, () => fetchPhenom({ ...board, keyword }))
        sourceCounts[`phenom:${board.host}`] = (sourceCounts[`phenom:${board.host}`] ?? 0) + items.length
        all.push(...items)
      }
    }
  }

  if (usajobs.apiKey && usajobs.email) {
    console.log('USAJOBS:')
    for (const track of ['defense', 'fusion']) {
      for (const keyword of KEYWORDS_BY_TRACK[track].slice(0, 4)) {
        const items = await safe(`${track}/"${keyword}"`, () =>
          fetchUsaJobs({ keyword, track, ...usajobs }),
        )
        all.push(...items)
      }
    }
    // Local federal roles (Patrick SFB / Cape Canaveral / Melbourne FL).
    console.log('USAJOBS (local — Melbourne, FL):')
    for (const keyword of LOCAL_SWEEP.keywords.slice(0, 6)) {
      const items = await safe(`local/"${keyword}"`, () =>
        fetchUsaJobs({ keyword, track: 'defense', ...usajobs, ...LOCAL_SWEEP.usajobs }),
      )
      all.push(...items)
    }
  } else {
    console.log('USAJOBS: skipped (no USAJOBS_API_KEY / USAJOBS_EMAIL secret)')
  }

  if (adzuna.appId && adzuna.appKey) {
    console.log('Adzuna:')
    for (const track of DISCOVERY_TRACKS) {
      // Top keywords for the track…
      for (const what of KEYWORDS_BY_TRACK[track].slice(0, 3)) {
        const items = await safe(`${track}/"${what}"`, () => fetchAdzuna({ what, track, ...adzuna }))
        all.push(...items)
      }
      // …plus named companies that use custom ATSs we can't query directly.
      for (const company of ADZUNA_COMPANY_HINTS[track] ?? []) {
        const items = await safe(`${track}/company:${company}`, () =>
          fetchAdzuna({ what: company, track, ...adzuna }),
        )
        all.push(...items)
      }
    }

    // Location-targeted sweep: explicitly fetch defense/aerospace roles within
    // the Melbourne, FL radius so local jobs make it into the pool at all (a
    // nationwide search would never surface them). keepLocal in processListings
    // then lets them through the keyword gate, and boostLocalListings floats
    // them to the top so they survive the per-track cap.
    console.log('Adzuna (local — Melbourne, FL):')
    for (const what of LOCAL_SWEEP.keywords) {
      const items = await safe(`local/"${what}"`, () =>
        fetchAdzuna({ what, track: 'defense', ...adzuna, ...LOCAL_SWEEP.adzuna }),
      )
      all.push(...items)
    }
  } else {
    console.log('Adzuna: skipped (no ADZUNA_APP_ID / ADZUNA_APP_KEY secret)')
  }

  // Keyword-filter every source (even company boards), then cap per company and
  // per track so no single employer or track floods the curated inbox. Target
  // firms (targets.js) are tagged + floated to the top of each track.
  const listings = processListings(all, KEYWORDS_BY_TRACK, { maxPerTrack: 50, maxPerCompany: 6, excludeTitleKeywords: EXCLUDE_TITLE_KEYWORDS, keepLocal: true, targetFirms: TARGET_NAMES_BY_TRACK })

  const payload = {
    generatedAt: new Date().toISOString(),
    total: listings.length,
    counts: countByTrack(listings),
    targetCounts: countTargetsByTrack(listings),
    sources: sourceCounts,
    listings,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n')
  console.log(`\nWrote ${listings.length} listings to ${OUT}`)
}

function countByTrack(listings) {
  const c = {}
  for (const l of listings) c[l.track] = (c[l.track] ?? 0) + 1
  return c
}

function countTargetsByTrack(listings) {
  const c = {}
  for (const l of listings) if (l.target) c[l.track] = (c[l.track] ?? 0) + 1
  return c
}

main().catch((e) => {
  console.error('Discovery run failed:', e)
  process.exit(1)
})
