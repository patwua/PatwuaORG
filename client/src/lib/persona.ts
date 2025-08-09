import type { Persona } from '../types/persona'
const API = import.meta.env.VITE_API_BASE || ''
const token = () => localStorage.getItem('token')

async function handle(res: Response) {
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
  return res.json()
}

export async function listPersonas(): Promise<Persona[]> {
  const r = await fetch(`${API}/api/personas`, {
    headers: { Authorization: token() ? `Bearer ${token()}` : '' },
    credentials: 'include'
  })
  return handle(r)
}

// Admin ops (used later in a Manage page)
export async function createPersona(p: Partial<Persona>): Promise<Persona> {
  const r = await fetch(`${API}/api/personas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    credentials: 'include',
    body: JSON.stringify(p),
  })
  return handle(r)
}
export async function updatePersona(id: string, p: Partial<Persona>): Promise<Persona> {
  const r = await fetch(`${API}/api/personas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    credentials: 'include',
    body: JSON.stringify(p),
  })
  return handle(r)
}
export async function deletePersona(id: string): Promise<{ ok: true }> {
  const r = await fetch(`${API}/api/personas/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token()}` },
    credentials: 'include',
  })
  return handle(r)
}
