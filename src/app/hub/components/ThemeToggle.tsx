'use client'

import { Sun, Moon } from 'lucide-react'

import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
      aria-label="切換主題"
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-foreground-muted" />
      ) : (
        <Moon size={18} className="text-foreground-muted" />
      )}
    </button>
  )
}
