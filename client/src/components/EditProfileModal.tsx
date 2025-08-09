import { useEffect, useState } from 'react'
import { getMyProfile, updateMyProfile } from '../lib/users'
import { uploadImage, avatarUrl } from '../lib/upload'

export default function EditProfileModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name:'', avatar:'', bio:'', location:'', categories:'', slug:'' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setForm(f => ({ ...f, avatar: url }))
    } catch (err: any) {
      setError(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const me = await getMyProfile()
        setForm({
          name: me.name || '',
          avatar: me.avatar || '',
          bio: me.bio || '',
          location: me.location || '',
          categories: (me.categories || []).join(', '),
          slug: me.slug || ''
        })
      } catch (e:any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function save() {
    setSaving(true); setError(null)
    try {
      const payload = {
        name: form.name,
        avatar: form.avatar,
        bio: form.bio,
        location: form.location,
        categories: form.categories.split(',').map(s => s.trim()).filter(Boolean),
        slug: form.slug
      }
      await updateMyProfile(payload)
      onClose()
    } catch (e:any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="fixed inset-0 z-[100] bg-black/40"><div className="min-h-full flex items-center justify-center">Loading…</div></div>

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card w-full max-w-lg p-5 my-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Edit profile</h2>
            <button onClick={onClose} className="text-sm underline">Close</button>
          </div>

          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

          {/* avatar preview + picker */}
          <div className="mb-2 flex items-center gap-3">
            <div className="h-14 w-14 rounded-full overflow-hidden bg-neutral-200">
              {form.avatar ? <img src={avatarUrl(form.avatar)} alt="avatar" className="h-full w-full object-cover" /> : null}
            </div>
            <label className="text-sm inline-flex items-center gap-2 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              <span className="px-3 py-1.5 rounded-md border">{uploading ? 'Uploading…' : 'Upload avatar'}</span>
            </label>
          </div>

          <div className="space-y-3">
            <input className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900" placeholder="Name" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} />
            <input className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900" placeholder="Public slug (username in URL)" value={form.slug} onChange={e => setForm(f => ({...f, slug:e.target.value}))} />
            <input className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900" placeholder="Avatar URL" value={form.avatar} onChange={e => setForm(f => ({...f, avatar:e.target.value}))} />
            <input className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900" placeholder="Location" value={form.location} onChange={e => setForm(f => ({...f, location:e.target.value}))} />
            <input className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900" placeholder="Categories (comma separated)" value={form.categories} onChange={e => setForm(f => ({...f, categories:e.target.value}))} />
            <textarea className="w-full min-h-[120px] rounded-md border p-3 bg-white dark:bg-neutral-900" placeholder="Bio" value={form.bio} onChange={e => setForm(f => ({...f, bio:e.target.value}))} />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button className="px-3 py-2 rounded-md border" onClick={onClose}>Cancel</button>
            <button disabled={saving} className="px-3 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50" onClick={save}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

