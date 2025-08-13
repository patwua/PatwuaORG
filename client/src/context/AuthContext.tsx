import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type User = {
  id: string
  email: string
  role: string
  handle?: string
  displayName?: string
  avatar?: string | null
  avatarUrl?: string | null
}

type Ctx = {
  user: User | null
  setUser: (u: User | null) => void
  logout: () => void
}

const AuthCtx = createContext<Ctx>({
  user: null,
  setUser: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Rehydrate on load
  useEffect(() => {
    const raw = localStorage.getItem('authUser')
    if (raw) {
      try { setUser(JSON.parse(raw)) } catch {}
    }
  }, [])

  // Persist user changes
  useEffect(() => {
    if (user) localStorage.setItem('authUser', JSON.stringify(user))
    else localStorage.removeItem('authUser')
  }, [user])

  function logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    setUser(null)
  }

  const value = useMemo(() => ({ user, setUser, logout }), [user])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
