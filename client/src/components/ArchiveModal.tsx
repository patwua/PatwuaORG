import { useState, useEffect } from 'react'
import { archivePost } from '../lib/api'
import type { Post } from '../types/post'

export default function ArchiveModal({ postId, onClose, onArchived }: { postId: string; onClose: () => void; onArchived?: (p: Post) => void }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => { const t = setTimeout(() => setOpen(true), 0); return () => clearTimeout(t) }, [])

  const words = reason.trim().split(/\s+/).filter(Boolean).length

  async function submit() {
    if (words < 5 || submitting) return
    setSubmitting(true)
    try {
      const { data } = await archivePost(postId, reason)
      onArchived?.(data.post)
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to archive')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`fixed inset-0 z-[100] overflow-y-auto transition-opacity ${open ? 'bg-black/40 opacity-100' : 'bg-black/0 opacity-0'}`}>
      <div className="min-h-full flex items-center justify-center p-4">
        <div className={`card w-full max-w-md p-5 my-8 transform transition-all duration-200 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <h2 className="text-lg font-semibold mb-3">Archive Post</h2>
          <textarea
            className="w-full min-h-[120px] rounded-md border p-2 bg-white dark:bg-neutral-900"
            placeholder="Reason for archiving..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <div className="mt-1 text-xs text-neutral-500">{words} words</div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-md border">Cancel</button>
            <button
              onClick={submit}
              disabled={words < 5 || submitting}
              className="px-3 py-1.5 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
