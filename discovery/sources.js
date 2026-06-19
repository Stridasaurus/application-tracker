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

// NOTE: ATS slugs are best-effort and verified by the live run (the runner logs
// a per-source count). Entries that return 0 are harmless; prune or correct
// them here as you learn the right tokens. Companies on custom ATSs (Citadel,
// Jane Street, Neuralink, L3Harris…) are covered via the Adzuna keyword sweep.
export const COMPANY_BOARDS = [
  // --- Quant finance ---
  { company: 'Two Sigma', ats: 'greenhouse', token: 'twosigma', track: 'quant' },
  { company: 'Jump Trading', ats: 'greenhouse', token: 'jumptrading', track: 'quant' },
  { company: 'Hudson River Trading', ats: 'greenhouse', token: 'wearehrt', track: 'quant' },
  { company: 'SIG', ats: 'greenhouse', token: 'susquehannainternationalgroup', track: 'quant' },
  { company: 'Akuna Capital', ats: 'greenhouse', token: 'akunacapital', track: 'quant' },
  { company: 'IMC Trading', ats: 'greenhouse', token: 'imc', track: 'quant' },
  { company: 'Five Rings', ats: 'greenhouse', token: 'fiverings', track: 'quant' },
  { company: 'Old Mission', ats: 'greenhouse', token: 'oldmissioncapital', track: 'quant' },
  { company: 'Wolverine Trading', ats: 'greenhouse', token: 'wolverinetrading', track: 'quant' },

  // --- Neurotech / BCI ---
  { company: 'Paradromics', ats: 'greenhouse', token: 'paradromics', track: 'neuro' },
  { company: 'Synchron', ats: 'lever', token: 'synchron', track: 'neuro' },
  { company: 'Kernel', ats: 'greenhouse', token: 'kernel', track: 'neuro' },
  { company: 'Precision Neuroscience', ats: 'greenhouse', token: 'precisionneuroscience', track: 'neuro' },
  { company: 'Science Corp', ats: 'greenhouse', token: 'sciencecorp', track: 'neuro' },
  { company: 'Forest Neurotech', ats: 'ashby', token: 'forestneurotech', track: 'neuro' },
  { company: 'Motif Neurotech', ats: 'ashby', token: 'motifneurotech', track: 'neuro' },
  { company: 'Openwater', ats: 'greenhouse', token: 'openwater', track: 'neuro' },

  // --- Defense / aerospace ---
  { company: 'Anduril', ats: 'greenhouse', token: 'andurilindustries', track: 'defense' },
  { company: 'Shield AI', ats: 'greenhouse', token: 'shieldai', track: 'defense' },
  { company: 'Epirus', ats: 'greenhouse', token: 'epirus', track: 'defense' },
  { company: 'Saronic', ats: 'greenhouse', token: 'saronic', track: 'defense' },
  { company: 'Applied Intuition', ats: 'greenhouse', token: 'appliedintuition', track: 'defense' },
  { company: 'Vannevar Labs', ats: 'lever', token: 'vannevarlabs', track: 'defense' },
  { company: 'Castelion', ats: 'greenhouse', token: 'castelion', track: 'defense' },

  // --- Fusion ---
  { company: 'Commonwealth Fusion Systems', ats: 'greenhouse', token: 'commonwealthfusionsystems', track: 'fusion' },
  { company: 'TAE Technologies', ats: 'lever', token: 'tae', track: 'fusion' },
  { company: 'Zap Energy', ats: 'lever', token: 'zapenergy', track: 'fusion' },
  { company: 'Helion Energy', ats: 'greenhouse', token: 'helionenergy', track: 'fusion' },
  { company: 'Type One Energy', ats: 'greenhouse', token: 'typeoneenergy', track: 'fusion' },
  { company: 'Realta Fusion', ats: 'greenhouse', token: 'realtafusion', track: 'fusion' },
  { company: 'Xcimer Energy', ats: 'greenhouse', token: 'xcimerenergy', track: 'fusion' },
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
