import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [saving, setSaving] = useState(false)

  async function onSave() {
    setSaving(true)
    try {
      const payload = { displayName, avatar, avatarUrl }
      const { data } = await api.put('/users/me', payload)
      localStorage.setItem('authUser', JSON.stringify(data.user))
      setUser(data.user)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card w-full max-w-sm p-5 my-8 space-y-3">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <input className="w-full border p-2 rounded" placeholder="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          <input className="w-full border p-2 rounded" placeholder="Avatar" value={avatar} onChange={e => setAvatar(e.target.value)} />
          <input className="w-full border p-2 rounded" placeholder="Avatar URL" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1 border rounded" onClick={onClose}>Cancel</button>
            <button className="px-3 py-1 bg-orange-600 text-white rounded" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
