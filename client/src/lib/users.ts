const API = import.meta.env.VITE_API_BASE || ''
const token = () => localStorage.getItem('authToken')
const headers = () => ({ 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) })

async function handle(res: Response) {
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
  return res.json()
}

export function getMyProfile() {
  return fetch(`${API}/api/users/me`, { headers: headers() }).then(handle).then(r => r.user)
}
export function updateMyProfile(payload: Partial<{ displayName:string; avatar:string; avatarUrl:string; bio:string; location:string; links:any[] }>) {
  return fetch(`${API}/api/users/me`, { method: 'PUT', headers: headers(), body: JSON.stringify(payload) }).then(handle)
}
export function getByHandle(handle: string) {
  return fetch(`${API}/api/users/by-handle/${encodeURIComponent(handle)}`).then(handle)
}
export function getCounts(handle: string) {
  return fetch(`${API}/api/users/by-handle/${encodeURIComponent(handle)}/counts`).then(handle)
}
export function getCommentsByHandle(handle: string, page=1, limit=20) {
  const params = new URLSearchParams({ authorHandle: handle, page: String(page), limit: String(limit) })
  return fetch(`${API}/api/comments?${params.toString()}`).then(handle)
}
export function getMediaByHandle(handle: string, page=1, limit=30) {
  return fetch(`${API}/api/users/by-handle/${encodeURIComponent(handle)}/media?page=${page}&limit=${limit}`).then(handle)
}

export function setHandle(payload: { handle: string; displayName?: string }) {
  return fetch(`${API}/api/users/handle`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) }).then(handle)
}

