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
export function updateMyProfile(payload: Partial<{ displayName:string; avatar:string; avatarUrl:string }>) {
  return fetch(`${API}/api/users/me`, { method: 'PUT', headers: headers(), body: JSON.stringify(payload) }).then(handle)
}
export function getByHandle(handle: string) {
  return fetch(`${API}/api/users/by-handle/${encodeURIComponent(handle)}`).then(handle)
}

export function setHandle(payload: { handle: string; displayName?: string }) {
  return fetch(`${API}/api/users/handle`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) }).then(handle)
}

