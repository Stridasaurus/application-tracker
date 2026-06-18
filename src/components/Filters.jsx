import { TRACKS } from '../domain/constants.js'
import { Pill, inputCls, cx } from './ui.jsx'

// Compact, mobile-friendly filter bar: search + track chips + tag chips.
export default function Filters({ filters, setFilters, allTags }) {
  const toggleSet = (key, value) => {
    setFilters((f) => {
      const next = new Set(f[key] ?? [])
      next.has(value) ? next.delete(value) : next.add(value)
      return { ...f, [key]: next }
    })
  }

  const tracks = filters.tracks ?? new Set()
  const tags = filters.tags ?? new Set()
  const active = (filters.query?.length ?? 0) > 0 || tracks.size > 0 || tags.size > 0

  return (
    <div className="space-y-2">
      <input
        className={cx(inputCls)}
        placeholder="Search company, role, notes, contact…"
        value={filters.query ?? ''}
        onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {TRACKS.map((t) => (
          <Pill key={t.id} color={t.color} active={tracks.has(t.id)} onClick={() => toggleSet('tracks', t.id)}>
            {t.label}
          </Pill>
        ))}
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400">Tags:</span>
          {allTags.map((tag) => (
            <Pill key={tag} active={tags.has(tag)} onClick={() => toggleSet('tags', tag)}>
              {tag}
            </Pill>
          ))}
        </div>
      )}
      {active && (
        <button
          onClick={() => setFilters({ query: '', tracks: new Set(), tags: new Set(), statuses: new Set() })}
          className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
