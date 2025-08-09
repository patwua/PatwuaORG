import { useEffect, useState } from 'react'
import { CheckCheck, ArrowBigUp, ArrowBigDown, MessageSquareText, Bookmark, Share2 } from 'lucide-react'
import TagChips from './TagChips'
import type { Post } from '../types/post'

export default function PostCard({ post }: { post: Post }) {
  const [relative, setRelative] = useState<string>('just now')
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

  return (
    <article className="card card-hover overflow-hidden">
      <div className="p-4 md:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-neutral-200" />
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <span>{post.author?.name ?? 'Unknown'}</span>
              {post.author?.verified && <CheckCheck className="h-4 w-4 text-emerald-500" />}
            </div>
            <div className="text-xs text-neutral-500"><time dateTime={post.createdAt ?? ''}>{relative}</time></div>
          </div>
          <div className="ml-auto inline-flex gap-1 text-neutral-500">
            <button className="p-2 hover:text-orange-700" aria-label="save"><Bookmark className="h-5 w-5" /></button>
            <button className="p-2 hover:text-orange-700" aria-label="share"><Share2 className="h-5 w-5" /></button>
          </div>
        </div>

        <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-2">{post.title}</h2>
        {post.excerpt && <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">AI · {post.excerpt}</p>}

        <TagChips tags={post.tags} />

        <div className="mt-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 dark:border-neutral-800">
            <button className="px-3 py-1.5 hover:text-orange-700"><ArrowBigUp className="h-5 w-5" /></button>
            <span className="px-2 text-sm min-w-[2ch] text-center">{post.stats?.votes ?? 0}</span>
            <button className="px-3 py-1.5 hover:text-orange-700"><ArrowBigDown className="h-5 w-5" /></button>
          </div>
          <a href="#comments" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-orange-700">
            <MessageSquareText className="h-4 w-4" />
            <span>{post.stats?.comments ?? 0} comments</span>
          </a>
        </div>
      </div>
    </article>
  )
}

