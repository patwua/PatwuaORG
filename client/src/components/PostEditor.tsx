import { useEffect, useState } from 'react'
import { usePersona } from '../context/PersonaContext'
import { useAuth } from '../context/AuthContext'
import { createPost } from '../lib/api'

export default function PostEditor({ onClose, onCreated }: { onClose: () => void; onCreated: (p: any) => void }) {
  const { user } = useAuth()
  const { personas, selectedId } = usePersona()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState<string>('')
  const [personaId, setPersonaId] = useState<string | ''>(selectedId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!personaId && selectedId) setPersonaId(selectedId)
  }, [selectedId, personaId])

  async function submit(action: 'publish' | 'submit' | 'draft') {
    setError(null); setLoading(true)
    try {
      const payload = {
        title, body,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        personaId: personaId || '',
        action: action === 'draft' ? undefined : action
      }
      const post = await createPost(payload as any)
      onCreated(post)
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Failed to save post')
    } finally {
      setLoading(false)
    }
  }

  const canPublish = user?.role === 'admin'

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card w-full max-w-2xl p-5 my-8">
          <h2 className="text-lg font-semibold mb-3">New post</h2>

          <div className="mb-3 text-sm text-neutral-600 dark:text-neutral-300">
            Posting as:
            <select
              className="ml-2 h-9 rounded-full border px-3 bg-white dark:bg-neutral-900"
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
            >
              <option value="" disabled>Select persona…</option>
              {personas.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <span className="ml-3 opacity-70">by {user?.name}</span>
          </div>

          <input
            className="w-full h-11 rounded-md border px-3 bg-white dark:bg-neutral-900 mb-3"
            placeholder="Post title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <textarea
            className="w-full min-h-[180px] rounded-md border p-3 bg-white dark:bg-neutral-900 mb-3"
            placeholder="Write your post…"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <input
            className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900 mb-2"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />

          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

          <div className="flex items-center justify-end gap-2">
            <button className="px-3 py-2 rounded-md border" onClick={onClose}>Cancel</button>
            <button disabled={loading} onClick={() => submit('draft')} className="px-3 py-2 rounded-md border disabled:opacity-50">Save draft</button>
            {!canPublish && (
              <button disabled={loading || !personaId} onClick={() => submit('submit')} className="px-3 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">
                Submit for review
              </button>
            )}
            {canPublish && (
              <button disabled={loading || !personaId} onClick={() => submit('publish')} className="px-3 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">
                Publish now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
