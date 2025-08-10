export type Persona = {
  _id: string
  name: string
  bio?: string
  avatar?: string
  isDefault?: boolean
  ownerUserId?: string
  kind?: 'post' | 'news' | 'vip' | 'ads'
}
