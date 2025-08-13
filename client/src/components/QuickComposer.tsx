import { useState } from 'react'
import { api } from '@/lib/api'
import { usePersona } from '@/context/PersonaContext'

export default function QuickComposer() {
  const { selectedId } = usePersona()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function publish() {
    setBusy(true); setError(null)
    try {
      const payload: any = { title, content: body }
      if (selectedId) payload.personaId = selectedId
      const { data } = await api.post('/posts', payload)
      setOpen(false); setTitle(''); setBody('')
      window.location.href = `/p/${data.post.slug}`
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Publish failed')
    } finally { setBusy(false) }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-red-600 text-white px-5 py-3 shadow-lg"
      >
        Compose
      </button>

      {!open ? null : (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="w-[92vw] max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Quick Compose</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border px-3 py-2"
                placeholder="Title"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="h-40 w-full rounded border px-3 py-2"
                placeholder="Say something… #hashtags work"
              />
            </div>

            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded border px-3 py-2">Cancel</button>
              <button onClick={publish} disabled={!title || !body || busy} className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60">
                {busy ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
