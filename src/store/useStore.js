import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_TAGS } from '../domain/constants.js'
import { normalizeApplication, newApplication, withEvent, nowISO } from '../domain/model.js'
import { seedApplications } from '../domain/seed.js'
import { initTokenClient, requestToken, revokeToken, getUserEmail, readFromDrive, writeToDrive } from '../lib/driveSync.js'

const STORAGE_KEY = 'appTrackerData.v1'
const DRIVE_USER_KEY = 'appTrackerDriveUser'
const SCHEMA_VERSION = 1
const DRIVE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: SCHEMA_VERSION, apps: seedApplications(), tags: [...DEFAULT_TAGS], dismissed: [], seeded: true }
    }
    const parsed = JSON.parse(raw)
    return {
      version: SCHEMA_VERSION,
      apps: (parsed.apps ?? []).map(normalizeApplication),
      tags: dedupeTags(parsed.tags ?? DEFAULT_TAGS),
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed : [],
      seeded: parsed.seeded ?? false,
    }
  } catch (e) {
    console.error('Failed to load tracker data, starting fresh', e)
    return { version: SCHEMA_VERSION, apps: [], tags: [...DEFAULT_TAGS], dismissed: [], seeded: false }
  }
}

function dedupeTags(tags) {
  const merged = [...DEFAULT_TAGS, ...tags]
  return [...new Set(merged.map((t) => t.trim()).filter(Boolean))]
}

function applyRemoteData(data) {
  return {
    version: SCHEMA_VERSION,
    apps: (data.apps ?? []).map(normalizeApplication),
    tags: dedupeTags(data.tags ?? DEFAULT_TAGS),
    dismissed: Array.isArray(data.dismissed) ? data.dismissed : [],
    seeded: true,
  }
}

export function useStore() {
  const [state, setState] = useState(loadState)
  // hydrated gates Drive write-back — stays false until Drive load completes (or
  // we confirm there's no Drive connection) to prevent seed/stale data clobbering
  // real remote data before it's been read.
  const [hydrated, setHydrated] = useState(false)
  const [driveStatus, setDriveStatus] = useState('disconnected')
  const [driveUser, setDriveUser] = useState(() => localStorage.getItem(DRIVE_USER_KEY))
  const driveWriteTimer = useRef(null)

  // On mount: initialize GIS and auto-reconnect if previously connected.
  useEffect(() => {
    if (!DRIVE_CLIENT_ID) { setHydrated(true); return }

    const tryInit = () => {
      if (!window.google?.accounts?.oauth2) { setHydrated(true); return }
      initTokenClient(DRIVE_CLIENT_ID)

      const prevUser = localStorage.getItem(DRIVE_USER_KEY)
      if (!prevUser) { setHydrated(true); return }

      setDriveStatus('connecting')
      requestToken('') // silent: works if user already granted consent
        .then(async () => {
          const data = await readFromDrive()
          if (data) setState(applyRemoteData(data))
          setHydrated(true)
          setDriveStatus('synced')
        })
        .catch(() => {
          // Silent auth failed (session expired, revoked) — fall back to localStorage
          setDriveStatus('disconnected')
          setHydrated(true)
        })
    }

    if (window.google?.accounts?.oauth2) {
      tryInit()
    } else {
      // Poll until GIS script loads (max 1 s)
      let waited = 0
      const t = setInterval(() => {
        waited += 100
        if (window.google?.accounts?.oauth2) { clearInterval(t); tryInit() }
        else if (waited >= 1000) { clearInterval(t); setHydrated(true) }
      }, 100)
      return () => clearInterval(t)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage always. Write to Drive only after hydration so
  // seed/stale local data cannot clobber the remote file before it's read.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Failed to persist tracker data', e)
    }
    if (!hydrated || driveStatus !== 'synced') return
    clearTimeout(driveWriteTimer.current)
    driveWriteTimer.current = setTimeout(() => {
      writeToDrive(state).catch((e) => {
        console.error('Drive write failed', e)
        if (e.status === 401) setDriveStatus('error')
      })
    }, 1500)
  }, [state, hydrated, driveStatus])

  const connectDrive = useCallback(async () => {
    if (!DRIVE_CLIENT_ID) return
    if (!window.google?.accounts?.oauth2) { alert('Google sign-in is still loading, try again in a moment.'); return }
    initTokenClient(DRIVE_CLIENT_ID)
    setDriveStatus('connecting')
    try {
      await requestToken('consent')
      const [data, email] = await Promise.all([readFromDrive(), getUserEmail()])
      if (data) setState(applyRemoteData(data))
      setHydrated(true)
      setDriveStatus('synced')
      const label = email ?? 'Google Drive'
      localStorage.setItem(DRIVE_USER_KEY, label)
      setDriveUser(label)
    } catch (e) {
      console.error('Drive connect failed', e)
      setDriveStatus(hydrated ? 'disconnected' : 'error')
      if (!hydrated) setHydrated(true)
    }
  }, [hydrated])

  const disconnectDrive = useCallback(() => {
    revokeToken()
    localStorage.removeItem(DRIVE_USER_KEY)
    setDriveUser(null)
    setDriveStatus('disconnected')
  }, [])

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

  const moveApplication = useCallback((id, toStatus) => {
    setState((s) => ({
      ...s,
      apps: s.apps.map((a) => {
        if (a.id !== id || a.status === toStatus) return a
        const patch = { status: toStatus }
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

  const dismissListing = useCallback((listingId) => {
    setState((s) => ({ ...s, dismissed: [...new Set([...s.dismissed, listingId])] }))
  }, [])

  const replaceAll = useCallback((data) => {
    setState({
      version: SCHEMA_VERSION,
      apps: (data.apps ?? []).map(normalizeApplication),
      tags: dedupeTags(data.tags ?? DEFAULT_TAGS),
      dismissed: Array.isArray(data.dismissed) ? data.dismissed : [],
      seeded: true,
    })
  }, [])

  const clearAll = useCallback(() => {
    setState({ version: SCHEMA_VERSION, apps: [], tags: [...DEFAULT_TAGS], dismissed: [], seeded: true })
  }, [])

  const actions = useMemo(
    () => ({
      addApplication,
      updateApplication,
      moveApplication,
      deleteApplication,
      addNote,
      addTag,
      dismissListing,
      replaceAll,
      clearAll,
      connectDrive,
      disconnectDrive,
    }),
    [addApplication, updateApplication, moveApplication, deleteApplication, addNote, addTag, dismissListing, replaceAll, clearAll, connectDrive, disconnectDrive],
  )

  return {
    apps: state.apps,
    tags: state.tags,
    dismissed: state.dismissed,
    driveStatus,
    driveUser,
    actions,
  }
}
