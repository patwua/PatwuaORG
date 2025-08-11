import axios from 'axios'
import type { Post } from '../types/post'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
})

const token = () => localStorage.getItem('token')
const headers = () => ({ 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) })

// Normalize server payloads into our Post shape
export function normalizePost(p: any): Post {
  const post: Post = {
    id: p._id ?? p.id ?? crypto.randomUUID(),
    title: p.title ?? 'Untitled',
    excerpt: p.excerpt ?? p.summary ?? (p.body ? String(p.body).slice(0, 140) : ''),
    coverImage: p.coverImage ?? p.coverUrl ?? p.image ?? undefined,
    body: p.body,
    bodyHtml: p.bodyHtml,
    format: p.format,
    tags: Array.isArray(p.tags) ? p.tags : [],
    path: p.path ?? (p.slug ? `/p/${p.slug}` : undefined),
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
      up: Number(p.stats?.up ?? p.up ?? 0),
      down: Number(p.stats?.down ?? p.down ?? 0),
      myVote: typeof (p.stats?.myVote ?? p.myVote) === 'number' ? Number(p.stats?.myVote ?? p.myVote) : undefined,
    },
    media: Array.isArray(p.media) ? p.media : undefined,
    // prefer createdAt, fall back to timestamp/updatedAt
    createdAt: p.createdAt ?? p.timestamp ?? p.updatedAt ?? new Date().toISOString(),
  }
  if (p.summaryAI) post.summaryAI = p.summaryAI
  return post
}

async function handle(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/api/posts?status=active`, { credentials: 'include' })
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
  const r = await fetch(`${API_BASE}/api/posts/${id}`, { credentials: 'include' })
  return handle(r) as Promise<Post>
}

export const fetchPostBySlug = (slug: string) => api.get(`/posts/slug/${slug}`)

export const archivePost = (id: string, reason: string) => api.post(`/posts/${id}/archive`, { reason })

export const unarchivePost = (id: string) => api.post(`/posts/${id}/unarchive`)

export async function createPost(payload: { title: string; body: string; tags: string[]; personaId: string; action?: 'publish' | 'submit' }) {
  const r = await fetch(`${API_BASE}/api/posts`, {
    method: 'POST',
    credentials: 'include',
    headers: headers(),
    body: JSON.stringify(payload),
  })
  const data = await handle(r)
  return normalizePost(data.post)
}

export async function submitPost(id: string) {
  const r = await fetch(`${API_BASE}/api/posts/${id}/submit`, { method: 'PATCH', credentials: 'include', headers: headers() })
  return handle(r) as Promise<Post>
}

export async function publishPost(id: string) {
  const r = await fetch(`${API_BASE}/api/posts/${id}/publish`, { method: 'PATCH', credentials: 'include', headers: headers() })
  return handle(r) as Promise<Post>
}

// Optional: example mutation (wire later)
export async function votePost(
  id: string,
  dir: 'up' | 'down'
): Promise<{ score: number; up: number; down: number; myVote: number }> {
  const { data } = await api.post(`/posts/${id}/vote`, { dir })
  return data
}
