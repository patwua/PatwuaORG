import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PostActions from '../PostActions';
import React from 'react';

vi.mock('@radix-ui/react-icons', () => ({
  HeartIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  BookmarkIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  ChatBubbleIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  ShareIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

const createStats = () => ({ likes: 0, comments: 0, bookmarks: 0 });

describe('PostActions component', () => {
  it('optimistically updates like and bookmark state', async () => {
    const { container } = render(
      <PostActions stats={createStats()} postId="1" />
    );
    const buttons = container.querySelectorAll('button');
    const likeButton = buttons[0] as HTMLButtonElement;
    const bookmarkButton = buttons[2] as HTMLButtonElement;

    fireEvent.click(likeButton);
    await waitFor(() => expect(likeButton.textContent).toContain('1'));
    expect(likeButton.className).toContain('text-red-500');

    fireEvent.click(bookmarkButton);
    await waitFor(() =>
      expect(bookmarkButton.querySelector('svg')?.getAttribute('fill')).toBe(
        'currentColor'
      )
    );
  });

  it('handles multiple toggles restoring original state', async () => {
    const { container } = render(
      <PostActions stats={createStats()} postId="1" />
    );
    let likeButton = container.querySelectorAll('button')[0] as HTMLButtonElement;
    let bookmarkButton = container.querySelectorAll('button')[2] as HTMLButtonElement;

    fireEvent.click(likeButton);
    await waitFor(() =>
      expect(
        (container.querySelectorAll('button')[0] as HTMLButtonElement).textContent
      ).toContain('1')
    );
    fireEvent.click(container.querySelectorAll('button')[0] as HTMLButtonElement);
    likeButton = container.querySelectorAll('button')[0] as HTMLButtonElement;
    await waitFor(() => expect(likeButton.textContent).toContain('0'));
    expect(likeButton.classList.contains('text-red-500')).toBe(false);

    fireEvent.click(bookmarkButton);
    await waitFor(() =>
      expect(
        (container.querySelectorAll('button')[2] as HTMLButtonElement)
          .querySelector('svg')
          ?.getAttribute('fill')
      ).toBe('currentColor')
    );
    fireEvent.click(container.querySelectorAll('button')[2] as HTMLButtonElement);
    bookmarkButton = container.querySelectorAll('button')[2] as HTMLButtonElement;
    await waitFor(() =>
      expect(bookmarkButton.querySelector('svg')?.getAttribute('fill')).toBe(
        'none'
      )
    );
  });

  it('rolls back like and bookmark on error', async () => {
    const onLike = vi.fn().mockRejectedValue(new Error('fail'));
    const onBookmark = vi.fn().mockRejectedValue(new Error('fail'));
    const { container } = render(
      <PostActions
        stats={createStats()}
        postId="1"
        handlers={{ onLike, onBookmark }}
      />
    );
    fireEvent.click(
      container.querySelectorAll('button')[0] as HTMLButtonElement
    );
    await waitFor(() => {
      const btn = container.querySelectorAll('button')[0] as HTMLButtonElement;
      expect(btn.textContent).toContain('0');
      expect(btn.classList.contains('text-red-500')).toBe(false);
    });

    fireEvent.click(
      container.querySelectorAll('button')[2] as HTMLButtonElement
    );
    await waitFor(() =>
      expect(
        (container.querySelectorAll('button')[2] as HTMLButtonElement)
          .querySelector('svg')
          ?.getAttribute('fill')
      ).toBe('none')
    );
  });

  it('disables action buttons while loading', async () => {
    let resolve!: () => void;
    const onLike = vi.fn(() => new Promise<void>((res) => (resolve = res)));
    const { container } = render(
      <PostActions stats={createStats()} postId="1" handlers={{ onLike }} />
    );
    const buttons = container.querySelectorAll('button');
    const likeButton = buttons[0] as HTMLButtonElement;
    const bookmarkButton = buttons[2] as HTMLButtonElement;

    fireEvent.click(likeButton);
    expect(likeButton.disabled).toBe(true);
    expect(bookmarkButton.disabled).toBe(true);

    await act(async () => {
      resolve();
    });
    await waitFor(() => expect(likeButton.disabled).toBe(false));
  });
});
