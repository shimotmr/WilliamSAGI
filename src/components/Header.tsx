'use client'

import { Sun, Moon, Newspaper, LayoutDashboard, Network, Shield, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { AuthButton } from './AuthButton'
import { useAuth } from './AuthProvider'
import { useTheme } from './ThemeProvider'
import { TravisAvatar } from './TravisAvatar'

const navItems = [
  { href: '/', icon: Newspaper, label: 'Feed' },
  { href: '/architecture', icon: Network, label: 'Architecture' },
  { href: '/meeting', icon: Users, label: 'Meeting' },
  { href: '/private', icon: Lock, label: 'Private' },
]

export function Header() {
  const { theme, toggle } = useTheme()
  const { role, pendingCount } = useAuth()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      {/* Row 1: Brand bar */}
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <TravisAvatar size="sm" />
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Travis Daily
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <AuthButton />
        </div>
      </div>

      {/* Row 2: Sub-nav */}
      <div className="max-w-2xl mx-auto px-4 border-t border-border/50">
        <nav className="flex items-center gap-1 h-10 overflow-x-auto scrollbar-hide">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
          {role === 'owner' && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors relative ${
                pathname === '/admin'
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Shield size={15} />
              Admin
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
