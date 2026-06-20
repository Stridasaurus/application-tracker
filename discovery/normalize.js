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
export function filterByKeywords(listings, keywordsByTrack, { alwaysKeepSources = [] } = {}) {
  return listings.filter((l) => {
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

const LOCAL_PATTERNS = [/melbourne/i, /\bfl\b/i, /florida/i, /brevard/i, /palm bay/i, /cocoa beach/i]

// Float listings whose location matches the user's area (Melbourne, FL) to the
// top within each track so they survive the per-track cap.
export function boostLocalListings(listings) {
  const isLocal = (l) => LOCAL_PATTERNS.some((re) => re.test(l.location))
  return [...listings.filter(isLocal), ...listings.filter((l) => !isLocal(l))]
}

// Full pipeline: dedupe -> keyword filter (every source) -> sort newest-first
// -> boost local -> cap per company -> cap per track. The caps keep the Discover
// inbox a curated, varied queue rather than a flood from one source.
export function processListings(listings, keywordsByTrack, { maxPerTrack = 50, maxPerCompany = 6 } = {}) {
  const filtered = filterByKeywords(dedupeListings(listings), keywordsByTrack)
  const boosted = boostLocalListings(sortByPostedDesc(filtered))
  return capPerTrack(capPerCompany(boosted, maxPerCompany), maxPerTrack)
}
