import { useEffect, useState } from 'react'
import { Modal, Button } from './ui.jsx'
import ApplicationForm from './ApplicationForm.jsx'
import { newApplication } from '../domain/model.js'

// Fast path: company, role, track, stage, deadline — add in under 10 seconds.
// "More details" reveals the full form without leaving the dialog.
export default function QuickAdd({ open, onClose, onAdd, allTags, onCreateTag, defaultTrack }) {
  const [draft, setDraft] = useState(() => newApplication({ track: defaultTrack }))
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(newApplication({ track: defaultTrack }))
      setExpanded(false)
    }
  }, [open, defaultTrack])

  const submit = (e) => {
    e?.preventDefault()
    if (!draft.company.trim()) return
    onAdd(draft)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Quick add application" wide={expanded}>
      <form onSubmit={submit}>
        <ApplicationForm
          draft={draft}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          allTags={allTags}
          onCreateTag={onCreateTag}
          compact={!expanded}
        />
        <div className="mt-4 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? '− Fewer details' : '+ More details'}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!draft.company.trim()}>
              Add application
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
