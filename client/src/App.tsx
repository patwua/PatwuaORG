import { useEffect, useState } from 'react'
import { Moon, SunMedium, PenSquare } from 'lucide-react'
import Search from './components/Search'
import BottomNav from './components/BottomNav'
import PostCard, { type Post } from './components/PostCard'

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
        <Search />
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

