import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import PostDetailPage from '../PostDetailPage';
import * as api from '../../lib/api';

vi.mock('../../lib/api', () => ({
  getPostBySlug: vi.fn(() => Promise.resolve({ data: { post: { _id: '1', title: 'T', body: '', author: { handle: 'h' }, slug: 's', createdAt: '2024-01-01T00:00:00.000Z' } } })),
  getComments: vi.fn((id: string, params: any = {}) => {
    if (params.page === 2) {
      return Promise.resolve({ data: { items: [{ _id: 'c2', body: 'second', author: {} }], nextPage: null } });
    }
    return Promise.resolve({ data: { items: [{ _id: 'c1', body: 'first', author: {} }], nextPage: 2 } });
  }),
  addComment: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'user' } }),
}));

describe('PostDetailPage SEO and pagination', () => {
  it('inserts canonical/ld+json and loads more comments', async () => {
    const { getByText, queryByText } = render(
      <MemoryRouter initialEntries={['/p/s']}>
        <Routes>
          <Route path="/p/:slug" element={<PostDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => getByText('first'));

    const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(link?.href).toContain('/p/s');
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent || '{}');
    expect(data['@type']).toBe('BlogPosting');

    fireEvent.click(getByText('Load more'));
    await waitFor(() => getByText('second'));
    expect(api.getComments).toHaveBeenCalledWith('1', { page: 2 });
    expect(queryByText('Load more')).toBeNull();
  });
});
