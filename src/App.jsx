import { useMemo, useRef, useState } from 'react'
import { useStore } from './store/useStore.js'
import { useTheme } from './store/useTheme.js'
import { useDiscovered } from './store/useDiscovered.js'
import Discover from './components/Discover.jsx'
import { filterApps } from './domain/filter.js'
import { overdueCount, upcomingDeadlines } from './domain/metrics.js'
import { Button } from './components/ui.jsx'
import Filters from './components/Filters.jsx'
import Board from './components/Board.jsx'
import QuickAdd from './components/QuickAdd.jsx'
import CardDetail from './components/CardDetail.jsx'
import Dashboard from './components/Dashboard.jsx'
import DeadlinesView from './components/DeadlinesView.jsx'

const TABS = [
  { id: 'board', label: 'Board' },
  { id: 'discover', label: 'Discover' },
  { id: 'deadlines', label: 'Deadlines' },
  { id: 'analytics', label: 'Analytics' },
]

export default function App() {
  const store = useStore()
  const { theme, toggle } = useTheme()
  const discovered = useDiscovered()
  const [tab, setTab] = useState('board')
  const [filters, setFilters] = useState({ query: '', tracks: new Set(), tags: new Set(), statuses: new Set() })
  const [quickOpen, setQuickOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const fileRef = useRef(null)

  // `now` is stable per render of App; recomputed on remount/interaction.
  const now = useMemo(() => new Date(), [])
  const filtered = useMemo(() => filterApps(store.apps, filters), [store.apps, filters])
  const overdue = overdueCount(store.apps, now)
  const nextDue = upcomingDeadlines(store.apps, { now, activeOnly: true })[0]

  const open = (id) => setDetailId(id)

  // Count of fresh discovered listings (not yet tracked or dismissed) for a tab badge.
  const discoverCount = useMemo(() => {
    const listings = discovered.data?.listings ?? []
    if (listings.length === 0) return 0
    const urls = new Set(store.apps.map((a) => (a.url || '').replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()).filter(Boolean))
    const dismissed = new Set(store.dismissed)
    return listings.filter((l) => {
      if (dismissed.has(l.id)) return false
      const u = (l.url || '').replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()
      return !(u && urls.has(u))
    }).length
  }, [discovered.data, store.apps, store.dismissed])

  // Add a discovered listing to the board (as a Saved card) and clear it from the inbox.
  const addFromListing = (listing) => {
    store.actions.addApplication({
      company: listing.company,
      role: listing.title,
      track: listing.track,
      status: 'Saved',
      url: listing.url,
      notes: `Discovered via ${listing.source}${listing.location ? ` · ${listing.location}` : ''}`,
    })
    store.actions.dismissListing(listing.id)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ apps: store.apps, tags: store.tags }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tracker-backup-${now.toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMenuOpen(false)
  }

  const importJson = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        store.actions.replaceAll(data)
      } catch {
        alert('Could not parse that file as tracker JSON.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
    setMenuOpen(false)
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 no-print">
        <div className="mx-auto max-w-6xl px-3 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <div>
                <h1 className="text-base font-bold leading-tight sm:text-lg">Application Tracker</h1>
                <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                  Multi-track search · deadlines first
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setQuickOpen(true)} className="whitespace-nowrap">
                + Add
              </Button>
              <div className="relative">
                <Button variant="secondary" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
                  ⋯
                </Button>
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <MenuItem onClick={async () => {
                      setMenuOpen(false)
                      const { exportActivePdf } = await import('./lib/exportPdf.js')
                      exportActivePdf(store.apps, now)
                    }}>
                      📄 Export PDF summary
                    </MenuItem>
                    <MenuItem onClick={exportJson}>⬇ Backup data (JSON)</MenuItem>
                    <MenuItem onClick={() => fileRef.current?.click()}>⬆ Import data (JSON)</MenuItem>
                    <MenuItem onClick={() => { toggle(); setMenuOpen(false) }}>
                      {theme === 'dark' ? '☀ Light theme' : '🌙 Dark theme'}
                    </MenuItem>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJson} />
            </div>
          </div>

          {/* Deadline ticker — always visible, deadlines are first-class. */}
          {nextDue && (
            <button
              onClick={() => { setTab('deadlines') }}
              className="mt-2 flex w-full items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-left text-xs dark:bg-slate-800/60"
            >
              {overdue > 0 ? (
                <span className="font-semibold text-rose-600 dark:text-rose-400">⚠ {overdue} overdue</span>
              ) : (
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">📌 Next due</span>
              )}
              <span className="truncate text-slate-600 dark:text-slate-300">
                {nextDue.app.company} · {nextDue.days < 0 ? `${Math.abs(nextDue.days)}d overdue` : `in ${nextDue.days}d`}
              </span>
            </button>
          )}

          <nav className="mt-3 flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
                  (tab === t.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
                }
              >
                {t.label}
                {t.id === 'deadlines' && overdue > 0 && (
                  <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 text-xs text-white">{overdue}</span>
                )}
                {t.id === 'discover' && discoverCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-emerald-500 px-1.5 text-xs text-white">{discoverCount}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6">
        {tab === 'board' && (
          <>
            <div className="mb-4">
              <Filters filters={filters} setFilters={setFilters} allTags={store.tags} />
            </div>
            <Board
              apps={filtered}
              now={now}
              onOpen={open}
              onMove={store.actions.moveApplication}
              emptyAction={<Button onClick={() => setQuickOpen(true)}>+ Add your first application</Button>}
            />
          </>
        )}

        {tab === 'discover' && (
          <Discover
            data={discovered.data}
            status={discovered.status}
            apps={store.apps}
            dismissed={store.dismissed}
            onAdd={addFromListing}
            onDismiss={store.actions.dismissListing}
            onReload={discovered.reload}
          />
        )}

        {tab === 'deadlines' && (
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-1 text-lg font-semibold">What's due next</h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Quant recruiting peaks Sep–Nov; PhD apps due Dec 1–15. Stay ahead of these.
            </p>
            <DeadlinesView apps={store.apps} now={now} onOpen={open} />
          </div>
        )}

        {tab === 'analytics' && <Dashboard apps={store.apps} now={now} onOpen={open} />}
      </main>

      <QuickAdd
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onAdd={(draft) => store.actions.addApplication(draft)}
        allTags={store.tags}
        onCreateTag={store.actions.addTag}
      />
      {detailId && (
        <CardDetail appId={detailId} apps={store.apps} store={store} now={now} onClose={() => setDetailId(null)} />
      )}

      <footer className="mx-auto max-w-6xl px-3 pb-8 pt-2 text-center text-xs text-slate-400 sm:px-6 no-print">
        Data stays in your browser (localStorage). Back it up via the ⋯ menu.
      </footer>
    </div>
  )
}

function MenuItem({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="block w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  )
}
