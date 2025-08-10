import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPostBySlug, unarchivePost } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Post } from '../types/post'
import ArchiveModal from '../components/ArchiveModal'

export default function PostDetailPage() {
  const { slug = '' } = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showArchive, setShowArchive] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await fetchPostBySlug(slug)
        if (!alive) return
        setPost(data.post)
        document.title = `${data.post.title} • Patwua`
      } catch (e: any) {
        setError(e?.message || 'Post not found')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [slug])

  if (loading) return <div className="mx-auto max-w-3xl p-4">Loading…</div>
  if (error || !post) return <div className="mx-auto max-w-3xl p-4 text-red-600">Post not found.</div>

  const created = post.createdAt ? new Date(post.createdAt) : null
  const idOr = (post as any)._id || post.id
  const canArchive = ['moderator','admin','system_admin'].includes(user?.role || '') && post.status !== 'archived'
  const canUnarchive = post.status === 'archived' && (user?.role === 'system_admin' || [post.author?._id, post.author?.id].includes(user?.id))

  async function handleUnarchive() {
    try {
      const { data } = await unarchivePost(idOr as string)
      setPost(data.post)
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to unarchive')
    }
  }

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
      {post.bodyHtml ? (
        <div
          className="prose dark:prose-invert max-w-none post-html"
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />
      ) : (
        <div className="prose dark:prose-invert max-w-none">
          {post.body?.split('\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}

      {/* Footer actions (placeholder) */}
      <footer className="flex items-center justify-between pt-4 border-t">
        <Link to="/" className="underline">← Back to feed</Link>
        <div className="flex items-center gap-2">
          {canArchive && (
            <button onClick={() => setShowArchive(true)} className="text-sm underline">Archive</button>
          )}
          {canUnarchive && (
            <button onClick={handleUnarchive} className="text-sm underline">Unarchive</button>
          )}
          <div className="text-sm text-neutral-500">Post ID: {idOr}</div>
        </div>
      </footer>
      {showArchive && (
        <ArchiveModal
          postId={idOr as string}
          onClose={() => setShowArchive(false)}
          onArchived={(p) => { setPost(p); setShowArchive(false); }}
        />
      )}
    </article>
  )
}
