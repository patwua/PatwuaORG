import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicProfile, getUserPersonas } from '../lib/users'
import type { Persona } from '../types/persona'

type PublicUser = { id:string; slug:string; name:string; avatar?:string; bio?:string; location?:string; categories?:string[]; verified?:boolean }

export default function ProfilePage() {
  const { slug = '' } = useParams()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const u = await getPublicProfile(slug)
        const ps = await getUserPersonas(slug)
        if (!alive) return
        setUser(u); setPersonas(ps)
      } catch (e:any) {
        setError(e?.message || 'Failed to load profile')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [slug])

  if (loading) return <div className="mx-auto max-w-3xl p-4">Loading…</div>
  if (error || !user) return <div className="mx-auto max-w-3xl p-4 text-red-600">Profile not found.</div>

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-neutral-200 overflow-hidden">
            {user.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" /> : null}
          </div>
          <div className="flex-1">
            <div className="text-xl font-semibold">{user.name}</div>
            {user.location && <div className="text-sm text-neutral-500">{user.location}</div>}
            {user.categories?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {user.categories.map((c) => <span key={c} className="tag-chip">#{c}</span>)}
              </div>
            ) : null}
          </div>
        </div>
        {user.bio && <p className="mt-4 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{user.bio}</p>}
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-3">Personas</div>
        {personas.length === 0 ? (
          <div className="text-sm text-neutral-500">No personas yet.</div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {personas.map(p => (
              <li key={p._id} className="p-3 border rounded-lg">
                <div className="font-medium">{p.name}</div>
                {p.bio && <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{p.bio}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

