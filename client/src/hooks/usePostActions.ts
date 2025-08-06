import { useState } from 'react';
import type { PostType } from '@/types/post';

type PostInteraction = Pick<PostType, 'id' | 'stats' | 'isLiked' | 'isBookmarked'>;

type ActionHandlers = {
  onLike?: (postId: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
};

export function usePostActions(
  initialPost: PostInteraction,
  handlers: ActionHandlers = {}
) {
  const [post, setPost] = useState(initialPost);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = async () => {
    setIsLoading(true);
    try {
      // Optimistic update
      setPost((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          likes: prev.stats.likes + (prev.isLiked ? -1 : 1),
        },
        isLiked: !prev.isLiked,
      }));

      await handlers.onLike?.(post.id);
    } catch (error) {
      console.error(error);
      // Rollback on error
      setPost((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          likes: prev.stats.likes + (prev.isLiked ? -1 : 1),
        },
        isLiked: !prev.isLiked,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBookmark = async () => {
    setIsLoading(true);
    try {
      setPost((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          bookmarks: prev.stats.bookmarks + (prev.isBookmarked ? -1 : 1),
        },
        isBookmarked: !prev.isBookmarked,
      }));
      await handlers.onBookmark?.(post.id);
    } catch (error) {
      console.error(error);
      setPost((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          bookmarks: prev.stats.bookmarks + (prev.isBookmarked ? -1 : 1),
        },
        isBookmarked: !prev.isBookmarked,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    post,
    isLoading,
    toggleLike,
    toggleBookmark,
  };
}

