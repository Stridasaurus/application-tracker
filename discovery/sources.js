// Configuration for the daily discovery sweep.
//
// COMPANY_BOARDS below are VERIFIED working against the live ATS APIs (each
// returned jobs in a real run). Companies whose public board slug we haven't
// confirmed live in CANDIDATE_BOARDS and are NOT queried — flip one into
// COMPANY_BOARDS once you confirm its slug (open
// https://boards-api.greenhouse.io/v1/boards/<slug>/jobs or
// https://api.lever.co/v0/postings/<slug>?mode=json and check it returns JSON).
//
// Companies on custom ATSs (Citadel, Jane Street, Neuralink, L3Harris, most
// fusion startups…) don't expose a queryable public board — those are best
// covered by the Adzuna keyword sweep (set ADZUNA_APP_ID/ADZUNA_APP_KEY).

export const COMPANY_BOARDS = [
  // --- Quant finance (verified) ---
  { company: 'Jump Trading', ats: 'greenhouse', token: 'jumptrading', track: 'quant' },
  { company: 'Akuna Capital', ats: 'greenhouse', token: 'akunacapital', track: 'quant' },
  { company: 'IMC Trading', ats: 'greenhouse', token: 'imc', track: 'quant' },
  { company: 'Old Mission', ats: 'greenhouse', token: 'oldmissioncapital', track: 'quant' },

  // --- Defense / aerospace (verified) ---
  { company: 'Anduril', ats: 'greenhouse', token: 'andurilindustries', track: 'defense' },
  { company: 'Epirus', ats: 'greenhouse', token: 'epirus', track: 'defense' },
]

// Unverified slugs (returned 404 in testing — the company may use a different
// slug or a custom ATS). Find the correct slug, then move the entry up into
// COMPANY_BOARDS. Until then, Adzuna keyword search is the path for these
// (especially the neuro + fusion tracks, which have no verified board yet).
export const CANDIDATE_BOARDS = [
  // Quant: { company: 'Two Sigma', ats: 'greenhouse', token: '?', track: 'quant' },
  // Neuro: Paradromics, Synchron, Precision Neuroscience, Science Corp, Forest
  //        Neurotech, Motif Neurotech, Kernel, Openwater
  // Defense: Shield AI, Saronic, Applied Intuition, Vannevar Labs, Castelion
  // Fusion: Commonwealth Fusion Systems, TAE, Zap Energy, Helion, Type One,
  //         Realta Fusion, Xcimer
]

// Workday public CXS boards for defense/aerospace primes with a Melbourne /
// Space Coast presence. Workday hides no GET board but answers a POST to
// /wday/cxs/{tenant}/{site}/jobs — this is how we reach primes that the ATS
// fetchers (Greenhouse/Lever/Ashby) and even Adzuna only partially mirror.
// Verify a board with:
//   curl -s -XPOST https://<host>/wday/cxs/<tenant>/<site>/jobs \
//     -H 'content-type: application/json' -d '{"limit":1,"offset":0,"searchText":"Melbourne"}'
// and check it returns JSON with a jobPostings array.
//
// Not added (no usable Workday board): L3Harris, Leonardo DRS, Embraer — these
// stay covered by the Adzuna company hints below (and L3Harris, being HQ'd in
// Melbourne, is mostly local so the geo sweep catches it too).
//
// TODO (needs a live-verified pass): L3Harris runs Phenom People — careers URLs
// carry tenant id 4832 (careers.l3harris.com/en/location/melbourne-jobs/4832/…).
// Phenom exposes a public search via POST https://careers.l3harris.com/widgets
// with body { ddoKey:'refineSearch', location:'Melbourne, FL', size, from, … };
// the response shape is tenant-specific, so confirm it with a sweep run (like
// the Workday boards) before wiring in a fetcher. Leonardo's US sub (DRS) uses
// careers.leonardodrs.com, a separate ATS from the Italian leonardocompany tenant.
//
// VERIFIED live (2026-06-22 sweep): Northrop Grumman returned 40 "Melbourne" +
// 14 "Palm Bay" roles, RTX 24, Boeing 4 — all three tenants/sites are good.
export const WORKDAY_BOARDS = [
  { company: 'Northrop Grumman', track: 'defense', host: 'ngc.wd1.myworkdayjobs.com', tenant: 'ngc', site: 'Northrop_Grumman_External_Site' },
  { company: 'RTX', track: 'defense', host: 'globalhr.wd5.myworkdayjobs.com', tenant: 'globalhr', site: 'REC_RTX_Ext_Gateway' },
  { company: 'Boeing', track: 'defense', host: 'boeing.wd1.myworkdayjobs.com', tenant: 'boeing', site: 'EXTERNAL_CAREERS' },
]

// Phenom People career sites (public /widgets refineSearch API). L3Harris is
// HQ'd in Melbourne and runs Phenom (careers.l3harris.com, tenant 4832), so this
// is the first-party path to its Space Coast roles. Queried with local keywords;
// results are filtered to the metro downstream (keepLocal / boostLocalListings).
export const PHENOM_BOARDS = [
  { company: 'L3Harris', track: 'defense', host: 'careers.l3harris.com' },
]

