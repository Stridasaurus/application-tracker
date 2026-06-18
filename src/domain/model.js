import { TRACK_BY_ID, pipelineForTrack } from './constants.js'

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function nowISO() {
  return new Date().toISOString()
}

// Build a fresh application with sensible defaults for the given track.
export function newApplication(partial = {}) {
  const track = partial.track && TRACK_BY_ID[partial.track] ? partial.track : 'quant'
  const status = partial.status ?? 'Saved'
  const ts = nowISO()
  return {
    id: uid(),
    company: '',
    role: '',
    track,
    status,
    dateApplied: status !== 'Saved' ? isoDateOnly(ts) : null,
    deadline: null,
    url: '',
    salary: { type: 'na', currency: 'USD', period: 'year' },
    notes: '',
    contact: { name: '', email: '', role: '' },
    tags: [],
    timeline: [{ id: uid(), ts, type: 'created', text: 'Application created' }],
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  }
}

function isoDateOnly(iso) {
  return iso.slice(0, 10)
}

// Coerce/repair a stored app so the UI never crashes on legacy/partial data.
export function normalizeApplication(a) {
  const track = TRACK_BY_ID[a.track] ? a.track : 'other'
  const pipe = pipelineForTrack(track)
  const status = pipe.includes(a.status) ? a.status : 'Saved'
  return {
    ...newApplication({ track }),
    ...a,
    track,
    status,
    salary: a.salary ?? { type: 'na', currency: 'USD', period: 'year' },
    contact: a.contact ?? { name: '', email: '', role: '' },
    tags: Array.isArray(a.tags) ? a.tags : [],
    timeline: Array.isArray(a.timeline) ? a.timeline : [],
  }
}

// Append a timeline event and bump updatedAt (returns a new app object).
export function withEvent(app, event) {
  const ts = nowISO()
  return {
    ...app,
    updatedAt: ts,
    timeline: [...(app.timeline ?? []), { id: uid(), ts, ...event }],
  }
}
