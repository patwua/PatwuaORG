import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function HandlePickerModal({ open, onSaved }: { open: boolean; onSaved: () => void }) {
  const { user, setUser } = useAuth()
  const [handle, setHandle] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open && user && !user.handle) {
      setDisplayName(user.displayName || '')
      api.get('/users/handle-suggestion').then(r => setHandle(r.data.suggestion)).catch(() => {})
    }
  }, [open, user])

  if (!open) return null

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      setBusy(true)
      setError(null)
      const { data } = await api.post('/users/handle', { handle, displayName })
      setUser({ ...user, ...data.user })
      onSaved()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={save} className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">
        <h2 className="font-semibold text-lg">Pick a handle</h2>
        <p className="text-sm text-gray-600">Handle is permanent for links and mentions. Display name is cosmetic and changeable.</p>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <input value={handle} onChange={e => setHandle(e.target.value.toLowerCase())} placeholder="handle" className="w-full border px-3 py-2" />
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" className="w-full border px-3 py-2" />
        <button type="submit" disabled={busy} className="px-3 py-1.5 rounded bg-orange-600 text-white w-full">{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </div>
  )
}
