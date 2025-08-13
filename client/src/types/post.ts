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
  authorUserId?: string
  status?: 'draft' | 'pending_review' | 'published' | 'active' | 'archived'
  type?: 'post' | 'news' | 'vip' | 'ads'
  slug?: string
  path?: string
  createdAt?: string // ISO string
  stats?: { comments: number; votes: number; up?: number; down?: number; myVote?: number }
  summaryAI?: string
  media?: { kind: 'image' | 'video'; url: string; alt?: string; width?: number; height?: number; poster?: string }[]
  author?: { _id?: string; id?: string; displayName?: string; handle?: string; avatar?: string; role?: string; verified?: boolean } | null
}
