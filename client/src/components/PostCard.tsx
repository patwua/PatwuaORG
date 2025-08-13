import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCheck, ArrowBigUp, ArrowBigDown, MessageSquareText, Bookmark, Share2 } from 'lucide-react'
import TagChips from './TagChips'
import type { Post } from '../types/post'
import { isCloudinaryUrl, withTransform, buildSrcSet, sizesUniversal } from '@/lib/images'

export default function PostCard({
  post,
  onVote,
}: {
  post: Post
  onVote?: (id: string, dir: 'up' | 'down') => Promise<number | void> | void
}) {
  const [relative, setRelative] = useState<string>('just now')
  const [pending, setPending] = useState<'up' | 'down' | null>(null)
  const [optimistic, setOptimistic] = useState<number | null>(null)
  const cover = (post as any).coverUrl || post.coverImage || (post.media?.[0]?.url as string | undefined)
  const widths = [480, 800, 1200]
  useEffect(() => {
    if (!post.createdAt) return
    const then = new Date(post.createdAt)
    const fmt = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    const diffMs = Date.now() - then.getTime()
    const diffMin = Math.round(diffMs / 60000)
    const abs = Math.abs(diffMin)
    if (abs < 60) setRelative(fmt.format(-diffMin, 'minute'))
    else if (abs < 60 * 24) setRelative(fmt.format(-Math.round(diffMin / 60), 'hour'))
    else setRelative(fmt.format(-Math.round(diffMin / (60 * 24)), 'day'))
  }, [post.createdAt])

  async function handleVote(dir: 'up' | 'down') {
    if (pending) return
    const current = post.stats?.votes ?? 0
    const delta = dir === 'up' ? 1 : -1
    setPending(dir)
    setOptimistic(current + delta)
    try {
      const next = await onVote?.(post.id, dir)
      if (typeof next === 'number') setOptimistic(next)
    } catch (e) {
      setOptimistic(current)
    } finally {
      setPending(null)
    }
  }

  return (
    <article className="card card-hover overflow-hidden">
      {cover && (
        <Link
          to={post.slug ? `/p/${post.slug}` : '#'}
          className="block aspect-video w-full overflow-hidden rounded-lg bg-gray-100"
        >
          <img
            className="h-full w-full object-cover"
            alt={post.title || 'cover image'}
            loading="lazy"
            decoding="async"
            src={isCloudinaryUrl(cover) ? withTransform(cover, { w: 1200 }) : cover}
            srcSet={isCloudinaryUrl(cover) ? buildSrcSet(cover, widths) : undefined}
            sizes={isCloudinaryUrl(cover) ? sizesUniversal() : undefined}
          />
        </Link>
      )}
      <div className="p-4 md:p-5">
        <div className="flex items-center gap-3 mb-3">
          {post.persona?.avatar ? (
            <img
              src={post.persona.avatar}
              alt={post.persona?.name ?? post.author?.name ?? 'Avatar'}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-neutral-200" />
          )}
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <span>{post.persona?.name ?? post.author?.name ?? 'Unknown'}</span>
              {post.author?.verified && <CheckCheck className="h-4 w-4 text-emerald-500" />}
            </div>
            <div className="text-xs text-neutral-500 flex items-center gap-1">
              <time dateTime={post.createdAt ?? ''}>{relative}</time>
              {post.summaryAI && (
                <span className="px-1.5 py-0.5 rounded-full bg-neutral-200 text-[10px] text-neutral-700">AI</span>
              )}
              {post.type && post.type !== 'post' && (
                <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px]">
                  {post.type === 'news' ? 'Publisher' : post.type === 'vip' ? 'VIP' : 'Ad'}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto inline-flex gap-1 text-neutral-500">
            <button className="p-2 hover:text-orange-700" aria-label="save"><Bookmark className="h-5 w-5" /></button>
            <button className="p-2 hover:text-orange-700" aria-label="share"><Share2 className="h-5 w-5" /></button>
          </div>
        </div>

        <Link
          to={post.slug ? `/p/${post.slug}` : '#'}
          className="text-lg md:text-xl font-semibold tracking-tight mb-2 hover:underline"
        >
          {post.title}
        </Link>
        {(post.summaryAI || post.excerpt) && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">{post.summaryAI || post.excerpt}</p>
        )}

        <TagChips tags={post.tags} />

        <div className="mt-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 dark:border-neutral-800">
            <button
              className="px-3 py-1.5 hover:text-orange-700 disabled:opacity-50"
              aria-label="Upvote"
              disabled={!!pending}
              onClick={() => handleVote('up')}
            >
              <ArrowBigUp className="h-5 w-5" />
            </button>
            <span className="px-2 text-sm min-w-[2ch] text-center">
              {optimistic ?? post.stats?.votes ?? 0}
            </span>
            <button
              className="px-3 py-1.5 hover:text-orange-700 disabled:opacity-50"
              aria-label="Downvote"
              disabled={!!pending}
              onClick={() => handleVote('down')}
            >
              <ArrowBigDown className="h-5 w-5" />
            </button>
          </div>
          <a
            href={post.slug ? `/p/${post.slug}#comments` : '#comments'}
            className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-orange-700"
          >
            <MessageSquareText className="h-4 w-4" />
            <span>{post.stats?.comments ?? 0} comments</span>
          </a>
        </div>
      </div>
    </article>
  )
}

