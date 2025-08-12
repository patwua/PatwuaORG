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
  const { logout } = useAuth()
  return (
    <button onClick={logout} className="text-sm text-gray-700">
      Logout
    </button>
  )
}
