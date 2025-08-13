import { useEffect, useRef, useState } from 'react'
import { updateMyProfile } from '@/lib/users'
import { useAuth } from '@/context/AuthContext'

export default function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [location, setLocation] = useState(user?.location || '')
  const [links, setLinks] = useState<{ label: string; url: string }[]>(user?.links || [])
  const [saving, setSaving] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function onSave() {
    setSaving(true)
    try {
      const payload = { displayName, avatar, avatarUrl, bio, location, links }
      const { user: updated } = await updateMyProfile(payload)
      localStorage.setItem('authUser', JSON.stringify(updated))
      setUser(updated)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card w-full max-w-sm p-5 my-8 space-y-3" role="dialog" aria-modal="true">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <input ref={firstRef} className="w-full border p-2 rounded" placeholder="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          <input className="w-full border p-2 rounded" placeholder="Avatar" value={avatar} onChange={e => setAvatar(e.target.value)} />
          <input className="w-full border p-2 rounded" placeholder="Avatar URL" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
          <textarea className="w-full border p-2 rounded" placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} />
          <input className="w-full border p-2 rounded" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input className="flex-1 border p-2 rounded" placeholder="Label" value={l.label} onChange={e => {
                  const next=[...links]; next[i]={...next[i], label:e.target.value}; setLinks(next)
                }} />
                <input className="flex-[2] border p-2 rounded" placeholder="URL" value={l.url} onChange={e => {
                  const next=[...links]; next[i]={...next[i], url:e.target.value}; setLinks(next)
                }} />
              </div>
            ))}
            <button className="text-sm underline" onClick={() => setLinks([...links, { label: '', url: '' }])}>Add link</button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1 border rounded" onClick={onClose} aria-label="Cancel">Cancel</button>
            <button className="px-3 py-1 bg-orange-600 text-white rounded" disabled={saving} onClick={onSave} aria-label="Save profile">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
