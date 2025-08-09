import { describe, it, expect, vi, afterEach } from 'vitest';
import { getPosts } from './api';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('getPosts', () => {
  it('calls the posts endpoint with credentials', async () => {
    const mockResponse = { ok: true, json: vi.fn().mockResolvedValue([]) } as any;
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    globalThis.fetch = fetchMock as any;

    await getPosts();

    expect(fetchMock).toHaveBeenCalledWith('/api/posts', { credentials: 'include' });
  });

  it('throws when response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false } as any);
    globalThis.fetch = fetchMock as any;

    await expect(getPosts()).rejects.toThrow('Failed to fetch posts');
  });

  it('returns parsed json when response ok', async () => {
    const data = [{ id: 1 }];
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(data) } as any);
    globalThis.fetch = fetchMock as any;

    const result = await getPosts();
    expect(result).toEqual(data);
  });
});
