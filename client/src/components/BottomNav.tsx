import { Home, Tag, Bell, PencilLine } from 'lucide-react'

export default function BottomNav() {
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

