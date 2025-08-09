import { useState, useRef, useEffect } from 'react'

export default function Search() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className={`relative transition-all ${open ? 'w-56' : 'w-10'} hidden sm:block`}>
      <button
        aria-label={open ? 'Close search' : 'Open search'}
        onClick={() => setOpen(o => !o)}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {/* simple magnifier icon via SVG to avoid extra deps */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search Patwua"
        className={`w-full pl-9 pr-3 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Search Patwua"
      />
    </div>
  )
}
