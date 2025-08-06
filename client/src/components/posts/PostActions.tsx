'use client';

import { HeartIcon, ChatBubbleIcon, BookmarkIcon, ShareIcon } from '@radix-ui/react-icons';
import { usePostActions } from '@/hooks/usePostActions';
import type { PostType } from '@/types/post';

type Handlers = {
  onLike?: (postId: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
};

export default function PostActions({
  stats,
  postId,
  isLiked = false,
  isBookmarked = false,
  handlers,
}: {
  stats: PostType['stats'];
  postId: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  handlers?: Handlers;
}) {
  const { post, isLoading, toggleLike, toggleBookmark } = usePostActions(
    {
      id: postId,
      stats,
      isLiked,
      isBookmarked,
    },
    handlers
  );

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post on Patwua',
          url: `${window.location.origin}/post/${postId}`,
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
      <div className="flex gap-4">
        <button
          onClick={toggleLike}
          disabled={isLoading}
          className={`flex items-center gap-1 ${post.isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50`}
        >
          <HeartIcon fill={post.isLiked ? 'currentColor' : 'none'} /> {post.stats.likes}
        </button>
        <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
          <ChatBubbleIcon /> {post.stats.comments}
        </button>
      </div>
      <div className="flex gap-4">
        <button
          onClick={toggleBookmark}
          disabled={isLoading}
          className={`${post.isBookmarked ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'} hover:text-yellow-500 dark:hover:text-yellow-400 disabled:opacity-50`}
        >
          <BookmarkIcon fill={post.isBookmarked ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={handleShare}
          className="text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400"
        >
          <ShareIcon />
        </button>
      </div>
    </div>
  );
}

