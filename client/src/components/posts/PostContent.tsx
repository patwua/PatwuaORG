import { useEffect, useRef } from 'react'
import { useVariant } from '@/context/VariantContext'
import { isCloudinaryUrl, buildSrcSet, withTransform, sizesFor } from '@/lib/images'
import type { Post } from '@/types/post'

export default function PostContent({ post }: { post: Post }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { actual } = useVariant()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const imgs = el.querySelectorAll<HTMLImageElement>('img')
    imgs.forEach((img) => {
      const src = img.getAttribute('src') || ''
      if (!isCloudinaryUrl(src)) return
      const widths = actual === 'mobile-lite' ? [320, 480, 640] : [480, 800, 1200]
      img.setAttribute('src', withTransform(src, { w: widths[widths.length - 1] }))
      img.setAttribute('srcset', buildSrcSet(src, widths))
      img.setAttribute('sizes', sizesFor(actual))
      img.setAttribute('loading', 'lazy')
      img.setAttribute('decoding', 'async')
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
    })
  }, [actual, post.bodyHtml, post.body])

  return (
    <div className="p-4">
      {post.coverImage && (
        <figure className="mb-4">
          <img src={post.coverImage} alt="" className="w-full h-auto rounded-lg" />
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
