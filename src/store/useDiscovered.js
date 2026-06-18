import { useCallback, useEffect, useState } from 'react'

// Loads the daily-generated discovered-jobs.json that the GitHub Action writes.
// Served as a static file alongside the app; cache-busted so a fresh deploy
// shows new listings. Fails softly to an empty payload.
export function useDiscovered() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error

  const load = useCallback(() => {
    setStatus('loading')
    const url = `${import.meta.env.BASE_URL}discovered-jobs.json?t=${Date.now()}`
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => {
        setData(d)
        setStatus('ready')
      })
      .catch(() => {
        setData({ generatedAt: null, total: 0, counts: {}, listings: [] })
        setStatus('error')
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, status, reload: load }
}
