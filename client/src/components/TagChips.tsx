export default function TagChips({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <a key={tag} href={`/tag/${encodeURIComponent(tag)}`} className="tag-chip">#{tag}</a>
      ))}
    </div>
  )
}

