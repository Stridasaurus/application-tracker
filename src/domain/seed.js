import { newApplication, uid } from './model.js'

// Realistic starter data so the board/analytics aren't empty on first run.
// Dates are anchored around mid-2026 to match the user's recruiting timeline.
function ev(type, text, ts, extra = {}) {
  return { id: uid(), ts, type, text, ...extra }
}

export function seedApplications() {
  const make = (p) => newApplication(p)
  return [
    make({
      company: 'Jane Street',
      role: 'Quant Research (Intern)',
      track: 'quant',
      status: 'Online Assessment',
      dateApplied: '2026-06-02',
      deadline: '2026-06-25',
      url: 'https://janestreet.com/join-jane-street/',
      salary: { type: 'range', min: 12000, max: 16000, currency: 'USD', period: 'month' },
      tags: ['dream company', 'reach'],
      contact: { name: '', email: '', role: 'Recruiting' },
      notes: 'OA invite received — timed probability/markets test.',
      timeline: [
        ev('created', 'Application created', '2026-06-02T12:00:00Z'),
        ev('stage', 'Moved to Applied', '2026-06-02T12:00:00Z', { from: 'Saved', to: 'Applied' }),
        ev('stage', 'Moved to Online Assessment', '2026-06-09T15:00:00Z', {
          from: 'Applied',
          to: 'Online Assessment',
        }),
      ],
    }),
    make({
      company: 'Two Sigma',
      role: 'Quantitative Researcher',
      track: 'quant',
      status: 'Applied',
      dateApplied: '2026-06-10',
      deadline: '2026-09-15',
      salary: { type: 'na', currency: 'USD', period: 'year' },
      tags: ['research-fit'],
      notes: 'Research over trading — emphasize time-series / inverse problems.',
      timeline: [
        ev('created', 'Application created', '2026-06-10T12:00:00Z'),
        ev('stage', 'Moved to Applied', '2026-06-10T12:00:00Z', { from: 'Saved', to: 'Applied' }),
      ],
    }),
    make({
      company: 'Neuralink',
      role: 'Signal Processing Researcher',
      track: 'neuro',
      status: 'Phone Screen',
      dateApplied: '2026-05-28',
      deadline: '2026-07-01',
      url: 'https://neuralink.com/careers/',
      salary: { type: 'range', min: 120000, max: 160000, currency: 'USD', period: 'year' },
      tags: ['research-fit', 'dream company'],
      contact: { name: 'A. Recruiter', email: 'talent@neuralink.com', role: 'Recruiter' },
      notes: 'Inverse beamforming on magnetometer data = direct differentiator for BCI decoding.',
      timeline: [
        ev('created', 'Application created', '2026-05-28T12:00:00Z'),
        ev('stage', 'Moved to Applied', '2026-05-28T12:00:00Z', { from: 'Saved', to: 'Applied' }),
        ev('stage', 'Moved to Phone Screen', '2026-06-09T18:00:00Z', {
          from: 'Applied',
          to: 'Phone Screen',
        }),
        ev('note', 'Recruiter call scheduled for next week.', '2026-06-12T18:00:00Z'),
      ],
    }),
    make({
      company: 'Synchron',
      role: 'Neural Data Scientist',
      track: 'neuro',
      status: 'Saved',
      deadline: '2026-08-01',
      tags: ['research-fit'],
      notes: 'Endovascular BCI — less invasive, strong signal-processing need.',
    }),
    make({
      company: 'L3Harris',
      role: 'RF / Signal Processing Engineer',
      track: 'defense',
      status: 'Applied',
      dateApplied: '2026-06-05',
      deadline: '2026-07-15',
      salary: { type: 'range', min: 80000, max: 110000, currency: 'USD', period: 'year' },
      tags: ['local/Space Coast', 'needs clearance'],
      contact: { name: '', email: '', role: 'Hiring Manager' },
      notes: 'Melbourne HQ — 20 min away. US citizen, clearance-eligible.',
      timeline: [
        ev('created', 'Application created', '2026-06-05T12:00:00Z'),
        ev('stage', 'Moved to Applied', '2026-06-05T12:00:00Z', { from: 'Saved', to: 'Applied' }),
      ],
    }),
    make({
      company: 'Commonwealth Fusion Systems',
      role: 'Plasma Diagnostics / MHD Modeling',
      track: 'fusion',
      status: 'Saved',
      deadline: '2026-08-15',
      url: 'https://cfs.energy/careers/',
      tags: ['reach', 'research-fit'],
      notes: 'MHD wave-source work maps directly to tokamak diagnostics.',
    }),
    make({
      company: 'Caltech CNS',
      role: 'Computation & Neural Systems PhD',
      track: 'phd',
      status: 'Saved',
      deadline: '2026-12-01',
      url: 'https://www.cns.caltech.edu/',
      salary: { type: 'stipend', amount: 45000, currency: 'USD', period: 'year' },
      tags: ['reach', 'dream company'],
      contact: { name: 'Prof. TBD', email: '', role: 'Faculty PI' },
      notes: 'Email 2–3 PIs before applying. Hard deadline Dec 1.',
    }),
    make({
      company: 'Princeton PNI',
      role: 'Neuroscience PhD',
      track: 'phd',
      status: 'Saved',
      deadline: '2026-12-01',
      salary: { type: 'stipend', amount: 47000, currency: 'USD', period: 'year' },
      tags: ['reach'],
      notes: 'Strong computational track. Deadline Dec 1.',
    }),
    make({
      company: 'UCL Gatsby',
      role: 'Theoretical Neuroscience PhD',
      track: 'phd',
      status: 'Saved',
      deadline: '2026-12-12',
      salary: { type: 'stipend', amount: 22000, currency: 'GBP', period: 'year' },
      tags: ['reach', 'dream company'],
      notes: 'Theory-heavy; great fit for inverse-problems background.',
    }),
    make({
      company: 'Citadel',
      role: 'Quant Research Analyst',
      track: 'quant',
      status: 'Rejected',
      dateApplied: '2026-05-20',
      tags: [],
      notes: 'Rejected post-OA. Revisit fall cycle.',
      timeline: [
        ev('created', 'Application created', '2026-05-20T12:00:00Z'),
        ev('stage', 'Moved to Applied', '2026-05-20T12:00:00Z', { from: 'Saved', to: 'Applied' }),
        ev('stage', 'Moved to Online Assessment', '2026-05-27T12:00:00Z', {
          from: 'Applied',
          to: 'Online Assessment',
        }),
        ev('stage', 'Moved to Rejected', '2026-06-03T12:00:00Z', {
          from: 'Online Assessment',
          to: 'Rejected',
        }),
      ],
    }),
  ]
}
