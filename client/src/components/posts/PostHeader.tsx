import { VerifiedBadge } from '../ui/VerifiedBadge';
import type { PostType } from '@/types/post';
import { avatarUrl } from '@/lib/upload';

export default function PostHeader({ author, timestamp }: { author: PostType['author']; timestamp: Date; }) {
  return (
    <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
      <div className="relative w-10 h-10 rounded-full overflow-hidden">
        <img src={avatarUrl(author.avatar || '')} alt={author.name} className="object-cover w-full h-full" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <h3 className="font-medium">{author.name}</h3>
          {author.verified && <VerifiedBadge />}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(timestamp).toLocaleString()}
        </p>
      </div>
      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
        ⋮
      </button>
    </div>
  );
}
