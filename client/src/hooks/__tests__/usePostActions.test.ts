import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePostActions } from '../usePostActions';

const createPost = () => ({
  id: '1',
  stats: { likes: 0, comments: 0, bookmarks: 0 },
  isLiked: false,
  isBookmarked: false,
});

describe('usePostActions', () => {
  it('optimistically toggles like and bookmark', async () => {
    const { result } = renderHook(() => usePostActions(createPost()));

    await act(async () => {
      await result.current.toggleLike();
    });
    expect(result.current.post.isLiked).toBe(true);
    expect(result.current.post.stats.likes).toBe(1);

    await act(async () => {
      await result.current.toggleBookmark();
    });
    expect(result.current.post.isBookmarked).toBe(true);
    expect(result.current.post.stats.bookmarks).toBe(1);
  });

  it('handles rapid like toggles without inconsistency', async () => {
    const { result } = renderHook(() => usePostActions(createPost()));

    await act(async () => {
      const p1 = result.current.toggleLike();
      const p2 = result.current.toggleLike();
      await Promise.all([p1, p2]);
    });

    expect(result.current.post.isLiked).toBe(false);
    expect(result.current.post.stats.likes).toBe(0);
  });

  it('rolls back like on error', async () => {
    const onLike = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePostActions(createPost(), { onLike }));

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(result.current.post.isLiked).toBe(false);
    expect(result.current.post.stats.likes).toBe(0);
  });

  it('rolls back bookmark on error', async () => {
    const onBookmark = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePostActions(createPost(), { onBookmark }));

    await act(async () => {
      await result.current.toggleBookmark();
    });

    expect(result.current.post.isBookmarked).toBe(false);
    expect(result.current.post.stats.bookmarks).toBe(0);
  });

  it('reflects loading state during async actions', async () => {
    let resolve!: () => void;
    const onLikePromise = new Promise<void>((res) => (resolve = res));
    const onLike = vi.fn(() => onLikePromise);
    const { result } = renderHook(() => usePostActions(createPost(), { onLike }));

    let action!: Promise<void>;
    await act(async () => {
      action = result.current.toggleLike();
    });
    expect(result.current.isLoading).toBe(true);

    resolve();
    await act(async () => {
      await action;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
