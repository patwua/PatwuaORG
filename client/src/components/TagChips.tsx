import { Link } from 'react-router-dom';

function normalizeForUrl(t: string) {
  return t.toLowerCase();
}

export default function TagChips({ tags = [] }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <Link
          key={tag}
          to={`/tag/${encodeURIComponent(normalizeForUrl(tag))}`}
          className="text-xs rounded-full bg-gray-100 px-2 py-1 hover:bg-gray-200"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
