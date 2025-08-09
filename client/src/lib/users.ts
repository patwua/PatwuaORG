const API = import.meta.env.VITE_API_BASE || ''
const token = () => localStorage.getItem('token')
const headers = () => ({ 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) })

async function handle(res: Response) {
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
  return res.json()
}

export function getMyProfile() {
  return fetch(`${API}/api/users/me/profile`, { credentials: 'include', headers: headers() }).then(handle)
}
export function updateMyProfile(payload: Partial<{ name:string; avatar:string; bio:string; location:string; categories:string[]; slug:string }>) {
  return fetch(`${API}/api/users/me/profile`, { method: 'PATCH', credentials: 'include', headers: headers(), body: JSON.stringify(payload) }).then(handle)
}
export function getPublicProfile(slug: string) {
  return fetch(`${API}/api/users/${encodeURIComponent(slug)}`, { credentials: 'include' }).then(handle)
}
export function getUserPersonas(slug: string) {
  return fetch(`${API}/api/users/${encodeURIComponent(slug)}/personas`, { credentials: 'include' }).then(handle)
}

