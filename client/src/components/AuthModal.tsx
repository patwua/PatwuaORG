import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { setUser } = useAuth()

  async function onGoogleSuccess(credentialResponse: any) {
    try {
      const credential = credentialResponse.credential
      const { data } = await api.post('/auth/google', { credential })
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authUser', JSON.stringify(data.user))
      setUser(data.user)
      onClose()
    } catch (e) {
      // handle error
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card w-full max-w-sm p-5 my-8">
          <div className="space-y-3">
            <GoogleLogin onSuccess={onGoogleSuccess} onError={() => {}} />
          </div>
          <button onClick={onClose} className="mt-3 text-sm underline">Close</button>
        </div>
      </div>
    </div>
  )
}
