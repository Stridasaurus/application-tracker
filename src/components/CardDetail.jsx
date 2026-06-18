import { useEffect, useState } from 'react'
import { Modal, Button, inputCls, Pill, cx } from './ui.jsx'
import ApplicationForm from './ApplicationForm.jsx'
import DeadlineBadge from './DeadlineBadge.jsx'
import { TRACK_BY_ID, pipelineForTrack } from '../domain/constants.js'
import { formatDate } from '../domain/dates.js'

const EVENT_ICON = { created: '✨', stage: '➜', note: '📝', edit: '✏️' }

export default function CardDetail({ appId, apps, store, onClose, now }) {
  const app = apps.find((a) => a.id === appId)
  const [draft, setDraft] = useState(app)
  const [note, setNote] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setDraft(app)
    setConfirmDelete(false)
  }, [appId, app])

  if (!app) return null
  const track = TRACK_BY_ID[app.track]
  const stages = pipelineForTrack(app.track)

  // Persist edits on field change (debounced via React batching is fine here).
  const update = (patch) => {
    setDraft((d) => ({ ...d, ...patch }))
    store.actions.updateApplication(app.id, patch)
  }

  const changeStage = (toStatus) => {
    if (toStatus === app.status) return
    store.actions.moveApplication(app.id, toStatus)
  }

  const submitNote = (e) => {
    e.preventDefault()
    store.actions.addNote(app.id, note)
    setNote('')
  }

  const timeline = [...(app.timeline ?? [])].sort((a, b) => (a.ts < b.ts ? 1 : -1))

  return (
    <Modal open={!!appId} onClose={onClose} wide title={app.company || 'Application'}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* Left: editable details */}
        <div className="md:col-span-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Pill color={track?.color}>{track?.label}</Pill>
            <select
              className={cx(inputCls, 'w-auto py-1 text-xs font-medium')}
              value={app.status}
              onChange={(e) => changeStage(e.target.value)}
            >
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {app.deadline && <DeadlineBadge deadline={app.deadline} now={now} showDate />}
          </div>

          <ApplicationForm
            draft={draft}
            onChange={update}
            allTags={store.tags}
            onCreateTag={store.actions.addTag}
          />

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
            {confirmDelete ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Delete permanently?</span>
                <Button
                  variant="danger"
                  onClick={() => {
                    store.actions.deleteApplication(app.id)
                    onClose()
                  }}
                >
                  Delete
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="text-rose-600">
                Delete application
              </Button>
            )}
            {app.url && (
              <a
                href={app.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Open posting ↗
              </a>
            )}
          </div>
        </div>

        {/* Right: notes timeline */}
        <div className="md:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Timeline</h3>
          <form onSubmit={submitNote} className="mb-3 flex gap-2">
            <input
              className={cx(inputCls, 'flex-1')}
              placeholder="Log an update…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button type="submit" disabled={!note.trim()}>
              Add
            </Button>
          </form>
          <ol className="relative max-h-96 space-y-3 overflow-y-auto pr-1">
            {timeline.map((e) => (
              <li key={e.id} className="flex gap-2 text-sm">
                <span aria-hidden className="mt-0.5">
                  {EVENT_ICON[e.type] ?? '•'}
                </span>
                <div>
                  <div className="text-slate-700 dark:text-slate-200">{e.text}</div>
                  <div className="text-xs text-slate-400">{formatDate(e.ts)}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  )
}
