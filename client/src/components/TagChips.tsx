import { Link } from 'react-router-dom';

export default function TagChips({ tags = [] as string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <Link key={tag} to={`/tag/${String(tag).toLowerCase()}`} className="inline-block px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">
          #{tag}
        </Link>
      ))}
    </div>
  );
}
