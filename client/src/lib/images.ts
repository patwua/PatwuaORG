const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD || ''

// Very light detection: accept official Cloudinary delivery URLs.
// (If not Cloudinary, we return the original URL unchanged.)
export function isCloudinaryUrl(src: string): boolean {
  try {
    const u = new URL(src)
    return /(^|\.)res\.cloudinary\.com$/i.test(u.hostname)
  } catch {
    return false
  }
}

/**
 * Insert/merge Cloudinary transforms after `/image/upload/`.
 * Example in:  https://res.cloudinary.com/<cloud>/image/upload/v123/foo.jpg
 * Example out: https://res.cloudinary.com/<cloud>/image/upload/q_auto,f_auto,dpr_auto,c_limit,w_640/v123/foo.jpg
 */
export function withTransform(
  src: string,
  {
    w,
    q = 'auto',
    f = 'auto',
    dpr = 'auto',
    crop = 'limit',
  }: { w?: number; q?: string; f?: string; dpr?: string; crop?: 'limit' | 'fill' | 'fit' } = {},
): string {
  if (!isCloudinaryUrl(src)) return src
  const parts = src.split('/image/upload/')
  if (parts.length !== 2) return src
  const left = parts[0] + '/image/upload'
  const right = parts[1] // may start with v123/...

  const tx: string[] = []
  if (q) tx.push(`q_${q}`)
  if (f) tx.push(`f_${f}`)
  if (dpr) tx.push(`dpr_${dpr}`)
  if (crop) tx.push(`c_${crop}`)
  if (w) tx.push(`w_${w}`)

  return `${left}/${tx.join(',')}/${right}`
}

export function buildSrcSet(src: string, widths: number[]): string {
  return widths.map((w) => `${withTransform(src, { w })} ${w}w`).join(', ')
}

export function sizesUniversal(): string {
  // good defaults for cards/content: near full width on phones, constrained on larger screens
  return '(max-width: 640px) 96vw, (max-width: 1024px) 85vw, 1200px'
}
