import Header from './Header'
import Footer from './Footer'
import { lazy, Suspense } from 'react'

const PostEditorLazy = lazy(() => import('@/components/PostEditor'))

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <Header />
        <main className="flex-1 py-6">{children}</main>
        <Footer />
      </div>
      <Suspense fallback={null}><PostEditorLazy /></Suspense>
    </>
  )
}
