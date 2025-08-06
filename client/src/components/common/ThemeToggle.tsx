import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle() {
  const { toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-bg"
      aria-label="Toggle dark mode"
    >
      <img
        src="/yin-yang-icon.svg"
        className="w-5 h-5 dark:invert"
        alt="Theme toggle"
      />
    </button>
  )
}
