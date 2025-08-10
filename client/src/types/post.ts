export type Post = {
  id?: string
  _id?: string
  title: string
  excerpt?: string
  coverImage?: string
  body?: string
  bodyHtml?: string
  format?: 'richtext' | 'html' | 'mjml'
  tags?: string[]
  personaId?: string
  authorUserId?: string
  status?: 'draft' | 'pending_review' | 'published' | 'active' | 'archived'
  type?: 'post' | 'news' | 'vip' | 'ads'
  slug?: string
  path?: string
  createdAt?: string // ISO string
  stats?: { comments: number; votes: number }
  summaryAI?: string
  media?: { kind: 'image' | 'video'; url: string; alt?: string; width?: number; height?: number; poster?: string }[]
  persona?: { _id: string; name: string; avatar?: string } | null
  author?: { _id?: string; id?: string; name: string; slug?: string; verified?: boolean; avatar?: string; role?: string } | null
}
