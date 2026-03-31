'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'

type ThemeMode = 'light' | 'dark'
type ContextType = 'portal' | 'showcase' | 'hub'
type ThemeValue = `${ContextType}-${ThemeMode}`

interface ThemeContextType {
  theme: ThemeValue
  currentMode: ThemeMode
  context: ContextType
  toggleTheme: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getContextFromPath(pathname: string): ContextType {
  if (pathname.startsWith('/portal')) return 'portal'
  if (pathname.startsWith('/showcase')) return 'showcase'
  return 'hub'
}

export function ThemeProvider({
  children,
  defaultMode = 'dark',
  defaultContext,
}: {
  children: ReactNode
  defaultMode?: ThemeMode
  defaultContext?: ContextType
}) {
  const pathname = usePathname()
  const context = getContextFromPath(pathname)
  const [mode, setMode] = useState<ThemeMode>(defaultMode)

  useEffect(() => {
    const saved = localStorage.getItem('williamsagi-mode')
    if (saved === 'light' || saved === 'dark') {
      setMode(saved)
      return
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setMode(prefersDark ? 'dark' : 'light')
  }, [])

  const effectiveMode: ThemeMode = pathname === '/login' ? 'light' : mode
  const theme: ThemeValue = `${context}-${effectiveMode}`

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-context', context)
  }, [theme, context])

  const toggleTheme = useCallback(() => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    localStorage.setItem('williamsagi-mode', next)
  }, [mode])

  const updateMode = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode)
    localStorage.setItem('williamsagi-mode', nextMode)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      currentMode: effectiveMode,
      context,
      toggleTheme,
      setMode: updateMode,
    }),
    [context, effectiveMode, theme, toggleTheme, updateMode]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
