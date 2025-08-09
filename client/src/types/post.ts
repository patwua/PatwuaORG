export type Post = {
  id: string
  title: string
  excerpt?: string
  coverUrl?: string
  tags?: string[]
  author?: { name: string; verified?: boolean; avatar?: string }
  stats?: { comments: number; votes: number }
  createdAt?: string // ISO string
}
