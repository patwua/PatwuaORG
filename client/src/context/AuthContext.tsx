import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '../types/auth'
import { clearToken, getToken, login as apiLogin, register as apiRegister, saveToken } from '../lib/auth'

type AuthState = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // optionally decode token to prefill user; for now just mark as not loading
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const { token, user } = await apiLogin(email, password)
    saveToken(token)
    setUser(user)
  }

  async function register(name: string, email: string, password: string) {
    await apiRegister(name, email, password)
    await login(email, password)
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}

