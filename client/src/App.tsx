import { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Moon, SunMedium, PenSquare, ClipboardCheck } from 'lucide-react'
import AdminReviewModal from './components/AdminReviewModal'
import Search from './components/Search'
import PersonaSwitcher from './components/PersonaSwitcher'
import BottomNav from './components/BottomNav'
import PostCard from './components/PostCard'
import AuthModal from './components/AuthModal'
import PostEditor from './components/PostEditor'
import ProfilePage from './pages/ProfilePage'
import EditProfileModal from './components/EditProfileModal'
import AddPersonaModal from './components/AddPersonaModal'
import { useAuth } from './context/AuthContext'
import { usePersona } from './context/PersonaContext'
import type { Post } from './types/post'
import { getPosts, votePost } from './lib/api'

function Header({ onOpenAuth, onOpenEditor, onOpenReview, onOpenEditProfile, onOpenAddPersona }: { onOpenAuth: () => void; onOpenEditor: () => void; onOpenReview: () => void; onOpenEditProfile: () => void; onOpenAddPersona: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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
        <div className="font-semibold text-lg tracking-tight"><Link to="/">Patwua</Link></div>
        <div className="flex-1" />
        <Search />
        <PersonaSwitcher />
        <button onClick={toggleTheme} className="ml-2 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Toggle theme">
          {dark ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        {user ? (
          <>
            <button onClick={() => navigate(`/u/${user?.slug ?? 'me'}`)} className="text-sm underline hidden sm:inline">Hi, {user.name}</button>
            {user.role === 'admin' && (
              <button onClick={onOpenAddPersona} className="ml-2 px-3 py-1.5 rounded-full border hover:bg-neutral-100 dark:hover:bg-neutral-800">
                Add Persona
              </button>
            )}
            <button onClick={onOpenEditProfile} className="ml-2 px-3 py-1.5 rounded-full border hover:bg-neutral-100 dark:hover:bg-neutral-800">
              Edit Profile
            </button>
            {user.role === 'admin' && (
              <button onClick={onOpenReview} className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Review</span>
              </button>
            )}
            <button onClick={onOpenEditor} className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-600 text-white hover:bg-orange-700">
              <PenSquare className="h-4 w-4" />
              <span className="hidden sm:inline">New Post</span>
            </button>
            <button onClick={logout} className="ml-2 px-3 py-1.5 rounded-full border hover:bg-neutral-100 dark:hover:bg-neutral-800">
              Logout
            </button>
          </>
        ) : (
          <button onClick={onOpenAuth} className="ml-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-600 text-white hover:bg-orange-700">
            <PenSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}
      </div>
    </header>
  )
}


export default function App() {
  usePersona()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showAddPersona, setShowAddPersona] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await getPosts()
        if (alive) setPosts(data)
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load posts')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  async function onVote(id: string, dir: 'up' | 'down') {
    const { votes } = await votePost(id, dir)
    setPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, stats: { ...(p.stats || { comments: 0, votes: 0 }), votes } } : p))
    )
    return votes
  }

  return (
    <div className="min-h-screen text-neutral-900 dark:text-neutral-100">
      <Header onOpenAuth={() => setShowAuth(true)} onOpenEditor={() => setShowEditor(true)} onOpenReview={() => setShowReview(true)} onOpenEditProfile={() => setShowEditProfile(true)} onOpenAddPersona={() => setShowAddPersona(true)} />
      <section className="bg-gradient-to-br from-orange-100 via-amber-50 to-white dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 border-b border-orange-100/70 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Where Every Voice Has a Place</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Join the conversation. Add your perspective. Stay in the loop.</p>
        </div>
      </section>

      <Routes>
        <Route
          path="/"
          element={
            <main className="mx-auto max-w-6xl px-4 pt-4 pb-24 md:pb-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <section className="md:col-span-2 space-y-4 md:space-y-6">
                  {loading && (
                    <div className="card p-6 animate-pulse">
                      <div className="h-5 w-40 bg-neutral-200 dark:bg-neutral-800 rounded mb-3" />
                      <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    </div>
                  )}
                  {error && (
                    <div className="card p-4 border-red-200 text-red-700">
                      <div className="font-semibold mb-1">Couldn’t load posts</div>
                      <div className="text-sm opacity-90">{error}</div>
                    </div>
                  )}
                  {!loading && !error && posts.length === 0 && (
                    <div className="card p-6 text-sm text-neutral-600 dark:text-neutral-300">
                      No posts yet. Be the first to start the conversation.
                    </div>
                  )}
                  {!loading && !error && posts.map(p => <PostCard key={p.id} post={p} onVote={onVote} />)}
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
          }
        />
        <Route path="/u/:slug" element={<ProfilePage />} />
      </Routes>

      <BottomNav />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showEditor && <PostEditor onClose={() => setShowEditor(false)} onCreated={() => { setShowEditor(false); /* optionally refresh list */ }} />}
      {showReview && <AdminReviewModal onClose={() => setShowReview(false)} />}
      {showAddPersona && <AddPersonaModal onClose={() => setShowAddPersona(false)} />}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
    </div>
  )
}

