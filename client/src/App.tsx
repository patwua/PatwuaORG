import { useEffect, useState } from 'react'
import { Moon, SunMedium, PenSquare, Home, Tag, Bell, PencilLine, CheckCheck, ArrowBigUp, ArrowBigDown, MessageSquareText, Bookmark, Share2 } from 'lucide-react'

type Post = {
  id: string
  title: string
  excerpt?: string
  coverUrl?: string
  tags?: string[]
  author?: { name: string; verified?: boolean }
  stats?: { comments: number; votes: number }
  createdAt?: string
}

function Header() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const saved = localStorage.getItem('patwua-theme')
    const isDark = saved ? saved === 'dark' : root.classList.contains('dark')
    root.classList.toggle('dark', isDark)
    setDark(isDark)
  }, [])
  function toggleTheme() {
    const root = document.documentElement
    const next = !dark
    root.classList.toggle('dark', next)
    localStorage.setItem('patwua-theme', next ? 'dark' : 'light')
    setDark(next)
  }
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-neutral-900/70 border-b border-neutral-200/60 dark:border-neutral-800">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
        <div className="font-semibold text-lg tracking-tight">Patwua</div>
        <div className="flex-1" />
        <button onClick={toggleTheme} className="ml-2 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Toggle theme">
          {dark ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <a href="#" className="ml-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-600 text-white hover:bg-orange-700">
          <PenSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Post</span>
        </a>
      </div>
    </header>
  )
}

function BottomNav() {
  const pathname = window.location.pathname
  const items = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/topics', icon: Tag, label: 'Topics' },
    { href: '/post/new', icon: PencilLine, label: 'Post' },
    { href: '/notifications', icon: Bell, label: 'Alerts' },
  ]
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 safe-bottom border-t border-neutral-200/60 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/90 backdrop-blur z-40">
      <ul className="grid grid-cols-4">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href}>
              <a href={href} aria-current={active ? 'page' : undefined} className="flex flex-col items-center py-2 text-xs">
                <Icon className={`h-6 w-6 ${active ? 'text-orange-600' : 'text-neutral-500'}`} />
                <span className={`${active ? 'text-orange-700' : 'text-neutral-500'}`}>{label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function TagChips({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <a key={tag} href={`/tag/${encodeURIComponent(tag)}`} className="tag-chip">#{tag}</a>
      ))}
    </div>
  )
}

function PostCard({ post }: { post: Post }) {
  const [relative, setRelative] = useState<string>('just now')
  useEffect(() => {
    if (!post.createdAt) return
    const then = new Date(post.createdAt)
    const fmt = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    const diffMs = Date.now() - then.getTime()
    const diffMin = Math.round(diffMs / 60000)
    const abs = Math.abs(diffMin)
    if (abs < 60) setRelative(fmt.format(-diffMin, 'minute'))
    else if (abs < 60 * 24) setRelative(fmt.format(-Math.round(diffMin / 60), 'hour'))
    else setRelative(fmt.format(-Math.round(diffMin / (60 * 24)), 'day'))
  }, [post.createdAt])

  return (
    <article className="card card-hover overflow-hidden">
      <div className="p-4 md:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-neutral-200" />
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <span>{post.author?.name ?? 'Unknown'}</span>
              {post.author?.verified && <CheckCheck className="h-4 w-4 text-emerald-500" />}
            </div>
            <div className="text-xs text-neutral-500"><time dateTime={post.createdAt ?? ''}>{relative}</time></div>
          </div>
          <div className="ml-auto inline-flex gap-1 text-neutral-500">
            <button className="p-2 hover:text-orange-700" aria-label="save"><Bookmark className="h-5 w-5" /></button>
            <button className="p-2 hover:text-orange-700" aria-label="share"><Share2 className="h-5 w-5" /></button>
          </div>
        </div>

        <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-2">{post.title}</h2>
        {post.excerpt && <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">AI · {post.excerpt}</p>}

        <TagChips tags={post.tags} />

        <div className="mt-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 dark:border-neutral-800">
            <button className="px-3 py-1.5 hover:text-orange-700"><ArrowBigUp className="h-5 w-5" /></button>
            <span className="px-2 text-sm min-w-[2ch] text-center">{post.stats?.votes ?? 0}</span>
            <button className="px-3 py-1.5 hover:text-orange-700"><ArrowBigDown className="h-5 w-5" /></button>
          </div>
          <a href="#comments" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-orange-700">
            <MessageSquareText className="h-4 w-4" />
            <span>{post.stats?.comments ?? 0} comments</span>
          </a>
        </div>
      </div>
    </article>
  )
}

export default function App() {
  const [posts] = useState<Post[]>([
    {
      id: '1',
      title: 'President Ali launches Clean Energy Initiative',
      excerpt: 'A quick summary of the initiative and expected outcomes across regions 1–10...',
      tags: ['Guyana', 'GreenEnergy'],
      author: { name: 'WaterNews', verified: true },
      stats: { comments: 23, votes: 128 },
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Guyanese Artists Win Big at Caribbean Awards',
      excerpt: 'Highlights from the ceremony and who to watch next season...',
      tags: ['Culture', 'Awards'],
      author: { name: 'WaterNews', verified: true },
      stats: { comments: 8, votes: 67 },
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
    },
  ])

  return (
    <div className="min-h-screen text-neutral-900 dark:text-neutral-100">
      <Header />
      <section className="bg-gradient-to-br from-orange-100 via-amber-50 to-white dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border-b border-orange-100/70 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Where Every Voice Has a Place</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Join the conversation. Add your perspective. Stay in the loop.</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pt-4 pb-24 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <section className="md:col-span-2 space-y-4 md:space-y-6">
            {posts.map(p => <PostCard key={p.id} post={p} />)}
          </section>
          <aside className="md:sticky md:top-20 md:h-[calc(100vh-6rem)] md:overflow-auto space-y-4 md:space-y-6">
            <div className="card card-hover p-4 md:p-5">
              <h3 className="font-semibold mb-3">Trending</h3>
              <ul className="space-y-2">
                {['Guyana', 'Energy', 'Culture'].map((t, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <a href={`/tag/${t.toLowerCase()}`} className="text-sm hover:text-orange-700">#{t}</a>
                    <span className="text-xs text-neutral-500">{(i+1)*42}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card card-hover p-4 md:p-5">
              <h3 className="font-semibold mb-3">Latest comments</h3>
              <ul className="space-y-3">
                {['Aisha on Power', 'Devon on Policy', 'Maya on Roads'].map((t, i) => (
                  <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300">{t}</li>
                ))}
              </ul>
            </div>

            <div className="card card-hover p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500" />
                <div>
                  <div className="font-semibold">WaterNews</div>
                  <div className="text-xs text-neutral-500">Verified Publisher</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">Curating Guyana headlines for Patwua.</p>
            </div>
          </aside>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

