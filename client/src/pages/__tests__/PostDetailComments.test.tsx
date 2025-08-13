import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import PostDetailPage from '../PostDetailPage';
import * as api from '../../lib/api';

vi.mock('../../lib/api', () => ({
  getPostBySlug: vi.fn(() => Promise.resolve({ data: { post: { _id: '1', title: 'T', body: '', author: {}, slug: 's' } } })),
  getComments: vi.fn(() => Promise.resolve({ data: { items: [] } })),
  addComment: vi.fn(() => Promise.resolve({ data: { comment: { _id: 'c1', body: 'hi', author: { displayName: 'me' } } } })),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'user' } }),
}));

describe('PostDetailPage comments', () => {
  it('shows comment box and posts new comment', async () => {
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/p/s#comments']}>
        <Routes>
          <Route path="/p/:slug" element={<PostDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => getByPlaceholderText('Add a comment...'));
    fireEvent.change(getByPlaceholderText('Add a comment...'), { target: { value: 'hi' } });
    fireEvent.click(getByText('Comment'));
    await waitFor(() => getByText('hi'));
    expect(api.addComment).toHaveBeenCalled();
  });
});
