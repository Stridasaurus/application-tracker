import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_TAGS } from '../domain/constants.js'
import { normalizeApplication, newApplication, withEvent, nowISO } from '../domain/model.js'
import { seedApplications } from '../domain/seed.js'

const STORAGE_KEY = 'appTrackerData.v1'
const SCHEMA_VERSION = 1

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: SCHEMA_VERSION, apps: seedApplications(), tags: [...DEFAULT_TAGS], seeded: true }
    }
    const parsed = JSON.parse(raw)
    return {
      version: SCHEMA_VERSION,
      apps: (parsed.apps ?? []).map(normalizeApplication),
      tags: dedupeTags(parsed.tags ?? DEFAULT_TAGS),
      seeded: parsed.seeded ?? false,
    }
  } catch (e) {
    console.error('Failed to load tracker data, starting fresh', e)
    return { version: SCHEMA_VERSION, apps: [], tags: [...DEFAULT_TAGS], seeded: false }
  }
}

function dedupeTags(tags) {
  const merged = [...DEFAULT_TAGS, ...tags]
  return [...new Set(merged.map((t) => t.trim()).filter(Boolean))]
}

export function useStore() {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Failed to persist tracker data', e)
    }
  }, [state])

  const addApplication = useCallback((partial) => {
    const app = newApplication(partial)
    setState((s) => ({ ...s, apps: [app, ...s.apps] }))
    return app.id
  }, [])

  const updateApplication = useCallback((id, patch, event) => {
    setState((s) => ({
      ...s,
      apps: s.apps.map((a) => {
        if (a.id !== id) return a
        let next = { ...a, ...patch, updatedAt: nowISO() }
        if (event) next = withEvent(next, event)
        return next
      }),
    }))
  }, [])

  // Move a card to a new stage, logging a stage event automatically.
  const moveApplication = useCallback((id, toStatus) => {
    setState((s) => ({
      ...s,
      apps: s.apps.map((a) => {
        if (a.id !== id || a.status === toStatus) return a
        const patch = { status: toStatus }
        // First time moving off Saved sets the applied date if missing.
        if (a.status === 'Saved' && toStatus !== 'Saved' && !a.dateApplied) {
          patch.dateApplied = nowISO().slice(0, 10)
        }
        return withEvent(
          { ...a, ...patch },
          { type: 'stage', from: a.status, to: toStatus, text: `Moved to ${toStatus}` },
        )
      }),
    }))
  }, [])

  const deleteApplication = useCallback((id) => {
    setState((s) => ({ ...s, apps: s.apps.filter((a) => a.id !== id) }))
  }, [])

  const addNote = useCallback((id, text) => {
    if (!text.trim()) return
    setState((s) => ({
      ...s,
      apps: s.apps.map((a) => (a.id === id ? withEvent(a, { type: 'note', text: text.trim() }) : a)),
    }))
  }, [])

  const addTag = useCallback((tag) => {
    const t = tag.trim()
    if (!t) return
    setState((s) => ({ ...s, tags: [...new Set([...s.tags, t])] }))
  }, [])

  const replaceAll = useCallback((data) => {
    setState({
      version: SCHEMA_VERSION,
      apps: (data.apps ?? []).map(normalizeApplication),
      tags: dedupeTags(data.tags ?? DEFAULT_TAGS),
      seeded: true,
    })
  }, [])

  const clearAll = useCallback(() => {
    setState({ version: SCHEMA_VERSION, apps: [], tags: [...DEFAULT_TAGS], seeded: true })
  }, [])

  const actions = useMemo(
    () => ({
      addApplication,
      updateApplication,
      moveApplication,
      deleteApplication,
      addNote,
      addTag,
      replaceAll,
      clearAll,
    }),
    [addApplication, updateApplication, moveApplication, deleteApplication, addNote, addTag, replaceAll, clearAll],
  )

  return { apps: state.apps, tags: state.tags, actions }
}
