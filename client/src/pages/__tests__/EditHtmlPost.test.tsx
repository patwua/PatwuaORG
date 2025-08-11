// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EditHtmlPost from '../EditHtmlPost';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

let mockUser: any = null;
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));

const { api } = await import('@/lib/api');
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={[`/p/test-post/edit`]}>
      <Routes>
        <Route path="/p/:slug/edit" element={<EditHtmlPost />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockNavigate.mockReset();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('EditHtmlPost', () => {
  it('detects, restores, and discards local draft for author', async () => {
    const post = {
      _id: '1',
      slug: 'test-post',
      title: 'Original',
      tags: ['t1'],
      coverImage: 'cover1.jpg',
      author: { _id: 'u1' },
    };
    (api.get as any).mockResolvedValue({ data: { post } });
    mockUser = { id: 'u1', role: 'member' };

    const draft = {
      title: 'Draft Title',
      content: '<p>Draft</p>',
      tags: 'draft, tags',
      coverOverride: 'draft-cover.jpg',
    };
    localStorage.setItem('editDraft:1', JSON.stringify(draft));

    renderPage();

    await screen.findByText('Edit Post');
    expect(screen.getByText(/Found a local draft/)).toBeTruthy();

    fireEvent.click(screen.getByText('Restore local draft'));
    expect((screen.getByPlaceholderText('Title') as HTMLInputElement).value).toBe('Draft Title');
    expect((screen.getByPlaceholderText('Paste/edit your HTML or MJML here') as HTMLTextAreaElement).value).toBe('<p>Draft</p>');
    expect((screen.getByPlaceholderText('e.g. welcome, platform, patwua') as HTMLInputElement).value).toBe('draft, tags');
    expect(screen.getByText(/Draft restored/)).toBeTruthy();

    fireEvent.click(screen.getByText('Discard local draft'));
    await waitFor(() => expect(localStorage.getItem('editDraft:1')).toBeNull());
    expect(screen.getByText('Local draft discarded.')).toBeTruthy();
  });

  it('saves edits to local draft and restores them including cover', async () => {
    const post = {
      _id: '1',
      slug: 'test-post',
      title: 'Original',
      author: { _id: 'u1' },
    };
    (api.get as any).mockResolvedValue({ data: { post } });
    (api.post as any).mockResolvedValue({
      data: {
        html: '<div></div>',
        media: { images: [{ url: 'img1.jpg' }] },
        coverSuggested: 'img1.jpg',
      },
    });
    mockUser = { id: 'u1', role: 'member' };

    renderPage();
    await screen.findByText('Edit Post');

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'New Title' } });
    fireEvent.change(screen.getByPlaceholderText('Paste/edit your HTML or MJML here'), { target: { value: '<p>New</p>' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. welcome, platform, patwua'), { target: { value: 'tag1, tag2' } });

    fireEvent.click(screen.getByText('Preview'));
    const imgButton = await screen.findByTitle('cover option');
    fireEvent.click(imgButton);

    fireEvent.click(screen.getByText('Save draft (local)'));
    expect(localStorage.getItem('editDraft:1')).not.toBeNull();

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Paste/edit your HTML or MJML here'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. welcome, platform, patwua'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Use suggested cover'));

    fireEvent.click(screen.getByText('Restore local draft'));
    expect((screen.getByPlaceholderText('Title') as HTMLInputElement).value).toBe('New Title');
    expect((screen.getByPlaceholderText('Paste/edit your HTML or MJML here') as HTMLTextAreaElement).value).toBe('<p>New</p>');
    expect((screen.getByPlaceholderText('e.g. welcome, platform, patwua') as HTMLInputElement).value).toBe('tag1, tag2');
    expect(screen.getByText((_, el) => el?.textContent === 'Current: img1.jpg')).toBeTruthy();
  });

  it('publishes changes and navigates to post detail', async () => {
    const post = {
      _id: '1',
      slug: 'test-post',
      title: 'Original',
      author: { _id: 'u1' },
    };
    (api.get as any).mockResolvedValue({ data: { post } });
    (api.patch as any).mockResolvedValue({});
    mockUser = { id: 'u1', role: 'member' };

    renderPage();
    await screen.findByText('Edit Post');

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Updated' } });
    fireEvent.change(screen.getByPlaceholderText('Paste/edit your HTML or MJML here'), { target: { value: '<p>Body</p>' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. welcome, platform, patwua'), { target: { value: 'a,b' } });

    fireEvent.click(screen.getByText('Publish changes'));

    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(api.patch).toHaveBeenCalledWith('/posts/1', {
      title: 'Updated',
      content: '<p>Body</p>',
      tags: ['a', 'b'],
    }, { withCredentials: true });
    expect(mockNavigate).toHaveBeenCalledWith('/p/test-post', { replace: true });
  });

  it('blocks access for unauthorized users', async () => {
    const post = {
      _id: '1',
      slug: 'test-post',
      title: 'Original',
      author: { _id: 'owner' },
    };
    (api.get as any).mockResolvedValue({ data: { post } });
    mockUser = { id: 'other', role: 'member' };

    renderPage();

    await screen.findByText(/You don’t have permission to edit this post/);
    expect(screen.queryByText('Edit Post')).toBeNull();
  });
});