export const KEYWORDS_BY_TRACK = {
  quant: [
    'quantitative researcher',
    'quant research',
    'quantitative analyst',
    'signal processing',
    'time series',
    'statistical',
    'machine learning',
  ],
  neuro: [
    'brain-computer interface',
    'brain computer interface',
    'neural interface',
    'neural recording',
    'neural decoding',
    'neural signal',
    'bci',
    'electrophysiology',
    'eeg',
    'meg',
    'spike sorting',
    'neuropixels',
    'implantable electrode',
    'cortical implant',
    'neurotech',
  ],
  defense: [
    // Signal / RF / sensing (original focus)
    'signal processing',
    'radar',
    'sensor fusion',
    'estimation',
    'dsp',
    'electromagnetic',
    'microwave',
    'antenna',
    'phased array',
    'electronic warfare',
    'electro-optical',
    'guidance',
    'navigation',
    // Aerospace / space — Melbourne FL & the Space Coast are aerospace-heavy
    // (L3Harris, Northrop, Embraer, Boeing, Collins, Leonardo DRS) and were
    // being missed by the RF-only keyword set above.
    'aerospace',
    'avionics',
    'aircraft',
    'spacecraft',
    'satellite',
    'propulsion',
    'flight test',
    'flight software',
    'aerodynamics',
    'gnc',
    'guidance navigation and control',
    'rf engineer',
    'systems engineer',
    'embedded',
    'fpga',
    'mission systems',
    'payload',
  ],
  fusion: [
    'plasma physics',
    'plasma confinement',
    'plasma diagnostics',
    'plasma heating',
    'nuclear fusion',
    'fusion energy',
    'fusion reactor',
    'fusion power',
    'tokamak',
    'stellarator',
    'magnetohydrodynamic',
    'mhd',
    'inertial confinement',
    'field-reversed configuration',
    'z-pinch',
    'tritium',
    'superconducting magnet',
    'cryostat',
    'divertor',
  ],
}

// Tracks that have meaningful coverage on job boards. PhD programs are not on
// job boards, so the discovery sweep intentionally skips that track.
export const DISCOVERY_TRACKS = ['quant', 'neuro', 'defense', 'fusion']

// Location-targeted sweep config. The user's home metro (Melbourne, FL) is a
// major defense/aerospace hub, but a nationwide keyword search returns only the
// newest 25 hits and buries local roles. These drive a dedicated geo sweep
// (Adzuna `where`/`distance`, USAJOBS `LocationName`/`Radius`) so local jobs are
// actually fetched, then float to the top via boostLocalListings.
export const LOCAL_SWEEP = {
  // Adzuna: where = town/region, distance = km radius (~80km ≈ 50mi covers all
  // of Brevard County + Orlando's eastern edge).
  adzuna: { where: 'Melbourne, Florida', distance: 80 },
  // USAJOBS: LocationName + Radius (miles) — Patrick SFB / Cape Canaveral roles.
  usajobs: { locationName: 'Melbourne, Florida', radius: 75 },
  // Workday: searchText terms (Workday ranks location matches), then results are
  // filtered to the local area downstream via keepLocal / boostLocalListings.
  workdaySearch: ['Melbourne', 'Palm Bay'],
  // Defense/aerospace-specific terms only: these bias Adzuna's local results to
  // on-target roles. (keepLocal still lets a local role through even when its
  // title misses the per-track keywords — so we don't need generic terms like
  // "mechanical engineer" here, which would pull in unrelated local jobs.)
  keywords: [
    'aerospace', 'defense', 'radar', 'avionics', 'signal processing',
    'rf engineer', 'electro-optical', 'guidance navigation', 'flight test',
    'missile', 'spacecraft', 'electronic warfare',
  ],
}

// Job title substrings that disqualify a listing regardless of track. Applied
// to the title only (not description) to avoid over-filtering.
export const EXCLUDE_TITLE_KEYWORDS = [
  // Seniority beyond entry-level / new grad (physics undergrad, May 2027)
  'senior', 'sr.', 'principal', 'staff engineer', 'staff scientist', 'staff researcher',
  'vp ', 'president', 'director', 'manager', 'chief', 'head of',
  // Clinical / medical — not relevant to this physics + BCI profile
  'nurse', 'nursing', 'physician', 'surgeon', 'therapist', 'pharmacist',
  // ERP / enterprise software false positives
  'oracle', 'erp', 'sap',
  // Trades / retail / hospitality — surfaced by the broad local geo sweep but
  // never on-target for this profile. (Substrings chosen to avoid clobbering
  // real titles: 'electrician' ≠ 'electrical engineer'.)
  'hvac', 'plumber', 'electrician', 'landscap', 'janitor', 'custodian',
  'cashier', 'barista', 'dishwasher', 'housekeep', 'caregiver', 'warehouse associate',
]

// Named companies to also feed into the Adzuna keyword sweep so they are
// covered even when they use a custom ATS we can't query directly.
export const ADZUNA_COMPANY_HINTS = {
  quant: ['Citadel', 'Jane Street', 'D.E. Shaw', 'Point72', 'Optiver', 'DRW'],
  neuro: ['Neuralink', 'Synchron', 'Paradromics', 'Blackrock Neurotech', 'Precision Neuroscience'],
  defense: [
    'L3Harris', 'Northrop Grumman', 'Lockheed Martin', 'Raytheon', 'Leidos',
    // Melbourne / Space Coast employers (custom ATSs — reachable via Adzuna):
    'Embraer', 'Leonardo DRS', 'Collins Aerospace', 'BAE Systems', 'GE Aerospace',
    'Boeing', 'General Dynamics', 'Sierra Nevada', 'Rockwell Collins',
  ],
  fusion: ['Commonwealth Fusion', 'Helion', 'TAE Technologies', 'Tokamak Energy', 'Type One Energy'],
}
