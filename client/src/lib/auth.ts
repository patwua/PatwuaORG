import type { User } from '../types/auth'
const API = import.meta.env.VITE_API_BASE || ''

async function handle(res: Response) {
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
  return res.json()
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const r = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  })
  return handle(r)
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const r = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password })
  })
  return handle(r)
}

export function saveToken(token: string) {
  localStorage.setItem('token', token)
}
export function getToken(): string | null {
  return localStorage.getItem('token')
}
export function clearToken() {
  localStorage.removeItem('token')
}

