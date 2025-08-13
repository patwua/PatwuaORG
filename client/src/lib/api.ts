import axios from 'axios'
import type { Post } from '../types/post'
import { getClientVariant } from './variant'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export const api = axios.create({
  baseURL: `${API_BASE}/api`
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('authToken')
  if (token) cfg.headers = { ...cfg.headers, Authorization: `Bearer ${token}` }
  // Add client variant header
  cfg.headers = { ...cfg.headers, 'X-Client-Variant': getClientVariant() }
  return cfg
})

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
    ...(p.personaId || p.personaName || p.personaAvatar
      ? { persona: { _id: p.personaId, name: p.personaName, avatar: p.personaAvatar } }
      : {}),
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
  const res = await fetch(`${API_BASE}/api/posts?status=active`)
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
  const r = await fetch(`${API_BASE}/api/posts/${id}`)
  return handle(r) as Promise<Post>
}

export const getPostBySlug = (slug: string) => api.get(`/posts/slug/${slug}`)

export const archivePost = (id: string, reason: string) => api.post(`/posts/${id}/archive`, { reason })

export const unarchivePost = (id: string) => api.post(`/posts/${id}/unarchive`)

export const previewPost = (payload: { content?: string; body?: string }) =>
  api.post('/posts/preview', payload)

export const createPost = (payload: { title: string; content?: string; body?: string; personaId?: string; coverImage?: string }) =>
  api.post('/posts', payload)

export const votePost = (postId: string, value: -1 | 0 | 1) =>
  api.post(`/posts/${postId}/vote`, { value })
export const getVotes = (postId: string) =>
  api.get(`/posts/${postId}/votes`)
export const getComments = (postId: string) => api.get(`/posts/${postId}/comments`)
export const addComment = (
  postId: string,
  payload: { body: string; personaId?: string }
) => api.post(`/posts/${postId}/comments`, payload)
