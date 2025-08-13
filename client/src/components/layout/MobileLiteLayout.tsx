import Header from './Header'
import Footer from './Footer'
import BottomNav from '../BottomNav'

export default function MobileLiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-3 py-4">{children}</main>
      <BottomNav />
      <Footer />
    </>
  )
}
