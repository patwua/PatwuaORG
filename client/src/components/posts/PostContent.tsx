import { useEffect, useRef } from 'react'
import { isCloudinaryUrl, buildSrcSet, withTransform, sizesUniversal } from '@/lib/images'
import type { Post } from '@/types/post'

export default function PostContent({ post }: { post: Post }) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const imgs = el.querySelectorAll<HTMLImageElement>('img')
    imgs.forEach((img) => {
      const src = img.getAttribute('src') || ''
      if (!isCloudinaryUrl(src)) return
      const widths = [480, 800, 1200]
      img.setAttribute('src', withTransform(src, { w: widths[widths.length - 1] }))
      img.setAttribute('srcset', buildSrcSet(src, widths))
      img.setAttribute('sizes', sizesUniversal())
      img.setAttribute('loading', 'lazy')
      img.setAttribute('decoding', 'async')
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
    })
  }, [post.bodyHtml, post.body])

  return (
    <div className="p-4">
      {post.coverImage && (
        <figure className="mb-4">
          <img
            src={isCloudinaryUrl(post.coverImage) ? withTransform(post.coverImage, { w: 1200 }) : post.coverImage}
            srcSet={isCloudinaryUrl(post.coverImage) ? buildSrcSet(post.coverImage, [480, 800, 1200]) : undefined}
            sizes={isCloudinaryUrl(post.coverImage) ? sizesUniversal() : undefined}
            alt=""
            className="w-full h-auto rounded-lg"
            loading="lazy"
            decoding="async"
          />
        </figure>
      )}
      {post.bodyHtml ? (
        <div
          ref={containerRef}
          className="prose max-w-none post-html"
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />
      ) : (
        <div ref={containerRef} className="prose max-w-none">
          {post.body}
        </div>
      )}
    </div>
  )
}
