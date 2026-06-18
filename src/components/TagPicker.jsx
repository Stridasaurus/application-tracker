import { useState } from 'react'
import { Pill, inputCls, cx } from './ui.jsx'

// Toggle existing tags on/off and create new ones inline.
export default function TagPicker({ selected, allTags, onChange, onCreateTag }) {
  const [input, setInput] = useState('')
  const toggle = (tag) =>
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])

  const create = () => {
    const t = input.trim()
    if (!t) return
    onCreateTag?.(t)
    if (!selected.includes(t)) onChange([...selected, t])
    setInput('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {allTags.map((tag) => (
          <Pill key={tag} active={selected.includes(tag)} onClick={() => toggle(tag)}>
            {tag}
          </Pill>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className={cx(inputCls, 'flex-1')}
          placeholder="Add a custom tag…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              create()
            }
          }}
        />
        <button
          type="button"
          onClick={create}
          className="rounded-lg bg-slate-200 px-3 text-sm font-medium hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          Add
        </button>
      </div>
    </div>
  )
}
