# Job Application Tracker — Plan

A static, client-side web app (React + Tailwind + localStorage) to run a
deliberately **multi-track** job/PhD search. No backend; all data lives in the
browser. Deployable to GitHub Pages so it works on mobile.

## Who this is for (drives every design decision)

Physics undergrad (comp-math minor), FIT, grad May 2027. Core skill: mathematical
modeling of noisy systems (signal processing, inverse problems, time-series).
First-author research on inverse beamforming for MHD wave-source localization.

Running **four parallel tracks** with different pipelines and deadlines:

1. **Quant Finance** — research-leaning quant roles (hedge funds, prop trading).
2. **Neurotech/BCI** — signal-processing/research roles.
3. **Defense/Aerospace** — Space Coast employers; many need clearance sponsorship.
4. **Fusion** — fusion startups; MHD work maps directly.
5. **PhD Program** — comp-neuro PhD applications (own pipeline + deadlines).
6. **Other** — catch-all.

**Deadlines beat salary.** Quant recruiting peaks Sep–Nov 2026; PhD apps due
Dec 1–15 2026. Upcoming/overdue deadlines are a first-class, prominent feature.

## Tech stack

- **Vite + React 18** — fast static build, easy GitHub Pages deploy.
- **Tailwind CSS v3** — utility styling, class-based dark mode.
- **Recharts** — funnel/bar/distribution charts.
- **jsPDF + autotable** — one-click PDF export.
- **Vitest** — unit tests for all calculation logic.
- **localStorage** — persistence (single source of truth, versioned key).

## Data model

```
Application {
  id: string
  company: string          // company OR program name
  role: string             // role / research area
  track: Track             // one of the six tracks
  status: Stage            // track-aware stage
  dateApplied: string|null // ISO date
  deadline: string|null    // ISO date — surfaced everywhere
  url: string
  salary: { type: 'range'|'stipend'|'na', min?, max?, amount?, currency, period }
  notes: string
  contact: { name, email, role }   // recruiter / HM / faculty PI
  tags: string[]
  timeline: [{ id, ts, type, text }]   // notes timeline + auto stage-change logs
  createdAt, updatedAt
}
```

### Track-aware pipelines

- **Jobs** (Quant / Neurotech / Defense / Fusion):
  `Saved → Applied → Online Assessment → Phone Screen → Onsite/Final → Offer → Rejected`
- **PhD Program**:
  `Saved → Applied → Interview/Visit → Accepted → Waitlisted → Rejected`

The board renders **per-track swimlanes**, each with its own correct pipeline
columns. Filtering by track collapses to the relevant lanes.

### Pre-populated taxonomies

- Tracks: the six above.
- Tags: `referral`, `reach`, `dream company`, `local/Space Coast`,
  `needs clearance`, `research-fit` (+ user-defined).

## Features & milestones (commit at each)

1. **Scaffold** — Vite + Tailwind + dark mode + routing/tabs shell.
2. **Domain + persistence + calc utils + tests** — model, localStorage store,
   metrics (response rate, time-to-response, funnel, deadline/overdue) with Vitest.
3. **Kanban board** — track swimlanes, track-aware columns, cards w/ deadline
   badges, drag-to-move (and select fallback), quick-add (<10s), filters/search.
4. **Card detail** — full editable view + notes timeline.
5. **Tags** — pre-populated + custom, filter by tag.
6. **Analytics dashboard** — funnel by status, by track, deadlines view
   (headline), apps over time, response rate / time-to-response, salary dist.
7. **PDF export** — active apps grouped by track, deadlines clear.
8. **Polish** — theme toggle, responsive, encouraging empty states.
9. **Deploy** — GitHub Actions → GitHub Pages on preview branch.

## Calculations (unit-tested)

- `daysUntil(deadline)` / overdue classification.
- Funnel counts by stage (track-aware).
- Counts by track.
- Weekly application histogram.
- Response rate = apps that advanced past Applied / total applied.
- Average time-to-response (first advance after Applied).
- Salary/stipend distribution, **excluding** N/A entries (never zero-filled).

## Decisions made unilaterally (no blocking questions)

- Swimlanes per track (handles divergent pipelines cleanly).
- localStorage only; export/import JSON for backup.
- Drag-and-drop with a select-menu fallback for mobile.
- jsPDF for a real downloadable file rather than print-only.
