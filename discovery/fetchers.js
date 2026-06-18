// Network fetchers for each source. Each returns an array of raw listings via
// makeListing(), and never throws — on error it logs and returns []. Node 18+
// global fetch is assumed (the workflow runs Node 20).
import { makeListing } from './normalize.js'

const UA = 'application-tracker-discovery/1.0 (+github actions)'

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// --- Greenhouse: https://boards-api.greenhouse.io/v1/boards/{token}/jobs ---
export async function fetchGreenhouse({ company, token, track }) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=false`
  const data = await getJson(url)
  return (data.jobs ?? []).map((j) =>
    makeListing({
      title: j.title,
      company,
      track,
      location: j.location?.name ?? '',
      url: j.absolute_url,
      source: `greenhouse:${token}`,
      postedAt: (j.updated_at ?? j.first_published ?? '').slice(0, 10) || null,
    }),
  )
}

// --- Lever: https://api.lever.co/v0/postings/{token}?mode=json ---
export async function fetchLever({ company, token, track }) {
  const url = `https://api.lever.co/v0/postings/${token}?mode=json`
  const data = await getJson(url)
  return (Array.isArray(data) ? data : []).map((j) =>
    makeListing({
      title: j.text,
      company,
      track,
      location: j.categories?.location ?? '',
      url: j.hostedUrl ?? j.applyUrl,
      source: `lever:${token}`,
      postedAt: j.createdAt ? new Date(j.createdAt).toISOString().slice(0, 10) : null,
    }),
  )
}

// --- Ashby: https://api.ashbyhq.com/posting-api/job-board/{token} ---
export async function fetchAshby({ company, token, track }) {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${token}`
  const data = await getJson(url)
  return (data.jobs ?? []).map((j) =>
    makeListing({
      title: j.title,
      company,
      track,
      location: j.location ?? j.locationName ?? '',
      url: j.jobUrl ?? j.applyUrl,
      source: `ashby:${token}`,
      postedAt: (j.publishedAt ?? '').slice(0, 10) || null,
      remote: !!j.isRemote,
    }),
  )
}

const ATS = { greenhouse: fetchGreenhouse, lever: fetchLever, ashby: fetchAshby }

export async function fetchCompanyBoard(board) {
  const fn = ATS[board.ats]
  if (!fn) return []
  return fn(board)
}

// --- USAJOBS (official federal API). Requires API key + registered email. ---
// Docs: https://developer.usajobs.gov/  Headers: Authorization-Key, User-Agent=email
export async function fetchUsaJobs({ keyword, track, apiKey, email }) {
  if (!apiKey || !email) return []
  const url =
    `https://data.usajobs.gov/api/search?Keyword=${encodeURIComponent(keyword)}` +
    `&ResultsPerPage=25&SortField=DatePosted&SortDirection=Desc`
  const data = await getJson(url, { 'Authorization-Key': apiKey, 'User-Agent': email, Host: 'data.usajobs.gov' })
  const items = data.SearchResult?.SearchResultItems ?? []
  return items.map((it) => {
    const d = it.MatchedObjectDescriptor ?? {}
    return makeListing({
      title: d.PositionTitle,
      company: d.OrganizationName,
      track,
      location: d.PositionLocationDisplay ?? '',
      url: d.PositionURI,
      source: 'usajobs',
      postedAt: (d.PublicationStartDate ?? '').slice(0, 10) || null,
    })
  })
}

// --- Adzuna (free tier). Requires app_id + app_key. ---
// Docs: https://developer.adzuna.com/
export async function fetchAdzuna({ what, track, appId, appKey, country = 'us', maxDaysOld = 14 }) {
  if (!appId || !appKey) return []
  const url =
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1` +
    `?app_id=${appId}&app_key=${appKey}` +
    `&what=${encodeURIComponent(what)}&results_per_page=25&max_days_old=${maxDaysOld}` +
    `&content-type=application/json`
  const data = await getJson(url)
  return (data.results ?? []).map((j) =>
    makeListing({
      title: j.title,
      company: j.company?.display_name ?? '',
      track,
      location: j.location?.display_name ?? '',
      url: j.redirect_url,
      source: 'adzuna',
      postedAt: (j.created ?? '').slice(0, 10) || null,
    }),
  )
}
