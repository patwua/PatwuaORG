
import { useEffect, useState } from 'react'
import type { Post } from '../types/post'
import { listPending, approvePost, rejectPost } from '../lib/review'

export default function AdminReviewModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)           // for fade/scale animation
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [note, setNote] = useState('')

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
  useEffect(() => { const t = setTimeout(() => setOpen(true), 0); return () => clearTimeout(t) }, [])

  async function act(id: string, action: 'approve' | 'reject') {
    try {
      if (action === 'approve') {
        await approvePost(id)
      } else {
        await rejectPost(id, note)
      }
      setItems(prev => prev.filter(p => p.id !== id && (p as any)._id !== id))
      setRejectingId(null); setNote('')
    } catch (e: any) {
      alert(e?.message || 'Action failed')
    }
  }

  return (
    <div className={`fixed inset-0 z-[100] overflow-y-auto transition-opacity ${open ? 'bg-black/40 opacity-100' : 'bg-black/0 opacity-0'}`}>
      <div className="min-h-full flex items-center justify-center p-4">
        <div className={`card w-full max-w-3xl p-5 my-8 transform transition-all duration-200 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
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
                      {rejectingId === id ? (
                        <>
                          <button onClick={() => { setRejectingId(null); setNote('') }} className="px-3 py-1.5 rounded-md border">Cancel</button>
                          <button onClick={() => act(id, 'reject')} className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" disabled={note.trim().length < 3}>
                            Confirm Reject
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setRejectingId(id)} className="px-3 py-1.5 rounded-md border">Reject</button>
                      )}
                      <button onClick={() => act(id, 'approve')} className="px-3 py-1.5 rounded-md bg-orange-600 text-white hover:bg-orange-700">Approve</button>
                    </div>
                  </div>
                  {rejectingId === id && (
                    <div className="mt-3">
                      <label className="text-xs text-neutral-600 dark:text-neutral-300">Moderator note (why rejecting):</label>
                      <textarea
                        className="mt-1 w-full min-h-[80px] rounded-md border p-2 bg-white dark:bg-neutral-900"
                        placeholder="Brief reason or requested changes…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <div className="mt-1 text-xs text-neutral-500">{Math.max(0, 200 - note.length)} chars left</div>
                    </div>
                  )}
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

