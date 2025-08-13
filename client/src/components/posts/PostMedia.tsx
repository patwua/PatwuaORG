import type { PostType } from '@/types/post'
import { useVariant } from '@/context/VariantContext'
import { isCloudinaryUrl, withTransform, buildSrcSet, sizesFor } from '@/lib/images'

export default function PostMedia({ media }: { media: NonNullable<PostType['media']> }) {
  const { actual } = useVariant()

  if (media.type === 'image') {
    const src = media.url
    const widths = actual === 'mobile-lite' ? [320, 480, 640] : [480, 800, 1200]
    const srcAttr = isCloudinaryUrl(src) ? withTransform(src, { w: widths[widths.length - 1] }) : src
    const srcSetAttr = isCloudinaryUrl(src) ? buildSrcSet(src, widths) : undefined
    const sizesAttr = isCloudinaryUrl(src) ? sizesFor(actual) : undefined

    return (
      <img
        className="my-3 w-full rounded object-contain"
        alt={media.alt || ''}
        loading="lazy"
        decoding="async"
        src={srcAttr}
        srcSet={srcSetAttr}
        sizes={sizesAttr}
      />
    )
  }

  if (media.type === 'video') {
    return (
      <video
        src={media.url}
        controls
        className="my-3 w-full rounded object-contain"
      />
    )
  }

  return null
}
