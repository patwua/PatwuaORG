import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Persona } from '../types/persona'
import { listPersonas } from '../lib/persona'
import { useAuth } from './AuthContext'

type PersonaState = {
  personas: Persona[]
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  loading: boolean
}
const Ctx = createContext<PersonaState | undefined>(undefined)
const KEY = 'patwua-selected-persona'

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(localStorage.getItem(KEY))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    async function load() {
      if (!user) { setPersonas([]); return }
      setLoading(true)
      try {
        const items = await listPersonas()
        if (!alive) return
        setPersonas(items)
        // if no selection, try default persona
        if (!selectedId) {
          const def = items.find(p => p.isDefault) || items[0]
          if (def) {
            setSelectedId(def._id)
            localStorage.setItem(KEY, def._id)
          }
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [user])

  const value = useMemo(() => ({
    personas,
    selectedId,
    setSelectedId: (id: string | null) => {
      setSelectedId(id)
      if (id) localStorage.setItem(KEY, id); else localStorage.removeItem(KEY)
    },
    loading
  }), [personas, selectedId, loading])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePersona() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePersona must be used within PersonaProvider')
  return v
}
