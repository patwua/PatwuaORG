import { createContext, useContext, useMemo, useState } from 'react'
import type { User } from '../types/auth'
import { logout as apiLogout } from '@/lib/auth'

type AuthState = {
  user: User | null
  setUser: (u: User | null) => void
  logout: () => Promise<void>
}

const Ctx = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  async function logout() {
    await apiLogout()
    setUser(null)
  }

  const value = useMemo(() => ({ user, setUser, logout }), [user])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
