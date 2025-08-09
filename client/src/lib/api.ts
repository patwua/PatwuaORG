import type { Post } from '../types/post'

const API = import.meta.env.VITE_API_BASE || ''

// Normalize server payloads into our Post shape
export function normalizePost(p: any): Post {
  return {
    id: p._id ?? p.id ?? crypto.randomUUID(),
    title: p.title ?? 'Untitled',
    excerpt: p.excerpt ?? p.summary ?? '',
    coverUrl: p.coverUrl ?? p.image ?? undefined,
    tags: p.tags ?? [],
    author: p.author ?? { name: p.authorName ?? 'Unknown', verified: !!p.authorVerified },
    stats: {
      comments: Number(p.commentCount ?? p.comments ?? 0),
      votes: Number(p.votes ?? p.score ?? 0),
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
  const res = await fetch(`${API}/api/posts`, { credentials: 'include' })
  const data = await handle(res)
  if (Array.isArray(data)) return data.map(normalizePost)
  if (Array.isArray(data?.items)) return data.items.map(normalizePost)
  return []
}

// Optional: example mutation (wire later)
export async function votePost(id: string, dir: 'up' | 'down'): Promise<{ votes: number }> {
  const res = await fetch(`${API}/api/posts/${id}/vote`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dir }),
  })
  return handle(res)
}
