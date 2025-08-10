import { GoogleLogin } from '@react-oauth/google'
import jwt_decode from 'jwt-decode'
import { googleLogin } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'

type GoogleJwt = { email?: string; name?: string; picture?: string; sub: string }

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { setUser } = useAuth()

  const onSuccess = async (credResp: any) => {
    try {
      const credential = credResp?.credential as string
      if (!credential) return
      // optional local decode for UX, server still verifies
      jwt_decode<GoogleJwt>(credential)
      const user = await googleLogin(credential)
      setUser(user)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  const onError = () => {
    // handle error if needed
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card w-full max-w-sm p-5 my-8">
          <div className="space-y-3">
            <GoogleLogin onSuccess={onSuccess} onError={onError} />
          </div>
          <button onClick={onClose} className="mt-3 text-sm underline">Close</button>
        </div>
      </div>
    </div>
  )
}
