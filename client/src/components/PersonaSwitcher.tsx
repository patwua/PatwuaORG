import { usePersona } from '../context/PersonaContext'
import { useAuth } from '../context/AuthContext'

export default function PersonaSwitcher() {
  const { user } = useAuth()
  const { personas, selectedId, setSelectedId, loading } = usePersona()

  // show only to admins (per your plan)
  if (!user || user.role !== 'admin') return null

  return (
    <div className="relative">
      <select
        className="h-9 rounded-full border px-3 bg-white dark:bg-neutral-900"
        value={selectedId || ''}
        onChange={(e) => setSelectedId(e.target.value || null)}
        disabled={loading || personas.length === 0}
        aria-label="Select persona"
      >
        {personas.length === 0 ? (
          <option value="">No personas</option>
        ) : (
          personas.map(p => <option key={p._id} value={p._id}>{p.name}</option>)
        )}
      </select>
    </div>
  )
}
