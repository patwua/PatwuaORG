import Layout from './components/layout/Layout'
import Hero from './components/Hero'
import PostFeed from './components/posts/PostFeed'
import Sidebar from './components/Sidebar'

export default function App() {
  return (
    <Layout>
      <Hero />
      <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8">
        <main className="flex-1">
          <PostFeed />
        </main>
        <aside className="md:w-80 space-y-6">
          <Sidebar />
        </aside>
      </div>
    </Layout>
  )
}
