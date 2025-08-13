import Header from './Header'
import Footer from './Footer'

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      <Footer />
      {/* Desktop: no mobile bottom nav */}
    </>
  )
}
