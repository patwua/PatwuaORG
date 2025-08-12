import { createContext, useContext, useEffect, useState } from 'react'

type User = { id: string; email: string; role: string; displayName?: string; avatar?: string | null; avatarUrl?: string | null }

const AuthCtx = createContext<{ user: User | null; setUser: (u: User | null) => void; logout: () => void }>({
  user: null,
  setUser: () => {},
  logout: () => {},
})
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('authUser')
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {}
    }
  }, [])

  function logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    setUser(null)
  }

  useEffect(() => {
    if (user) localStorage.setItem('authUser', JSON.stringify(user))
  }, [user])

  return <AuthCtx.Provider value={{ user, setUser, logout }}>{children}</AuthCtx.Provider>
}
