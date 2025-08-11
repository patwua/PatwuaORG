import { Link } from 'react-router-dom'

export default function TagChips({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <Link key={tag} to={`/tag/${encodeURIComponent(tag.toLowerCase())}`} className="tag-chip">
          #{tag}
        </Link>
      ))}
    </div>
  )
}

