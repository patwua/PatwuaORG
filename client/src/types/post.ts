export type Post = {
  id?: string
  _id?: string
  title: string
  excerpt?: string
  coverUrl?: string
  body?: string
  tags?: string[]
  personaId?: string
  authorUserId?: string
  status?: 'draft' | 'pending_review' | 'published'
  type?: 'post' | 'news' | 'vip' | 'ads'
  slug?: string
  path?: string
  createdAt?: string // ISO string
  stats?: { comments: number; votes: number }
  persona?: { _id: string; name: string; avatar?: string } | null
  author?: { _id: string; name: string; slug?: string; verified?: boolean; avatar?: string } | null
}
