import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProfilePage from '../ProfilePage';

beforeEach(() => {
  global.fetch = vi.fn((url: RequestInfo) => {
    const u = String(url);
    if (u.includes('/by-handle/') && !u.endsWith('/counts')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: { id:'1', handle:'alice', displayName:'Alice', createdAt:new Date().toISOString(), links:[] } }) }) as any;
    if (u.endsWith('/counts')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ posts:0, comments:0, upvotes:0 }) }) as any;
    if (u.includes('/api/posts')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }) as any;
    if (u.includes('/api/comments')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ items:[], nextPage:null, total:0 }) }) as any;
    if (u.includes('/media')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ items:[], nextPage:null, total:0 }) }) as any;
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }) as any;
  });
});

describe('ProfilePage', () => {
  it('renders tabs and switches', async () => {
    render(
      <MemoryRouter initialEntries={[ '/@alice' ]}>
        <Routes>
          <Route path="/@:handle" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );
    const postsTab = await screen.findByRole('tab', { name: /Posts/i });
    expect(postsTab).toBeInTheDocument();
    const commentsTab = screen.getByRole('tab', { name: /Comments/i });
    fireEvent.click(commentsTab);
    expect(commentsTab.getAttribute('aria-selected')).toBe('true');
  });
});
