import Layout from './components/layout/Layout'
import Hero from './components/Hero'
import PostCard from './components/PostCard'

export default function App() {
  return (
    <Layout>
      <Hero />
      <div className="container py-6">
        <div className="max-w-2xl mx-auto">
          <PostCard />
          <PostCard />
          <PostCard />
        </div>
      </div>
    </Layout>
  )
}
