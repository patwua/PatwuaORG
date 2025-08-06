import { HeartIcon, ChatBubbleIcon, BookmarkIcon, ShareIcon } from '@radix-ui/react-icons';
import type { PostType } from '@/types/post';

export default function PostActions({ stats }: { stats: PostType['stats'] }) {
  return (
    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
      <div className="flex gap-4">
        <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
          <HeartIcon /> {stats.likes}
        </button>
        <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
          <ChatBubbleIcon /> {stats.comments}
        </button>
      </div>
      <div className="flex gap-4">
        <button className="text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400">
          <BookmarkIcon />
        </button>
        <button className="text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400">
          <ShareIcon />
        </button>
      </div>
    </div>
  );
}
