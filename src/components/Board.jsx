import { useState } from 'react'
import { TRACKS, TRACK_BY_ID, pipelineForTrack } from '../domain/constants.js'
import Card from './Card.jsx'
import { cx } from './ui.jsx'

// Per-track swimlanes, each rendering its own correct pipeline columns.
// Drag a card between columns (HTML5 DnD); a select fallback lives in detail view.
export default function Board({ apps, onOpen, onMove, now, emptyAction }) {
  // Which tracks to show: any track that has at least one card.
  const tracksWithCards = TRACKS.filter((t) => apps.some((a) => a.track === t.id))

  if (apps.length === 0) {
    return (
      <EmptyState
        title="No applications match — let's change that"
        body="Add your first application, or loosen the filters above."
        action={emptyAction}
      />
    )
  }

  return (
    <div className="space-y-6">
      {tracksWithCards.map((track) => (
        <Swimlane
          key={track.id}
          track={track}
          apps={apps.filter((a) => a.track === track.id)}
          onOpen={onOpen}
          onMove={onMove}
          now={now}
        />
      ))}
    </div>
  )
}

function Swimlane({ track, apps, onOpen, onMove, now }) {
  const stages = pipelineForTrack(track.id)
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  const byStage = (stage) => apps.filter((a) => a.status === stage)

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: track.color }} />
        <h2 className="font-semibold">{track.label}</h2>
        <span className="rounded-full bg-slate-200 px-2 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {apps.length}
        </span>
      </div>

      <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
        {stages.map((stage) => {
          const cards = byStage(stage)
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                if (dragId) {
                  e.preventDefault()
                  setOverStage(stage)
                }
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={() => {
                if (dragId) onMove(dragId, stage)
                setDragId(null)
                setOverStage(null)
              }}
              className={cx(
                'flex w-60 flex-shrink-0 flex-col rounded-xl bg-slate-200/60 p-2 dark:bg-slate-800/40',
                overStage === stage && dragId && 'ring-2 ring-indigo-500',
              )}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {stage}
                </span>
                <span className="text-xs text-slate-400">{cards.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {cards.map((app) => (
                  <Card
                    key={app.id}
                    app={app}
                    now={now}
                    draggable
                    onDragStart={() => setDragId(app.id)}
                    onClick={() => onOpen(app.id)}
                  />
                ))}
                {cards.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 px-2 py-4 text-center text-xs text-slate-400 dark:border-slate-700">
                    —
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
      <div className="mb-2 text-4xl">🎯</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
