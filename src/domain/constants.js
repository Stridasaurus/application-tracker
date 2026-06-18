// Track taxonomy. `kind` groups tracks into a pipeline family.
export const TRACKS = [
  { id: 'quant', label: 'Quant Finance', kind: 'job', color: '#6366f1' },
  { id: 'neuro', label: 'Neurotech/BCI', kind: 'job', color: '#ec4899' },
  { id: 'defense', label: 'Defense/Aerospace', kind: 'job', color: '#0ea5e9' },
  { id: 'fusion', label: 'Fusion', kind: 'job', color: '#f59e0b' },
  { id: 'phd', label: 'PhD Program', kind: 'phd', color: '#10b981' },
  { id: 'other', label: 'Other', kind: 'job', color: '#64748b' },
]

export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t]))

// Track-aware pipelines. Jobs and PhD programs have different stage sets.
export const PIPELINES = {
  job: [
    'Saved',
    'Applied',
    'Online Assessment',
    'Phone Screen',
    'Onsite/Final',
    'Offer',
    'Rejected',
  ],
  phd: ['Saved', 'Applied', 'Interview/Visit', 'Accepted', 'Waitlisted', 'Rejected'],
}

// Stages that count as "the application has been submitted".
export const APPLIED_STAGE = 'Applied'

// Stages considered a closed/terminal outcome (not "active").
export const TERMINAL_STAGES = new Set(['Rejected', 'Accepted', 'Offer'])

// Stages that mean the search hasn't started yet for that card.
export const PRE_APPLY_STAGES = new Set(['Saved'])

// Stages that represent a positive response / advancement past Applied.
// Used for response-rate and time-to-response metrics.
export const RESPONDED_STAGES = {
  job: new Set(['Online Assessment', 'Phone Screen', 'Onsite/Final', 'Offer']),
  phd: new Set(['Interview/Visit', 'Accepted', 'Waitlisted']),
}

export function pipelineForTrack(trackId) {
  const track = TRACK_BY_ID[trackId]
  return PIPELINES[track?.kind ?? 'job']
}

export const DEFAULT_TAGS = [
  'referral',
  'reach',
  'dream company',
  'local/Space Coast',
  'needs clearance',
  'research-fit',
]

export const SALARY_PERIODS = ['year', 'month', 'hour', 'total']
