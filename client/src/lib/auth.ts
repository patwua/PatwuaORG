import { api } from './api'

export async function googleLogin(credential: string) {
  const { data } = await api.post('/auth/google', { credential }, { withCredentials: true })
  return data.user as { id: string; email: string; name: string; image?: string; role: string }
}

export async function logout() {
  await api.post('/auth/logout', {}, { withCredentials: true })
}
