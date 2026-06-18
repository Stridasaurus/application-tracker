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

// Full pipeline: dedupe -> keyword filter (every source) -> sort newest-first
// -> cap per track. `maxPerTrack` keeps the Discover inbox curated, not a flood.
export function processListings(listings, keywordsByTrack, { maxPerTrack = 50 } = {}) {
  const filtered = filterByKeywords(dedupeListings(listings), keywordsByTrack)
  return capPerTrack(sortByPostedDesc(filtered), maxPerTrack)
}
