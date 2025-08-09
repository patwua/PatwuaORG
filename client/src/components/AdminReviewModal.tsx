
import { useEffect, useState } from 'react'
import type { Post } from '../types/post'
import { listPending, approvePost, rejectPost } from '../lib/review'

export default function AdminReviewModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setError(null); setLoading(true)
    try {
      const data = await listPending()
      setItems(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function act(id: string, action: 'approve' | 'reject') {
    try {
      if (action === 'approve') await approvePost(id)
      else await rejectPost(id)
      setItems(prev => prev.filter(p => p.id !== id && (p as any)._id !== id))
    } catch (e: any) {
      alert(e?.message || 'Action failed')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card w-full max-w-3xl p-5 my-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Review queue</h2>
            <button onClick={onClose} className="text-sm underline">Close</button>
          </div>

          {loading && <div className="text-sm opacity-70">Loading…</div>}
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="text-sm opacity-70">No posts pending review.</div>
          )}

          <ul className="space-y-3">
            {items.map(p => {
              const id = (p as any)._id ?? p.id
              return (
                <li key={id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-neutral-500">
                        Tags: {(p.tags || []).join(', ') || '—'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => act(id, 'reject')} className="px-3 py-1.5 rounded-md border">Reject</button>
                      <button onClick={() => act(id, 'approve')} className="px-3 py-1.5 rounded-md bg-orange-600 text-white hover:bg-orange-700">Approve</button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-4">
            <button onClick={refresh} className="text-sm underline">Refresh</button>
          </div>
        </div>
      </div>
    </div>
  )
}

