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
- **Daily job discovery** — a scheduled GitHub Action sweeps job sources and
  feeds a **Discover** inbox in the app (see below).
- **Dark/light theme**, fully responsive, encouraging empty states.
- **JSON backup/import** via the ⋯ menu (data otherwise lives only in your browser).

## Daily job discovery

`.github/workflows/discover.yml` runs once a day (and on demand). It executes
`discovery/run.js`, which sweeps:

- **Company job boards** — public Greenhouse / Lever / Ashby APIs for the
  companies listed in `discovery/sources.js` (edit that file to add your own).
- **USAJOBS** — the official US federal jobs API (great for the Defense track
  and clearance-sponsored roles). Requires `USAJOBS_API_KEY` + `USAJOBS_EMAIL`.
- **Adzuna** — broad keyword search across many boards. Requires
  `ADZUNA_APP_ID` + `ADZUNA_APP_KEY`.

Results are filtered by per-track keywords, de-duplicated, written to
`public/discovered-jobs.json`, committed, and redeployed. The app's **Discover**
tab shows new matches grouped by track with one-click **Add to board** / dismiss.
Already-tracked and dismissed listings are filtered out. Missing API-key secrets
simply skip those sources — company boards work with no keys at all.

PhD programs aren't on job boards, so discovery intentionally skips that track.

### Setting up the API keys (optional but recommended)

1. **USAJOBS**: request a key at <https://developer.usajobs.gov/apirequest/> and
   note the email you registered. Add repo secrets `USAJOBS_API_KEY` and
   `USAJOBS_EMAIL`.
2. **Adzuna**: register at <https://developer.adzuna.com/> for an `app_id` and
   `app_key`. Add repo secrets `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`.

Add secrets under **Settings → Secrets and variables → Actions**.

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
