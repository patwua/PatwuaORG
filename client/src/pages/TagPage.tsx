import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { votePost, normalizePost } from '../lib/api'
import type { Post } from '../types/post'

const API = import.meta.env.VITE_API_BASE || ''

export default function TagPage() {
  const { tag = '' } = useParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API}/api/tags/${encodeURIComponent(tag.toLowerCase())}`, { credentials: 'include' })
        const data = await res.json()
        const list = Array.isArray(data.posts) ? data.posts.map((p: any) => normalizePost(p)) : []
        if (alive) setPosts(list)
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load posts')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [tag])

  async function onVote(id: string, dir: 'up' | 'down') {
    const { score, up, down, myVote } = await votePost(id, dir)
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              stats: {
                ...(p.stats || { comments: 0, votes: 0 }),
                votes: score,
                up,
                down,
                myVote,
              },
            }
          : p
      )
    )
    return score
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pt-4 pb-24 md:pb-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">#{tag}</h1>
      {loading && <div className="card p-6 animate-pulse">Loading…</div>}
      {error && (
        <div className="card p-4 border-red-200 text-red-700">
          <div className="font-semibold mb-1">Couldn’t load posts</div>
          <div className="text-sm opacity-90">{error}</div>
        </div>
      )}
      {!loading && !error && posts.length === 0 && (
        <div className="card p-6 text-sm text-neutral-600 dark:text-neutral-300">No posts found for this tag.</div>
      )}
      {!loading && !error && posts.map(p => <PostCard key={p.id} post={p} onVote={onVote} />)}
    </main>
  )
}

