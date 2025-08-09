import type { Post } from '../types/post'
const API = import.meta.env.VITE_API_BASE || ''
const token = () => localStorage.getItem('token')
const headers = () => ({ 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) })

async function handle(res: Response) {
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
  return res.json()
}

export async function listPending(): Promise<Post[]> {
  const r = await fetch(`${API}/api/review/posts?status=pending_review`, {
    credentials: 'include',
    headers: headers(),
  })
  return handle(r)
}

export async function approvePost(id: string): Promise<Post> {
  const r = await fetch(`${API}/api/review/posts/${id}/approve`, {
    method: 'PATCH',
    credentials: 'include',
    headers: headers(),
  })
  return handle(r)
}

export async function rejectPost(id: string, note: string): Promise<Post> {
  const r = await fetch(`${API}/api/review/posts/${id}/reject`, {
    method: 'PATCH',
    credentials: 'include',
    headers: headers(),
    body: JSON.stringify({ note }),
  })
  return handle(r)
}
