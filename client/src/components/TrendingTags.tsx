import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTrendingTags } from '../lib/tags'

interface Trend { tag: string; count: number }

export default function TrendingTags({ limit = 5, sinceDays = 7 }: { limit?: number; sinceDays?: number }) {
  const [tags, setTags] = useState<Trend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await getTrendingTags(limit, sinceDays)
        if (alive) setTags(data)
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load tags')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [limit, sinceDays])

  if (loading) return <div className="text-sm text-neutral-500">Loading…</div>
  if (error) return <div className="text-sm text-red-600">{error}</div>
  if (!tags.length) return <div className="text-sm text-neutral-500">No tags</div>

  return (
    <ul className="space-y-2">
      {tags.map(t => (
        <li key={t.tag} className="flex items-center justify-between">
          <Link to={`/tag/${encodeURIComponent(t.tag.toLowerCase())}`} className="text-sm hover:text-orange-700">#{t.tag}</Link>
          <span className="text-xs text-neutral-500">{t.count}</span>
        </li>
      ))}
    </ul>
  )
}

