import { logout } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'

export default function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <button className="text-sm text-primary">Sign in</button>
      <button className="text-sm bg-primary text-white px-3 py-1 rounded">Sign up</button>
    </div>
  )
}

export function LogoutButton() {
  const { setUser } = useAuth()
  return (
    <button
      onClick={async () => {
        await logout()
        setUser(null)
      }}
      className="text-sm text-gray-700"
    >
      Logout
    </button>
  )
}
