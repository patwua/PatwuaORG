import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function AdminQuickLinks() {
  const { user } = useAuth()
  const canPostHtml = !!user && (
    user.role === 'system_admin' ||
    user.role === 'admin' ||
    user.role === 'verified_publisher' ||
    user.role === 'verified_influencer' ||
    user.role === 'advertiser'
  )

  if (!canPostHtml) return null

  return (
    <Link
      to="/admin/new-html"
      className="ml-2 rounded-full bg-red-600 text-white px-3 py-2 text-sm"
    >
      New HTML/MJML
    </Link>
  )
}
