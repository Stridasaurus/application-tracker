# Application Tracker

A static, client-side tracker for a deliberately **multi-track** job & PhD
search — built with React + Vite + Tailwind, persisting everything to the
browser's `localStorage` (no backend, no accounts).

Built around four parallel tracks with **different pipelines** and **deadline-first**
priorities: Quant Finance, Neurotech/BCI, Defense/Aerospace, Fusion, plus PhD
Programs (and an Other catch-all).

## Features

- **Track-aware Kanban** — per-track swimlanes, each with its own correct
  pipeline (jobs: Saved → Applied → Online Assessment → Phone Screen →
  Onsite/Final → Offer → Rejected; PhD: Saved → Applied → Interview/Visit →
  Accepted/Waitlisted/Rejected). Drag cards between columns.
- **Deadlines as a first-class citizen** — badges on cards, a sticky next-due
  ticker, a dedicated "what's due next" tab, and a headline dashboard panel.
  Overdue items are flagged in red everywhere.
- **Quick-add** in under 10 seconds; expandable to full detail inline.
- **Card detail** with a notes timeline that auto-logs stage changes.
- **Filter/search** by track, tag, or free text. Pre-populated tracks + tags
  (referral, reach, dream company, local/Space Coast, needs clearance,
  research-fit), plus custom tags.
- **Flexible, optional comp** — salary range, PhD stipend, or N/A. Never assumed.
- **Analytics dashboard** — by-track balance, job & PhD funnels, applications
  over time, response rate, average time-to-response, and a salary/stipend
  distribution that **excludes** entries with no comp (never zero-filled).
- **One-click PDF** — active applications grouped by track with deadlines clear.
- **Dark/light theme**, fully responsive, encouraging empty states.
- **JSON backup/import** via the ⋯ menu (data otherwise lives only in your browser).

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (date + metric calculations)
npm run build    # production build to dist/
```

## Deploy

Pushing to the dev branch triggers `.github/workflows/deploy.yml`, which runs
tests, builds with the correct Pages base path, and publishes to GitHub Pages.
Live URL (once Pages finishes its first deploy):
`https://stridasaurus.github.io/resume-tracker/`

## Tech

React 18 · Vite · Tailwind CSS · Recharts · jsPDF · Vitest. All calculation
logic lives in `src/domain/` and is unit-tested.
