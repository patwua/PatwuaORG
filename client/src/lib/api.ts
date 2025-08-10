import axios from 'axios'
import type { Post } from '../types/post'

const API = import.meta.env.VITE_API_BASE || ''

export const api = axios.create({
  baseURL: `${API}/api`,
  withCredentials: true,
})

const token = () => localStorage.getItem('token')
const headers = () => ({ 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) })

// Normalize server payloads into our Post shape
export function normalizePost(p: any): Post {
  return {
    id: p._id ?? p.id ?? crypto.randomUUID(),
    title: p.title ?? 'Untitled',
    excerpt: p.excerpt ?? p.summary ?? (p.body ? String(p.body).slice(0, 140) : ''),
    coverUrl: p.coverUrl ?? p.image ?? undefined,
    tags: Array.isArray(p.tags) ? p.tags : [],
    path: p.path,
    slug: p.slug,
    type: p.type,
    author:
      p.author ?? {
        name: p.authorName ?? p.author?.name ?? 'Unknown',
        verified: !!(p.author?.verified ?? p.authorVerified),
      },
    stats: {
      comments: Number(p.stats?.comments ?? p.commentCount ?? p.comments ?? 0),
      votes: Number(p.stats?.votes ?? p.votes ?? p.score ?? 0),
    },
    // prefer createdAt, fall back to timestamp/updatedAt
    createdAt: p.createdAt ?? p.timestamp ?? p.updatedAt ?? new Date().toISOString(),
  }
}

async function handle(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${API}/api/posts?status=published`, { credentials: 'include' })
  const data = await handle(res)
  const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
  return list.map((p: any) =>
    normalizePost({
      tags: [],
      stats: { comments: 0, votes: 0 },
      author: { name: 'Unknown', verified: false },
      ...p,
    })
  )
}

export async function getPost(id: string): Promise<Post> {
  const r = await fetch(`${API}/api/posts/${id}`, { credentials: 'include' })
  return handle(r) as Promise<Post>
}

export async function getPostBySlug(typeSegment: string, slug: string): Promise<Post> {
  // normalize segment to backend enum
  const map: Record<string,string> = { posts:'post', news:'news', vip:'vip', ads:'ads' }
  const t = map[typeSegment] || 'post'
  const r = await fetch(`${API}/api/posts/type/${t}/slug/${encodeURIComponent(slug)}`, { credentials: 'include' })
  return handle(r) as Promise<Post>
}

export async function createPost(payload: { title: string; body: string; tags: string[]; personaId: string; action?: 'publish' | 'submit' }) {
  const r = await fetch(`${API}/api/posts`, {
    method: 'POST',
    credentials: 'include',
    headers: headers(),
    body: JSON.stringify(payload),
  })
  return handle(r) as Promise<Post>
}

export async function submitPost(id: string) {
  const r = await fetch(`${API}/api/posts/${id}/submit`, { method: 'PATCH', credentials: 'include', headers: headers() })
  return handle(r) as Promise<Post>
}

export async function publishPost(id: string) {
  const r = await fetch(`${API}/api/posts/${id}/publish`, { method: 'PATCH', credentials: 'include', headers: headers() })
  return handle(r) as Promise<Post>
}

// Optional: example mutation (wire later)
export async function votePost(id: string, dir: 'up' | 'down'): Promise<{ votes: number }> {
  const res = await fetch(`${API}/api/posts/${id}/vote`, {
    method: 'POST',
    credentials: 'include',
    headers: headers(),
    body: JSON.stringify({ dir }),
  })
  return handle(res)
}
