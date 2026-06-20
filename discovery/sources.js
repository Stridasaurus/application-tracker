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
    'signal processing',
    'neural',
    'neuroscience',
    'brain computer interface',
    'brain-computer',
    'bci',
    'electrophysiology',
    'eeg',
    'meg',
    'decoding',
  ],
  defense: [
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

// Named companies to also feed into the Adzuna keyword sweep so they are
// covered even when they use a custom ATS we can't query directly.
export const ADZUNA_COMPANY_HINTS = {
  quant: ['Citadel', 'Jane Street', 'D.E. Shaw', 'Point72', 'Optiver', 'DRW'],
  neuro: ['Neuralink', 'Synchron', 'Paradromics', 'Blackrock Neurotech', 'Precision Neuroscience'],
  defense: ['L3Harris', 'Northrop Grumman', 'Lockheed Martin', 'Raytheon', 'Leidos'],
  fusion: ['Commonwealth Fusion', 'Helion', 'TAE Technologies', 'Tokamak Energy', 'Type One Energy'],
}
