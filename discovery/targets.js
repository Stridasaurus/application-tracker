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
// The PhD track (List 3) IS covered now: discovery/phd-programs.js seeds the
// curated programs and fetchEuraxess surfaces live academic positions, so the
// `phd` group below ★-tags both the seeded programs and matching live listings
// by institution name.
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
    { name: 'Flow Traders' },
    { name: 'Maven Securities', aliases: ['Maven'] },
    { name: 'Wintermute' },
    { name: 'Man Group', aliases: ['Man AHL'] },
    { name: 'Winton' },
    { name: 'Capula', aliases: ['Capula Investment'] },
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
    { name: 'Cerca Magnetics', aliases: ['Cerca'] },
    { name: 'CorTec' },
    { name: 'ABILITY Neurotech', aliases: ['ABILITY'] },
    { name: 'Wyss Center', aliases: ['Wyss'] },
    { name: 'ONWARD Medical', aliases: ['ONWARD'] },
    { name: 'InBrain Neuroelectronics', aliases: ['InBrain'] },
    { name: 'TU Graz', aliases: ['Graz'] },
  ],
  // Defense / aerospace — mirrors the researched Defense tab. Beyond the local
  // primes, this leans into the user's actual edge: research labs (MIT Lincoln,
  // JHU APL, the national labs) and the space-weather / geomagnetism agencies
  // (NOAA SWPC, NASA heliophysics, USGS) that are a direct content match to their
  // magnetometer work. The off-list primes (Leidos, Embraer, GE Aerospace,
  // General Dynamics, Sierra Nevada, Rockwell Collins) were dropped per the list;
  // Epirus stays a verified COMPANY_BOARD source but is intentionally not ★-tagged.
  defense: [
    // Defense electronics — Melbourne / Space Coast primes
    { name: 'L3Harris' },
    { name: 'Northrop Grumman', aliases: ['Northrop'] },
    { name: 'Lockheed Martin', aliases: ['Lockheed'] },
    { name: 'Raytheon' },
    { name: 'RTX' },
    { name: 'Leonardo DRS' },
    { name: 'Collins Aerospace' },
    { name: 'BAE Systems', aliases: ['BAE'] },
    { name: 'Boeing' },
    { name: 'Anduril' },
    // FFRDC / research labs — research-fit (radar, sensors, applied physics)
    { name: 'MIT Lincoln Laboratory', aliases: ['Lincoln Laboratory', 'Lincoln Lab'] },
    { name: 'Johns Hopkins APL', aliases: ['Johns Hopkins Applied Physics', 'JHU APL', 'APL'] },
    { name: 'Sandia National Laboratories', aliases: ['Sandia'] },
    { name: 'Los Alamos National Laboratory', aliases: ['Los Alamos', 'LANL'] },
    { name: 'Lawrence Livermore National Laboratory', aliases: ['Lawrence Livermore', 'LLNL'] },
    // Geospatial / remote sensing
    { name: 'Maxar' },
    // Space weather / heliophysics / geomagnetism — DIRECT content match
    { name: 'NOAA' },
    { name: 'NASA' },
    { name: 'USGS' },
    // Space & launch (local + prestigious; weaker skills fit per the readme)
    { name: 'SpaceX' },
    { name: 'Blue Origin' },
    { name: 'United Launch Alliance', aliases: ['ULA'] },
    { name: 'Relativity', aliases: ['Relativity Space'] },
    { name: 'Terran Orbital' },
    { name: 'Vaya Space' },
  ],
  // List 3 — PhD programs (neuroscience / comp-neuro). Institution names, so both
  // the seeded programs (discovery/phd-programs.js) and matching live EURAXESS
  // listings get ★-tagged. Mix of US + European (the user's researched fit list).
  phd: [
    { name: 'Caltech' },
    { name: 'Princeton' },
    { name: 'UCL', aliases: ['University College London', 'Gatsby'] },
    { name: 'UC Berkeley', aliases: ['Berkeley', 'Redwood'] },
    { name: 'Columbia' },
    { name: 'MIT' },
    { name: 'Stanford' },
    { name: 'Harvard' },
    { name: 'NYU' },
    { name: 'Carnegie Mellon', aliases: ['CMU', 'CNBC'] },
    { name: 'UCSD', aliases: ['UC San Diego'] },
    { name: 'Johns Hopkins' },
    { name: 'Brown', aliases: ['Carney', 'BrainGate'] },
    { name: 'University of Washington', aliases: ['UW'] },
    { name: 'Georgia Tech', aliases: ['Emory'] },
    { name: 'University of Michigan', aliases: ['Michigan'] },
    { name: 'University of Pennsylvania', aliases: ['UPenn', 'Penn'] },
    { name: 'Boston University', aliases: ['BU'] },
    { name: 'Northwestern' },
    { name: 'Cold Spring Harbor', aliases: ['CSHL', 'Watson School'] },
    { name: 'ETH Zurich', aliases: ['ETH', 'INI', 'Neuroinformatics'] },
    { name: 'EPFL', aliases: ['Neuro-X'] },
    { name: 'IST Austria', aliases: ['ISTA', 'Institute of Science and Technology Austria'] },
    { name: 'Max Planck', aliases: ['IMPRS', 'Tübingen'] },
    { name: 'Champalimaud' },
    { name: 'SISSA' },
    { name: 'Donders', aliases: ['Radboud'] },
    { name: 'Hebrew University', aliases: ['ELSC', 'Safra'] },
    { name: 'University of Edinburgh', aliases: ['Edinburgh'] },
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
