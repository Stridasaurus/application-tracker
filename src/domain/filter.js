// Pure filtering of applications against the active filter state.
export function filterApps(apps, filters) {
  const q = (filters.query ?? '').trim().toLowerCase()
  const tracks = filters.tracks ?? null // Set or null = all
  const statuses = filters.statuses ?? null
  const tags = filters.tags ?? null

  return apps.filter((app) => {
    if (tracks && tracks.size && !tracks.has(app.track)) return false
    if (statuses && statuses.size && !statuses.has(app.status)) return false
    if (tags && tags.size && !app.tags.some((t) => tags.has(t))) return false
    if (q) {
      const hay = [app.company, app.role, app.notes, app.contact?.name, ...(app.tags ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
