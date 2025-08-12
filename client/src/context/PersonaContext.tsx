import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Persona } from '../types/persona'
import { listPersonas } from '../lib/persona'
import { useAuth } from './AuthContext'

type PersonaState = {
  personas: Persona[]
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  loading: boolean
  reload: () => Promise<void>
}

const Ctx = createContext<PersonaState | undefined>(undefined)
const KEY = 'patwua-selected-persona'

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(localStorage.getItem(KEY))
  const [loading, setLoading] = useState(false)

  async function load() {
    if (!user) {
      setPersonas([])
      return
    }
    setLoading(true)
    try {
      const items = await listPersonas() // returns a raw array
      setPersonas(items)
      if (!selectedId) {
        const def = items.find(p => (p as any).isDefault) || items[0]
        if (def && (def as any)._id) {
          setSelectedId((def as any)._id)
          localStorage.setItem(KEY, (def as any)._id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!alive) return
      await load()
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const value = useMemo(
    () => ({
      personas,
      selectedId,
      setSelectedId: (id: string | null) => {
        setSelectedId(id)
        if (id) localStorage.setItem(KEY, id)
        else localStorage.removeItem(KEY)
      },
      loading,
      reload: load,
    }),
    [personas, selectedId, loading],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePersona() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePersona must be used within PersonaProvider')
  return v
}

