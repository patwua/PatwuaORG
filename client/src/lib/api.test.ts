import { describe, it, expect, vi, afterEach } from 'vitest'
import { getPosts, normalizePost } from './api'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('normalizePost', () => {
  it('normalizes fields', () => {
    const now = new Date().toISOString()
    const input = {
      _id: '123',
      title: 'Hello',
      summary: 'Sum',
      image: 'img.png',
      tags: ['a'],
      authorName: 'John',
      authorVerified: true,
      commentCount: '2',
      votes: '5',
      createdAt: now,
      path: '/post/hello',
      slug: 'hello',
      type: 'post',
    }
    const post = normalizePost(input)
    expect(post).toEqual({
      id: '123',
      title: 'Hello',
      excerpt: 'Sum',
      coverUrl: 'img.png',
      tags: ['a'],
      path: '/post/hello',
      slug: 'hello',
      type: 'post',
      author: { name: 'John', verified: true },
      stats: { comments: 2, votes: 5 },
      createdAt: now,
    })
  })
})

describe('getPosts', () => {
  it('calls the posts endpoint with credentials', async () => {
    const mockResponse = { ok: true, json: vi.fn().mockResolvedValue([]) } as any
    const fetchMock = vi.fn().mockResolvedValue(mockResponse)
    globalThis.fetch = fetchMock as any

    await getPosts()

    expect(fetchMock).toHaveBeenCalledWith('/api/posts?status=published', { credentials: 'include' })
  })

  it('throws when response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, text: () => Promise.resolve('bad') } as any)
    globalThis.fetch = fetchMock as any
    await expect(getPosts()).rejects.toThrow('bad')
  })

  it('normalizes returned posts', async () => {
    const data = [{ _id: '1', title: 'Hi', stats: { comments: 1, votes: 2 } }]
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) } as any)
    globalThis.fetch = fetchMock as any

    const result = await getPosts()
    expect(result[0]).toMatchObject({
      id: '1',
      tags: [],
      author: { name: 'Unknown', verified: false },
      stats: { comments: 1, votes: 2 },
    })
  })

  it('supports items array shape', async () => {
    const data = { items: [{ _id: '1', title: 'Hi' }] }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) } as any)
    globalThis.fetch = fetchMock as any

    const result = await getPosts()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})
