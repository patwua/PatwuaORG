import { useVariant } from '../../context/VariantContext'

export default function VariantToggle() {
  const { actual, setting, toggleLite, setSetting } = useVariant()
  const onClick = () => toggleLite()

  // Optional long-press to cycle modes (desktop -> auto -> mobile-lite)
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setSetting(setting === 'desktop' ? 'auto' : setting === 'auto' ? 'mobile-lite' : 'desktop')
  }

  const label = actual === 'mobile-lite' ? 'Lite' : 'Full'
  return (
    <button
      title={`Mode: ${label} (right-click to cycle modes)`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="ml-2 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <span>{label}</span>
    </button>
  )
}
