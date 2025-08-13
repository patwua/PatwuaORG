import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProfilePage from '../ProfilePage';
import { getByHandle, getCounts, getCommentsByHandle, getMediaByHandle } from '@/lib/users';
import { getPosts } from '@/lib/api';

vi.mock('@/lib/users');
vi.mock('@/lib/api');

beforeEach(() => {
  vi.mocked(getByHandle).mockResolvedValue({
    user: {
      id: 'u1',
      handle: 'tester',
      displayName: 'Tester',
      avatar: null,
      bio: '',
      location: '',
      links: [],
      role: 'user',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  } as any);
  vi.mocked(getCounts).mockResolvedValue({ posts: 1, comments: 2, upvotes: 3 } as any);
  vi.mocked(getPosts).mockResolvedValue([
    {
      id: 'p1',
      slug: 'hello',
      title: 'Hello',
      coverImage: null,
      createdAt: '2025-01-02T00:00:00.000Z',
      tags: [],
      stats: { comments: 0, votes: 0 },
      author: {},
    },
  ] as any);
  vi.mocked(getCommentsByHandle).mockResolvedValue({
    items: [
      {
        _id: 'c1',
        body: 'Nice!',
        createdAt: '2025-01-03T00:00:00.000Z',
        post: { _id: 'p1', slug: 'hello', title: 'Hello' },
      },
    ],
    total: 1,
  } as any);
  vi.mocked(getMediaByHandle).mockResolvedValue({ items: [], total: 0 } as any);
});

describe('ProfilePage', () => {
  it('renders tabs and switches', async () => {
    render(
      <MemoryRouter initialEntries={['/@tester']}>
        <Routes>
          <Route path="/:handle" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    const tablist = await screen.findByRole('tablist', { name: /profile sections/i });
    expect(tablist).toBeTruthy();
    const postsTab = within(tablist).getByRole('tab', { name: 'Posts' });
    const commentsTab = within(tablist).getByRole('tab', { name: 'Comments' });
    within(tablist).getByRole('tab', { name: 'Media' });
    within(tablist).getByRole('tab', { name: 'About' });

    fireEvent.click(commentsTab);
    const commentsPanel = await screen.findByRole('tabpanel', { name: 'Comments' });
    expect(commentsPanel.textContent).toContain('Nice!');
    expect(postsTab.getAttribute('aria-selected')).toBe('false');
    expect(commentsTab.getAttribute('aria-selected')).toBe('true');
  });
});

