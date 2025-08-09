// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import App from '../../App';

vi.mock('../../lib/api', () => ({
  getPosts: vi.fn().mockResolvedValue([]),
  votePost: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('AuthModal integration', () => {
  it('renders overlay at root covering viewport when triggered', async () => {
    const { container } = render(<App />);

    const signInBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInBtn);

    const closeButton = await screen.findByText('Close');
    const backdrop = closeButton.closest('div[class*="fixed"]') as HTMLDivElement;

    expect(backdrop).toBeTruthy();
    expect(backdrop.classList.contains('fixed')).toBe(true);
    expect(backdrop.className).toContain('inset-0');
    expect(backdrop.className).toContain('z-[100]');

    const header = container.querySelector('header');
    expect(header?.contains(backdrop)).toBe(false);

    const appRoot = container.firstChild as HTMLElement;
    expect(appRoot.lastChild).toBe(backdrop);
  });
});
