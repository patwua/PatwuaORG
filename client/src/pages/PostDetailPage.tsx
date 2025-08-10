import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPostBySlug } from '../lib/api'
import type { Post } from '../types/post'

export default function PostDetailPage() {
  const { slug = '' } = useParams()
  const type = window.location.pathname.split('/')[1] || 'posts'
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await getPostBySlug(type, slug)
        if (!alive) return
        setPost(data)
        document.title = `${data.title} • Patwua`
      } catch (e: any) {
        setError(e?.message || 'Post not found')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [type, slug])

  if (loading) return <div className="mx-auto max-w-3xl p-4">Loading…</div>
  if (error || !post) return <div className="mx-auto max-w-3xl p-4 text-red-600">Post not found.</div>

  const created = post.createdAt ? new Date(post.createdAt) : null
  const idOr = (post as any)._id || post.id

  return (
    <article className="mx-auto max-w-3xl p-4 space-y-5">
      {/* Byline */}
      <header className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-200">
          {post.persona?.avatar ? <img src={post.persona.avatar} alt={post.persona.name} className="h-full w-full object-cover" /> : null}
        </div>
        <div>
          <div className="font-semibold">
            {post.persona?.name || '—'}
          </div>
          <div className="text-xs text-neutral-500">
            {created ? created.toLocaleString() : ''}
            {post.author?.slug && (
              <>
                {' · via '}
                <Link className="underline" to={`/u/${post.author.slug}`}>{post.author.name}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold">{post.title}</h1>

      {/* Tags */}
      {!!post.tags?.length && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map(t => <span key={t} className="tag-chip">#{t}</span>)}
        </div>
      )}

      {/* Body */}
      <div className="prose dark:prose-invert max-w-none">
        {post.body?.split('\n').map((p, i) => <p key={i}>{p}</p>)}
      </div>

      {/* Footer actions (placeholder) */}
      <footer className="flex items-center justify-between pt-4 border-t">
        <Link to="/" className="underline">← Back to feed</Link>
        <div className="text-sm text-neutral-500">Post ID: {idOr}</div>
      </footer>
    </article>
  )
}
