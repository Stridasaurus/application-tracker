import { Field, inputCls } from './ui.jsx'
import { TRACKS, pipelineForTrack } from '../domain/constants.js'
import SalaryInput from './SalaryInput.jsx'
import TagPicker from './TagPicker.jsx'

// Controlled fields for an application. `draft` is the working object, `onChange`
// receives a partial patch. Used by both quick-add and the detail editor.
export default function ApplicationForm({ draft, onChange, allTags, onCreateTag, compact, hideStage }) {
  const set = (patch) => onChange(patch)
  const stages = pipelineForTrack(draft.track)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={draft.track === 'phd' ? 'Program / University' : 'Company'}>
          <input
            autoFocus
            className={inputCls}
            value={draft.company}
            placeholder={draft.track === 'phd' ? 'Caltech CNS' : 'Jane Street'}
            onChange={(e) => set({ company: e.target.value })}
          />
        </Field>
        <Field label={draft.track === 'phd' ? 'Research area' : 'Role'}>
          <input
            className={inputCls}
            value={draft.role}
            placeholder={draft.track === 'phd' ? 'Computational neuroscience' : 'Quant Researcher'}
            onChange={(e) => set({ role: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Track">
          <select
            className={inputCls}
            value={draft.track}
            onChange={(e) => {
              const track = e.target.value
              const nextStages = pipelineForTrack(track)
              // Keep status valid for the new pipeline.
              const status = nextStages.includes(draft.status) ? draft.status : 'Saved'
              set({ track, status })
            }}
          >
            {TRACKS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        {!hideStage && (
          <Field label="Stage">
            <select className={inputCls} value={draft.status} onChange={(e) => set({ status: e.target.value })}>
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Date applied">
          <input
            type="date"
            className={inputCls}
            value={draft.dateApplied ?? ''}
            onChange={(e) => set({ dateApplied: e.target.value || null })}
          />
        </Field>
        <Field label="Deadline" hint="Surfaced on the dashboard and card badges.">
          <input
            type="date"
            className={inputCls}
            value={draft.deadline ?? ''}
            onChange={(e) => set({ deadline: e.target.value || null })}
          />
        </Field>
      </div>

      {!compact && (
        <>
          <Field label="Posting URL">
            <input
              className={inputCls}
              value={draft.url}
              placeholder="https://…"
              onChange={(e) => set({ url: e.target.value })}
            />
          </Field>

          <SalaryInput value={draft.salary} onChange={(salary) => set({ salary })} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Contact name">
              <input
                className={inputCls}
                value={draft.contact?.name ?? ''}
                placeholder="Recruiter / PI"
                onChange={(e) => set({ contact: { ...draft.contact, name: e.target.value } })}
              />
            </Field>
            <Field label="Contact email">
              <input
                className={inputCls}
                value={draft.contact?.email ?? ''}
                onChange={(e) => set({ contact: { ...draft.contact, email: e.target.value } })}
              />
            </Field>
            <Field label="Contact role">
              <input
                className={inputCls}
                value={draft.contact?.role ?? ''}
                placeholder="Hiring manager"
                onChange={(e) => set({ contact: { ...draft.contact, role: e.target.value } })}
              />
            </Field>
          </div>

          <Field label="Tags">
            <TagPicker
              selected={draft.tags ?? []}
              allTags={allTags}
              onChange={(tags) => set({ tags })}
              onCreateTag={onCreateTag}
            />
          </Field>

          <Field label="Notes">
            <textarea
              className={inputCls}
              rows={3}
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </Field>
        </>
      )}
    </div>
  )
}
