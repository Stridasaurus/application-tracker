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

// --- Workday (public CXS job-board API). Many defense/aerospace primes
// (Northrop Grumman, RTX/Collins, Boeing) run Workday, which exposes no GET
// board but does answer a POST to /wday/cxs/{tenant}/{site}/jobs with JSON.
// Response: { jobPostings: [{ title, externalPath, locationsText, postedOn }] }.
// We query with a location `searchText` and paginate (limit 20/page); callers
// filter the results down to the target metro. Never throws (callers wrap it).
export async function fetchWorkday({ company, track, host, tenant, site, searchText = '', maxPages = 2 }) {
  const base = `https://${host}/wday/cxs/${tenant}/${site}`
  const origin = `https://${host}`
  const out = []
  for (let page = 0; page < maxPages; page++) {
    const res = await fetch(`${base}/jobs`, {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: page * 20, searchText }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const postings = data.jobPostings ?? []
    for (const j of postings) {
      out.push(
        makeListing({
          title: j.title,
          company,
          track,
          location: j.locationsText ?? '',
          // externalPath is locale-less and starts with "/job/…"
          url: j.externalPath ? `${origin}/${site}${j.externalPath}` : '',
          source: `workday:${tenant}`,
          postedAt: null, // list view only gives relative text ("Posted 3 Days Ago")
        }),
      )
    }
    if (postings.length < 20) break
  }
  return out
}

// --- Phenom People (public career-site search). L3Harris (careers.l3harris.com)
// runs Phenom, which answers a POST to /widgets with ddoKey "refineSearch".
// Response: { refineSearch: { data: { jobs: [{ title, cityStateCountry,
// jobSeoUrl, postedDate, jobId }] } } }. We pass a location `keyword` (Phenom
// search matches location), paginate, and let callers filter to the metro.
// Field names vary by tenant, so the mapper reads several fallbacks. Never throws.
export async function fetchPhenom({ company, track, host, refNum = '', keyword = '', size = 20, maxPages = 2, country = 'us' }) {
  const origin = `https://${host}`
  const out = []
  for (let page = 0; page < maxPages; page++) {
    const res = await fetch(`${origin}/widgets`, {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        lang: 'en',
        deviceType: 'desktop',
        country,
        pageName: 'search-results',
        ddoKey: 'refineSearch',
        stateInfo: { sk: '', pageNumber: page },
        userType: 'external',
        refNum, // site-specific reference; required by most Phenom tenants
        jobs: true,
        counts: false,
        all_fields: [],
        pageId: 'page1',
        siteType: 'external',
        keywords: keyword,
        global: true,
        size,
        from: page * size,
        clearAll: false,
        jdsource: 'facets',
        isSliderEnable: false,
        selected_fields: {},
        locationData: {},
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const jobs = data?.refineSearch?.data?.jobs ?? []
    for (const j of jobs) {
      const seo = j.jobSeoUrl || j.applyUrl || j.jobUrl || ''
      const url = seo.startsWith('http') ? seo : seo ? `${origin}${seo}` : ''
      const location =
        j.cityStateCountry || j.cityState || [j.city, j.state].filter(Boolean).join(', ') || j.location || ''
      let postedAt = null
      const pd = j.postedDate || j.dateCreated || j.postedOn
      if (pd) {
        const d = new Date(/^\d+$/.test(String(pd)) ? Number(pd) : pd)
        if (!isNaN(d.getTime())) postedAt = d.toISOString().slice(0, 10)
      }
      out.push(makeListing({ title: j.title, company, track, location, url, source: `phenom:${host}`, postedAt }))
    }
    if (jobs.length < size) break
  }
  return out
}

const ATS = { greenhouse: fetchGreenhouse, lever: fetchLever, ashby: fetchAshby }

export async function fetchCompanyBoard(board) {
  const fn = ATS[board.ats]
  if (!fn) return []
  return fn(board)
}

// --- USAJOBS (official federal API). Requires API key + registered email. ---
// Docs: https://developer.usajobs.gov/  Headers: Authorization-Key, User-Agent=email
// Pass locationName + radius (miles) to scope to a metro, e.g. Patrick SFB /
// Cape Canaveral / Melbourne FL federal roles.
export async function fetchUsaJobs({ keyword, track, apiKey, email, locationName, radius }) {
  if (!apiKey || !email) return []
  let url =
    `https://data.usajobs.gov/api/search?Keyword=${encodeURIComponent(keyword)}` +
    `&ResultsPerPage=25&SortField=DatePosted&SortDirection=Desc`
  if (locationName) url += `&LocationName=${encodeURIComponent(locationName)}`
  if (radius) url += `&Radius=${radius}`
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
// Pass `where` (town/region/postcode) + `distance` (km radius, max ~80) to run a
// location-targeted sweep — this is how local roles get fetched at all, since a
// nationwide `what` search returns only the newest 25 and buries metro results.
export async function fetchAdzuna({ what, track, appId, appKey, country = 'us', maxDaysOld = 14, where, distance }) {
  if (!appId || !appKey) return []
  let url =
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1` +
    `?app_id=${appId}&app_key=${appKey}` +
    `&what=${encodeURIComponent(what)}&results_per_page=25&max_days_old=${maxDaysOld}` +
    `&content-type=application/json`
  if (where) url += `&where=${encodeURIComponent(where)}`
  if (distance) url += `&distance=${distance}`
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
