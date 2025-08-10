import { useState } from 'react'
import { createPersona } from '../lib/persona'
import { usePersona } from '../context/PersonaContext'
import { uploadImage, avatarUrl } from '../lib/upload'

export default function AddPersonaModal({ onClose }: { onClose: () => void }) {
  const { reload, setSelectedId } = usePersona()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [kind, setKind] = useState<'post'|'news'|'vip'|'ads'>('post')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, 'patwua/personas')
      setAvatar(url)
    } catch (err: any) {
      setError(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function save() {
    setSaving(true); setError(null)
    try {
      const p = await createPersona({ name, bio, avatar, isDefault, kind })
      await reload()
      setSelectedId(p._id)
      onClose()
    } catch (e: any) {
      const msg = String(e?.message || '')
      setError(msg.includes('409') || msg.toLowerCase().includes('exists') ? 'Persona name already exists' : 'Failed to create persona')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card w-full max-w-md p-5 my-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Add persona</h2>
            <button onClick={onClose} className="text-sm underline">Close</button>
          </div>
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <input className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900 mb-2" placeholder="Persona name (must be unique)" value={name} onChange={e => setName(e.target.value)} />
          <div className="mb-2 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-200">
              {avatar ? <img src={avatarUrl(avatar)} alt="persona" className="h-full w-full object-cover" /> : null}
            </div>
            <label className="text-sm inline-flex items-center gap-2 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              <span className="px-3 py-1.5 rounded-md border">{uploading ? 'Uploading…' : 'Upload avatar'}</span>
            </label>
          </div>
          <input className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900 mb-2" placeholder="Avatar URL (optional)" value={avatar} onChange={e => setAvatar(e.target.value)} />
          <textarea className="w-full min-h-[100px] rounded-md border p-3 bg-white dark:bg-neutral-900 mb-2" placeholder="Short bio (optional)" value={bio} onChange={e => setBio(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
            Make this my default persona
          </label>
          <div className="mt-2">
            <label className="text-sm">Persona type</label>
            <select
              className="ml-2 h-9 rounded-md border px-2 bg-white dark:bg-neutral-900"
              value={kind}
              onChange={e => setKind(e.target.value as any)}
            >
              <option value="post">Regular</option>
              <option value="news">Publisher / News</option>
              <option value="vip">VIP / Influencer</option>
              <option value="ads">Advertiser</option>
            </select>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button className="px-3 py-2 rounded-md border" onClick={onClose}>Cancel</button>
            <button disabled={saving || name.trim().length < 2} className="px-3 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50" onClick={save}>
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
