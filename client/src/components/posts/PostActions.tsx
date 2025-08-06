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
    <div className="px-4 py-2 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
      <div className="flex gap-1">
        <button
          onClick={toggleLike}
          disabled={isLoading}
          className={`post-action-btn ${post.isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} ${isLoading ? 'opacity-50' : ''}`}
        >
          <HeartIcon className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} />
          <span className="ml-1 text-sm">{post.stats.likes}</span>
        </button>
        <button className="post-action-btn text-gray-500 dark:text-gray-400">
          <ChatBubbleIcon className="w-5 h-5" />
          <span className="ml-1 text-sm">{post.stats.comments}</span>
        </button>
      </div>
      <div className="flex gap-1">
        <button
          onClick={toggleBookmark}
          disabled={isLoading}
          className={`post-action-btn ${post.isBookmarked ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'} ${isLoading ? 'opacity-50' : ''}`}
        >
          <BookmarkIcon className="w-5 h-5" fill={post.isBookmarked ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={handleShare}
          className="post-action-btn text-gray-500 dark:text-gray-400"
        >
          <ShareIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

