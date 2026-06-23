// Pure helpers for the job-discovery pipeline. No network here so they can be
// unit-tested. Fetchers produce raw listings; these normalize/dedupe/filter them.

// Small deterministic string hash -> short base36 id (stable across runs).
export function hashId(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return 'd' + (h >>> 0).toString(36)
}

// Normalize a URL for dedupe: strip protocol, query, fragment, trailing slash.
export function normalizeUrl(url) {
  if (!url) return ''
  return String(url)
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .toLowerCase()
}

// Case-insensitive "does text contain any of these keywords" (substring match,
// which is intentionally permissive for short technical phrases).
export function matchesAnyKeyword(text, keywords) {
  if (!text) return false
  const hay = String(text).toLowerCase()
  return keywords.some((k) => hay.includes(k.toLowerCase()))
}

// Build a normalized listing record with a stable id.
export function makeListing({ title, company, track, location, url, source, postedAt, remote }) {
  const cleanUrl = (url ?? '').trim()
  const id = hashId(normalizeUrl(cleanUrl) || `${company}|${title}`.toLowerCase())
  return {
    id,
    title: (title ?? '').trim(),
    company: (company ?? '').trim(),
    track: track ?? 'other',
    location: (location ?? '').trim(),
    url: cleanUrl,
    source: source ?? 'unknown',
    postedAt: postedAt ?? null,
    remote: !!remote,
  }
}

// Remove duplicates, preferring the first occurrence. Two listings collide if
// they share a normalized URL, or (company + title) when URLs are missing/differ.
export function dedupeListings(listings) {
  const seen = new Set()
  const out = []
  for (const l of listings) {
    const urlKey = normalizeUrl(l.url)
    const ctKey = `${l.company}|${l.title}`.toLowerCase().replace(/\s+/g, ' ').trim()
    const keys = [urlKey && `u:${urlKey}`, ctKey && `c:${ctKey}`].filter(Boolean)
    if (keys.some((k) => seen.has(k))) continue
    keys.forEach((k) => seen.add(k))
    out.push(l)
  }
  return out
}

// Keep only listings whose title (or optional description) matches the track's
// keywords. Listings from a company-specific board can opt out via alwaysKeep.
// With keepLocal, listings in the user's home metro skip the positive-keyword
// gate entirely (a defense/aerospace role in Melbourne FL is almost certainly
// on-target) — they still face the exclude-title filter downstream.
export function filterByKeywords(listings, keywordsByTrack, { alwaysKeepSources = [], keepLocal = false } = {}) {
  return listings.filter((l) => {
    if (keepLocal && isLocalListing(l)) return true
    if (alwaysKeepSources.some((s) => l.source.startsWith(s))) return true
    const kws = keywordsByTrack[l.track]
    if (!kws || kws.length === 0) return true
    return matchesAnyKeyword(`${l.title} ${l.location}`, kws)
  })
}

// Sort newest first; listings without a date sort last.
export function sortByPostedDesc(listings) {
  return [...listings].sort((a, b) => {
    if (!a.postedAt && !b.postedAt) return 0
    if (!a.postedAt) return 1
    if (!b.postedAt) return -1
    return a.postedAt < b.postedAt ? 1 : -1
  })
}

// Keep at most `max` listings per track (assumes input already sorted by
// preference). Prevents a single big company board from flooding a track.
export function capPerTrack(listings, max) {
  if (!max || max <= 0) return listings
  const counts = {}
  const out = []
  for (const l of listings) {
    counts[l.track] = (counts[l.track] ?? 0) + 1
    if (counts[l.track] <= max) out.push(l)
  }
  return out
}

// Keep at most `max` listings per company (assumes input already sorted by
// preference). Stops one employer (e.g. a defense prime with hundreds of
// matching roles) from monopolizing a track so the inbox stays varied.
export function capPerCompany(listings, max) {
  if (!max || max <= 0) return listings
  const counts = {}
  const out = []
  for (const l of listings) {
    const key = (l.company || '').toLowerCase().trim()
    counts[key] = (counts[key] ?? 0) + 1
    if (counts[key] <= max) out.push(l)
  }
  return out
}

// Remove listings whose title matches any exclusion keyword (seniority, clinical, ERP).
export function filterByExcludeKeywords(listings, excludeKeywords) {
  if (!excludeKeywords || excludeKeywords.length === 0) return listings
  return listings.filter((l) => !matchesAnyKeyword(l.title, excludeKeywords))
}

// Space Coast / Brevard County, FL — the user's target metro. Deliberately
// narrower than "anywhere in Florida": a quant role in Miami shouldn't be
// treated as local. Town names are specific enough to avoid false positives.
const LOCAL_PATTERNS = [
  /melbourne/i, /palm bay/i, /brevard/i, /titusville/i, /\bcocoa\b/i,
  /rockledge/i, /viera/i, /satellite beach/i, /indialantic/i,
  /cape canaveral/i, /merritt island/i, /space coast/i,
]

// True when a listing's location is in the user's home metro.
export function isLocalListing(l) {
  return LOCAL_PATTERNS.some((re) => re.test(l.location || ''))
}

// Float listings whose location matches the user's area (Melbourne, FL) to the
// top within each track so they survive the per-track cap.
export function boostLocalListings(listings) {
  return [...listings.filter(isLocalListing), ...listings.filter((l) => !isLocalListing(l))]
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// True when a company name matches one of the curated target names. Short,
// space-free tokens (acronyms like SIG/DRW/HRT/AQR/IMC) match on word boundaries
// so "design" never matches "SIG"; longer names use a permissive substring match
// (so "Citadel Securities" matches "Citadel").
export function matchesTargetFirm(company, names) {
  if (!company || !names || names.length === 0) return false
  const hay = String(company).toLowerCase().trim()
  return names.some((raw) => {
    const n = String(raw).toLowerCase().trim()
    if (!n) return false
    if (n.length <= 4 && /^[a-z0-9]+$/.test(n)) {
      return new RegExp(`\\b${escapeRegExp(n)}\\b`).test(hay)
    }
    return hay.includes(n)
  })
}

// True when a listing's company is one of the user's target firms. Track-scoped
// (targetFirmsByTrack[l.track]) so quant "BlackRock" and neuro "Blackrock
// Neurotech" don't collide.
export function isTargetListing(l, targetFirmsByTrack) {
  return matchesTargetFirm(l.company, targetFirmsByTrack?.[l.track])
}

// Float target-firm listings to the top so they survive the per-track cap and
// surface first in the UI. Runs after boostLocalListings so the final order is
// target → target&local → local → rest.
export function boostTargetListings(listings) {
  return [...listings.filter((l) => l.target), ...listings.filter((l) => !l.target)]
}

// Full pipeline: dedupe -> keyword filter (local roles may bypass via keepLocal)
// -> exclude title filter -> tag target firms -> sort newest-first -> boost local
// -> boost targets -> cap per company -> cap per track. Every output listing
// carries a `target` boolean.
export function processListings(listings, keywordsByTrack, { maxPerTrack = 50, maxPerCompany = 6, excludeTitleKeywords = [], keepLocal = false, targetFirms = {} } = {}) {
  const included = filterByKeywords(dedupeListings(listings), keywordsByTrack, { keepLocal })
  const excluded = filterByExcludeKeywords(included, excludeTitleKeywords)
  const tagged = excluded.map((l) => ({ ...l, target: isTargetListing(l, targetFirms) }))
  const boosted = boostTargetListings(boostLocalListings(sortByPostedDesc(tagged)))
  return capPerTrack(capPerCompany(boosted, maxPerCompany), maxPerTrack)
}
