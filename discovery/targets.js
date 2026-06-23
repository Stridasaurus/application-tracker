// Curated "target firms" — the user's researched fit list (from target-lists.md).
// This is the source of truth that lets the discovery pipeline distinguish *fit*
// from *volume*: a target match gets floated to the top of the Discover inbox and
// badged with a ★, while non-target aggregator noise stays visible but de-emphasized.
//
// Matching (see discovery/normalize.js: matchesTargetFirm) is TRACK-SCOPED, so the
// quant asset manager "BlackRock" and the neuro firm "Blackrock Neurotech" don't
// collide. Each entry is { name, aliases? }; aliases cover the display-name variants
// aggregators actually return (e.g. "Citadel Securities" → Citadel, "SIG" →
// Susquehanna). Short space-free aliases (SIG, DRW, HRT…) are matched on word
// boundaries downstream so "design" never matches "SIG".
//
// List 3 (PhD programs) is intentionally absent — those aren't on job boards and the
// discovery sweep skips the phd track.
export const TARGET_FIRMS = {
  // List 1 — Quantitative finance
  quant: [
    { name: 'Jane Street' },
    { name: 'Citadel' }, // also matches "Citadel Securities"
    { name: 'Two Sigma' },
    { name: 'D.E. Shaw', aliases: ['D. E. Shaw', 'DE Shaw'] },
    { name: 'Hudson River Trading', aliases: ['HRT'] },
    { name: 'Jump Trading' },
    { name: 'Renaissance Technologies', aliases: ['RenTech'] },
    { name: 'Optiver' },
    { name: 'IMC Trading', aliases: ['IMC'] },
    { name: 'Susquehanna', aliases: ['SIG'] },
    { name: 'DRW' },
    { name: 'Five Rings' },
    { name: 'Akuna Capital', aliases: ['Akuna'] },
    { name: 'Old Mission' },
    { name: 'AQR' },
    { name: 'PDT Partners' },
    { name: 'Point72', aliases: ['Cubist'] },
    { name: 'Millennium Management', aliases: ['Millennium'] },
    { name: 'Squarepoint' },
    { name: 'WorldQuant' },
    { name: 'Voleon' },
    { name: 'Marshall Wace' },
    { name: 'XTX Markets', aliases: ['XTX'] },
    { name: 'G-Research', aliases: ['GResearch'] },
    { name: 'Tower Research' },
    { name: 'Quadrature' },
    { name: 'Qube Research', aliases: ['Qube'] },
    { name: 'Aspect Capital' },
    { name: 'BlackRock' },
    { name: 'PIMCO' },
    { name: 'Bridgewater' },
  ],
  // List 2 — Neurotech / BCI / neural data
  neuro: [
    { name: 'Neuralink' },
    { name: 'Synchron' },
    { name: 'Paradromics' },
    { name: 'Precision Neuroscience' },
    { name: 'Blackrock Neurotech' },
    { name: 'Science Corp', aliases: ['Science Corporation'] },
    { name: 'Motif Neurotech' },
    { name: 'Forest Neurotech' },
    { name: 'MEGIN' },
    { name: 'FieldLine' },
    { name: 'CTF MEG' },
    { name: 'g.tec' },
    { name: 'Brain Products' },
    { name: 'Ant Neuro' },
    { name: 'OpenBCI' },
    { name: 'Ceribell' },
    { name: 'Rune Labs' },
    { name: 'Cumulus Neuroscience' },
    { name: 'Epitel' },
    { name: 'Emotiv' },
    { name: 'Numenta' },
    { name: 'DeepMind' },
  ],
  // Defense / aerospace primes already curated in the pipeline — flagged so the ★
  // is consistent across tracks (the user's Melbourne-area focus).
  defense: [
    { name: 'L3Harris' },
    { name: 'Northrop Grumman', aliases: ['Northrop'] },
    { name: 'Lockheed Martin', aliases: ['Lockheed'] },
    { name: 'Raytheon' },
    { name: 'RTX' },
    { name: 'Leidos' },
    { name: 'Embraer' },
    { name: 'Leonardo DRS' },
    { name: 'Collins Aerospace' },
    { name: 'BAE Systems', aliases: ['BAE'] },
    { name: 'GE Aerospace' },
    { name: 'Boeing' },
    { name: 'General Dynamics' },
    { name: 'Sierra Nevada' },
    { name: 'Rockwell Collins' },
    { name: 'Anduril' },
    { name: 'Epirus' },
  ],
}

// Flattened { track: [matchString, ...] } for the matcher in normalize.js.
export const TARGET_NAMES_BY_TRACK = Object.fromEntries(
  Object.entries(TARGET_FIRMS).map(([track, firms]) => [
    track,
    firms.flatMap((f) => [f.name, ...(f.aliases ?? [])]),
  ]),
)

// Canonical firm display names per track (no aliases) — used to derive Adzuna hints.
export const TARGET_FIRM_NAMES = Object.fromEntries(
  Object.entries(TARGET_FIRMS).map(([track, firms]) => [track, firms.map((f) => f.name)]),
)
