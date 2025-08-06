import Logo from '../common/Logo'
import SearchBar from '../common/SearchBar'
import ThemeToggle from '../common/ThemeToggle'
import AuthButtons from '../common/AuthButtons'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-card shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <SearchBar />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <AuthButtons />
        </div>
      </div>
    </header>
  )
}
