// Configuration for the daily discovery sweep.
//
// COMPANY_BOARDS: companies that expose a public ATS job board (Greenhouse,
// Lever, or Ashby). The `token` is the board slug in that ATS. These are
// best-effort and validated by the first scheduled run — the runner logs a
// per-source count, so any wrong/empty token is easy to spot and fix here.
// Listings from these boards bypass the keyword filter (we already trust the
// company), but are still tagged with their track.
//
// KEYWORDS_BY_TRACK: used to filter the broad sources (USAJOBS, Adzuna) and to
// build their search queries.

export const COMPANY_BOARDS = [
  // --- Quant finance (many quant firms use custom ATSs; these are the ones
  // commonly on Greenhouse/Lever — others are covered via the Adzuna sweep) ---
  { company: 'Two Sigma', ats: 'greenhouse', token: 'twosigma', track: 'quant' },
  { company: 'Jump Trading', ats: 'greenhouse', token: 'jumptrading', track: 'quant' },
  { company: 'Hudson River Trading', ats: 'greenhouse', token: 'wearehrt', track: 'quant' },
  { company: 'SIG', ats: 'greenhouse', token: 'susquehannainternationalgroup', track: 'quant' },
  { company: 'Akuna Capital', ats: 'greenhouse', token: 'akunacapital', track: 'quant' },
  { company: 'IMC Trading', ats: 'greenhouse', token: 'imc', track: 'quant' },

  // --- Neurotech / BCI ---
  { company: 'Paradromics', ats: 'greenhouse', token: 'paradromics', track: 'neuro' },
  { company: 'Synchron', ats: 'lever', token: 'synchron', track: 'neuro' },
  { company: 'Kernel', ats: 'greenhouse', token: 'kernel', track: 'neuro' },
  { company: 'Precision Neuroscience', ats: 'greenhouse', token: 'precisionneuroscience', track: 'neuro' },

  // --- Defense / aerospace ---
  { company: 'Anduril', ats: 'greenhouse', token: 'andurilindustries', track: 'defense' },
  { company: 'Shield AI', ats: 'greenhouse', token: 'shieldai', track: 'defense' },

  // --- Fusion ---
  { company: 'Commonwealth Fusion Systems', ats: 'greenhouse', token: 'commonwealthfusionsystems', track: 'fusion' },
  { company: 'TAE Technologies', ats: 'lever', token: 'tae', track: 'fusion' },
  { company: 'Zap Energy', ats: 'lever', token: 'zapenergy', track: 'fusion' },
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
    'rf engineer',
    'sensor fusion',
    'estimation',
    'dsp',
    'electromagnetic',
    'guidance',
  ],
  fusion: ['plasma', 'fusion', 'mhd', 'magnetohydrodynamic', 'diagnostic', 'tokamak', 'magnet'],
}

// Tracks that have meaningful coverage on job boards. PhD programs are not on
// job boards, so the discovery sweep intentionally skips that track (PhD apps
// stay manual).
export const DISCOVERY_TRACKS = ['quant', 'neuro', 'defense', 'fusion']

// Named companies to also feed into the Adzuna keyword sweep so they are
// covered even when they use a custom ATS we can't query directly.
export const ADZUNA_COMPANY_HINTS = {
  quant: ['Citadel', 'Jane Street', 'D.E. Shaw', 'Point72', 'Optiver', 'DRW'],
  neuro: ['Neuralink', 'Blackrock Neurotech', 'Cognixion'],
  defense: ['L3Harris', 'Northrop Grumman', 'Lockheed Martin', 'Raytheon', 'Leidos'],
  fusion: ['Helion', 'Tokamak Energy', 'Type One Energy'],
}
