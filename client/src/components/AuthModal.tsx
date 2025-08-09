import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(name, email, password)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card w-full max-w-sm p-5 my-8">
          <h2 className="text-lg font-semibold mb-3">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input
                className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            )}
            <input
              className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900"
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full h-10 rounded-md border px-3 bg-white dark:bg-neutral-900"
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button disabled={loading} className="w-full h-10 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button className="underline" onClick={() => setMode('register')}>Create one</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button className="underline" onClick={() => setMode('login')}>Sign in</button>
              </>
            )}
          </div>
          <button onClick={onClose} className="mt-3 text-sm underline">Close</button>
        </div>
      </div>
    </div>
  )
}

