import { useMemo, useState } from 'react'
import { TRACK_BY_ID, TRACKS } from '../domain/constants.js'
import { normalizeUrl } from '../../discovery/normalize.js'
import { formatDate } from '../domain/dates.js'
import { Button, Pill, cx } from './ui.jsx'
import { EmptyState } from './Board.jsx'

// The "Discover" inbox: listings found by the daily sweep, grouped by track,
// with one-click add to the board and dismiss. Already-tracked and dismissed
// listings are filtered out so this stays a curated queue, not a firehose.
export default function Discover({ data, status, apps, dismissed, onAdd, onDismiss, onReload }) {
  const existingUrls = useMemo(() => new Set(apps.map((a) => normalizeUrl(a.url)).filter(Boolean)), [apps])
  const existingPairs = useMemo(
    () => new Set(apps.map((a) => `${a.company}|${a.role}`.toLowerCase())),
    [apps],
  )
  const dismissedSet = useMemo(() => new Set(dismissed), [dismissed])

  const visible = useMemo(() => {
    const listings = data?.listings ?? []
    return listings.filter((l) => {
      if (dismissedSet.has(l.id)) return false
      if (l.url && existingUrls.has(normalizeUrl(l.url))) return false
      if (existingPairs.has(`${l.company}|${l.title}`.toLowerCase())) return false
      return true
    })
  }, [data, dismissedSet, existingUrls, existingPairs])

  const byTrack = useMemo(() => {
    const groups = {}
    for (const l of visible) (groups[l.track] ??= []).push(l)
    return groups
  }, [visible])

  const generated = data?.generatedAt ? formatDate(data.generatedAt) : null
  const [openTracks, setOpenTracks] = useState(new Set())

  function toggleTrack(id) {
    setOpenTracks((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Discover</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            New listings from the daily sweep across company boards, USAJOBS, and Adzuna.
            {generated ? ` Last updated ${generated}.` : ' Waiting for the first scheduled run.'}
          </p>
        </div>
        <Button variant="secondary" onClick={onReload}>
          ↻ Refresh
        </Button>
      </div>

      {status === 'loading' && <p className="text-sm text-slate-400">Loading listings…</p>}

      {status !== 'loading' && visible.length === 0 && (
        <EmptyState
          title={data?.generatedAt ? "You're all caught up" : 'No listings yet'}
          body={
            data?.generatedAt
              ? 'Every new match has been added or dismissed. Check back after the next daily run.'
              : 'The daily discovery job has not produced results yet. Once it runs (and any API keys are set), fresh listings will appear here automatically.'
          }
        />
      )}

      <div className="space-y-2">
        {TRACKS.filter((t) => byTrack[t.id]?.length).map((track) => {
          const isOpen = openTracks.has(track.id)
          return (
            <section key={track.id} className="rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => toggleTrack(track.id)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: track.color }} />
                <span className="font-semibold flex-1">{track.label}</span>
                <span className="rounded-full bg-slate-200 px-2 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {byTrack[track.id].length}
                </span>
                <span className={cx('text-slate-400 transition-transform text-xs', isOpen && 'rotate-180')}>▼</span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 px-4 pb-4">
                  {byTrack[track.id].map((l) => (
                    <ListingCard key={l.id} listing={l} onAdd={() => onAdd(l)} onDismiss={() => onDismiss(l.id)} />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function ListingCard({ listing, onAdd, onDismiss }) {
  const track = TRACK_BY_ID[listing.track]
  return (
    <div
      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      style={{ borderLeft: `3px solid ${track?.color ?? '#64748b'}` }}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold leading-tight">{listing.title || 'Untitled role'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {listing.company}
              {listing.location ? ` · ${listing.location}` : ''}
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <Pill className={cx('!bg-slate-100 dark:!bg-slate-700')}>{sourceLabel(listing.source)}</Pill>
          {listing.postedAt && <span className="text-xs text-slate-400">posted {formatDate(listing.postedAt)}</span>}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button onClick={onAdd} className="flex-1">
          + Add to board
        </Button>
        {listing.url && (
          <a
            href={listing.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg px-2 py-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            View ↗
          </a>
        )}
        <Button variant="ghost" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </Button>
      </div>
    </div>
  )
}

function sourceLabel(source = '') {
  if (source.startsWith('greenhouse:') || source.startsWith('lever:') || source.startsWith('ashby:')) {
    return 'company board'
  }
  if (source === 'usajobs') return 'USAJOBS'
  if (source === 'adzuna') return 'Adzuna'
  return source
}
