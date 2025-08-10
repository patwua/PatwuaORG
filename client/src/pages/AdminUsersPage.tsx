import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Navigate } from 'react-router-dom'

type Row = { _id: string; name?: string; email: string; role: string; createdAt: string }

const ROLE_OPTIONS = [
  'user',
  'moderator',
  'verified_influencer',
  'verified_publisher',
  'advertiser',
  'admin',
  'system_admin',
]

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  if (!user) return <Navigate to="/" replace />

  const isAdmin = user.role === 'admin' || user.role === 'system_admin'
  if (!isAdmin) return <div className="p-4">Forbidden</div>

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/users/admin', { withCredentials: true })
        setRows(data.users)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const updateRole = async (id: string, role: string) => {
    const { data } = await api.patch(`/users/admin/${id}/role`, { role }, { withCredentials: true })
    setRows(prev => prev.map(r => (r._id === id ? { ...r, role: data.user.role } : r)))
  }

  if (loading) return <div className="p-4">Loading users…</div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Users</h1>
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.name || '—'}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <select
                    className="border rounded px-2 py-1"
                    value={u.role}
                    onChange={e => updateRole(u._id, e.target.value)}
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 text-right">
                  <span className="text-xs text-gray-400">—</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
