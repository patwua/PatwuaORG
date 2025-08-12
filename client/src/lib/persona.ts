import type { Persona } from '../types/persona'

const API = import.meta.env.VITE_API_BASE || ''

const token = () => localStorage.getItem('authToken') || ''

async function handle(res: Response) {
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
  return res.json()
}

export async function listPersonas(): Promise<Persona[]> {
  const r = await fetch(`${API}/api/personas?owner=me`, {
    headers: {
      Authorization: token() ? `Bearer ${token()}` : '',
    },
  })
  // server returns a raw array
  return handle(r)
}

export async function createPersona(p: Partial<Persona>): Promise<Persona> {
  const r = await fetch(`${API}/api/personas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify(p),
  })
  return handle(r)
}

export async function updatePersona(id: string, p: Partial<Persona>): Promise<Persona> {
  const r = await fetch(`${API}/api/personas/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify(p),
  })
  return handle(r)
}

export async function deletePersona(id: string): Promise<{ ok: true }> {
  const r = await fetch(`${API}/api/personas/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  })
  return handle(r)
}

