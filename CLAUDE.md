# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, client-side job/PhD application tracker (React + Vite + Tailwind) with
**no backend** — all user data lives in the browser's `localStorage`. It is built
around a deliberately **multi-track** search (Quant Finance, Neurotech/BCI,
Defense/Aerospace, Fusion, PhD Program, Other) where each track can have a
different pipeline, and where deadlines are surfaced as a first-class concern.

A separate **daily discovery pipeline** runs in GitHub Actions (not in the app)
to fetch job listings and feed an in-app "Discover" inbox.

## Commands

```bash
npm install        # install deps
npm run dev        # local dev server (Vite)
npm test           # run all unit tests once (Vitest)
npm run test:watch # watch mode
npm run build      # production build to dist/ (set VITE_BASE for Pages base path)
node discovery/run.js   # run the discovery sweep locally (writes public/discovered-jobs.json)
```

Run a single test file or test by name:

```bash
npx vitest run src/domain/metrics.test.js
npx vitest run -t "responseRate"
```

Tests live next to their source as `*.test.js`. Vitest's `include` (in
`vite.config.js`) covers both `src/**` and `discovery/**` — add new test
directories there if needed.

## Architecture

### Domain layer (`src/domain/`) — the source of truth
All business rules and pure calculation logic live here and are unit-tested;
React components should stay thin and defer to these.

- `constants.js` — **the spine of the app.** `TRACKS` (each with a `kind` of
  `'job'` or `'phd'`), `PIPELINES` keyed by kind, and the stage sets
  (`TERMINAL_STAGES`, `RESPONDED_STAGES`, etc.) that drive *every* metric and the
  board columns. `pipelineForTrack(trackId)` is how the rest of the app gets the
  correct stage list for a card. Changing a track's pipeline or adding a track
  starts here.
- `dates.js` — timezone-stable date math operating on local calendar days
  (`daysUntil`, `deadlineStatus`, `startOfWeek`). All deadline/overdue logic
  funnels through here.
- `metrics.js` — funnel, by-track counts, response rate, time-to-response,
  weekly histogram, upcoming/overdue deadlines, and salary distribution.
  Note: salary distribution **excludes** entries with no comp (never zero-fills),
  and job vs PhD metrics diverge via the track's `kind`.
- `model.js` — `newApplication`/`normalizeApplication` factories and `withEvent`
  (appends to a card's `timeline` and bumps `updatedAt`). `normalizeApplication`
  repairs legacy/partial stored data so the UI never crashes on it.
- `filter.js`, `seed.js` — pure filtering, and the first-run sample data.

An **Application** carries: company, role, `track`, `status` (a stage valid for
that track's pipeline), `dateApplied`, `deadline`, `salary` (`{type:'range'|'stipend'|'na', ...}`),
`tags`, `contact`, and a `timeline` of events (stage changes auto-logged).

### State (`src/store/`)
- `useStore.js` — the single app store (a `useState` + persistence effect, not a
  reducer). Holds `apps`, `tags`, and `dismissed` (discovery listing ids). It
  owns all mutations via `actions` (`addApplication`, `moveApplication`,
  `updateApplication`, `addNote`, `dismissListing`, `replaceAll`, `clearAll`).
  Persists to `localStorage` key `appTrackerData.v1`; bump `SCHEMA_VERSION` and
  handle migration in `loadState` if the shape changes. `moveApplication` is the
  canonical way to change a stage because it auto-logs a timeline event and sets
  `dateApplied` on first move off `Saved`.
- `useTheme.js` — class-based dark mode (also pre-applied in `index.html` to
  avoid flash).
- `useDiscovered.js` — fetches the static `discovered-jobs.json` at runtime
  (cache-busted), failing soft to an empty payload.

### UI (`src/components/`)
`App.jsx` is the shell: tabs (Board / Discover / Deadlines / Analytics), the
quick-add modal, the ⋯ menu (PDF export, JSON backup/import, theme, clear), and
the deadline ticker. The board renders **per-track swimlanes**, each using its
own pipeline columns from `pipelineForTrack`. Stage changes happen by dragging
cards or via the detail view; the form's own stage field is hidden in the detail
view (`hideStage`) so only the timeline-logging path is used.

Charts use Recharts; PDF export (`lib/exportPdf.js`, jsPDF) is **lazy-imported**
on click to keep the initial bundle down.

### Discovery pipeline (`discovery/`) — runs in CI, not the app
- `sources.js` — `COMPANY_BOARDS` are **verified-working** ATS slugs only;
  unconfirmed companies sit in `CANDIDATE_BOARDS` (not queried) until a slug is
  confirmed and promoted. `WORKDAY_BOARDS` are verified Workday tenants for the
  defense/aerospace primes (Northrop/RTX/Boeing). Also holds per-track keyword
  lists, Adzuna company hints, and `LOCAL_SWEEP` (the Melbourne, FL geo-targeted
  sweep config). Editing the discovered companies/keywords happens here.
- `fetchers.js` — Greenhouse / Lever / Ashby + Workday public boards + USAJOBS +
  Adzuna. Each fetcher returns normalized listings and **never throws** (logs and
  returns `[]` on error). USAJOBS/Adzuna are skipped unless their API-key env vars
  are set; Adzuna/USAJOBS take optional geo params (`where`/`distance`,
  `LocationName`/`Radius`) for the local sweep. Workday uses a POST to the CXS
  endpoint and needs no key.
- `normalize.js` — pure, unit-tested: `makeListing` (stable id from URL),
  dedupe, keyword filter, `capPerCompany`, `capPerTrack`, `isLocalListing` /
  `boostLocalListings` (Space Coast/Brevard area), and the `processListings`
  pipeline (dedupe → keyword-filter — local roles bypass via `keepLocal` →
  exclude-title filter → sort newest-first → boost local → cap per company → cap
  per track). PhD track is intentionally excluded from discovery.
- `run.js` — orchestrates the sweep and writes `public/discovered-jobs.json`.

### Deploy & discovery automation (`.github/workflows/`)
- `deploy.yml` — on push to the dev branch: test → build (with
  `VITE_BASE=/resume-tracker/`) → deploy to GitHub Pages.
- `discover.yml` — daily cron (and manual): run the sweep, commit the refreshed
  `discovered-jobs.json`, then rebuild + redeploy. **The default `GITHUB_TOKEN`
  cannot trigger other workflows**, so discovery deploys within its own job
  rather than relying on the push from its commit.

API keys for USAJOBS/Adzuna are repo Actions secrets
(`USAJOBS_API_KEY`, `USAJOBS_EMAIL`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`); without
them those sources are skipped and only company boards run.

## Conventions that matter here

- Keep calculation/business logic in `src/domain/` (and `discovery/normalize.js`)
  as pure functions, with co-located `*.test.js`. Components and the store stay thin.
- `localStorage` is the only persistence; there is no server, auth, or database.
  When changing the stored shape, version it and migrate in `useStore.loadState`.
- Track behavior is data-driven from `constants.js` — prefer extending those
  tables over hardcoding stage/track logic in components.
