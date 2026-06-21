// Google Drive sync — stores a single JSON file in the user's Drive using the
// GIS token client (no backend required). File is visible in Drive so it
// doubles as a manual backup if sync ever breaks.
const SCOPE = 'https://www.googleapis.com/auth/drive.file email'
const FILE_NAME = 'appTrackerData.json'
const DRIVE = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

let tokenClient = null
let accessToken = null
let cachedFileId = null

export function initTokenClient(clientId) {
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: () => {},
  })
}

// prompt: '' = silent if user already consented; 'consent' = always show picker
export function requestToken(prompt = '') {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('GIS not initialized'))
    tokenClient.callback = (resp) => {
      if (resp.error) return reject(new Error(resp.error))
      accessToken = resp.access_token
      resolve()
    }
    tokenClient.requestAccessToken({ prompt })
  })
}

export function revokeToken() {
  if (accessToken) window.google?.accounts?.oauth2?.revoke(accessToken)
  accessToken = null
  cachedFileId = null
}

export async function getUserEmail() {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`)
    return (await res.json()).email ?? null
  } catch {
    return null
  }
}

function authHeader() {
  return { Authorization: `Bearer ${accessToken}` }
}

async function findFileId() {
  if (cachedFileId) return cachedFileId
  const url = `${DRIVE}/files?q=${encodeURIComponent(`name='${FILE_NAME}' and trashed=false`)}&spaces=drive&fields=files(id)`
  const res = await fetch(url, { headers: authHeader() })
  if (!res.ok) throw Object.assign(new Error(`Drive list: ${res.status}`), { status: res.status })
  const data = await res.json()
  cachedFileId = data.files?.[0]?.id ?? null
  return cachedFileId
}

export async function readFromDrive() {
  const id = await findFileId()
  if (!id) return null
  const res = await fetch(`${DRIVE}/files/${id}?alt=media`, { headers: authHeader() })
  if (!res.ok) throw Object.assign(new Error(`Drive read: ${res.status}`), { status: res.status })
  return res.json()
}

export async function writeToDrive(data) {
  const body = JSON.stringify(data)
  const id = await findFileId()
  if (id) {
    const res = await fetch(`${UPLOAD}/files/${id}?uploadType=media`, {
      method: 'PATCH',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body,
    })
    if (!res.ok) throw Object.assign(new Error(`Drive write: ${res.status}`), { status: res.status })
  } else {
    const boundary = 'apptracker_boundary'
    const meta = JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' })
    const multipart =
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n` +
      `--${boundary}--`
    const res = await fetch(`${UPLOAD}/files?uploadType=multipart`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': `multipart/related; boundary="${boundary}"` },
      body: multipart,
    })
    if (!res.ok) throw Object.assign(new Error(`Drive create: ${res.status}`), { status: res.status })
    cachedFileId = (await res.json()).id
  }
}
