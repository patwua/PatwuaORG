import type { Post } from '../types/post'
import { normalizePost } from './api'

const API = import.meta.env.VITE_API_BASE || ''

async function handle(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getTrendingTags(limit = 5, sinceDays = 7): Promise<{ tag: string; count: number }[]> {
  const url = new URL(`${API}/api/tags/trending`)
  if (limit) url.searchParams.set('limit', String(limit))
  if (sinceDays) url.searchParams.set('sinceDays', String(sinceDays))
  const res = await fetch(url.toString(), { credentials: 'include' })
  const data = await handle(res)
  const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
  return list.map((t: any) => ({ tag: t.tag ?? t._id ?? String(t), count: Number(t.count ?? t.total ?? 0) }))
}

export async function getPostsByTag(tag: string, limit = 20): Promise<Post[]> {
  const url = new URL(`${API}/api/tags/${encodeURIComponent(tag.toLowerCase())}`)
  if (limit) url.searchParams.set('limit', String(limit))
  const res = await fetch(url.toString(), { credentials: 'include' })
  const data = await handle(res)
  const list = Array.isArray(data.posts) ? data.posts : []
  return list.map((p: any) => normalizePost(p))
}

