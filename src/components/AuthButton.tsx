'use client'

import { LogIn, LogOut } from 'lucide-react'

import { useAuth } from './AuthProvider'

export function AuthButton() {
  const { user, loading, signInWithGitHub, signOut } = useAuth()

  if (loading) return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />

  if (user) {
    const avatar = user.user_metadata?.avatar_url
    const name = user.user_metadata?.user_name || user.email
    return (
      <div className="flex items-center gap-1">
        {avatar && (
          <img src={avatar} alt={name} className="w-7 h-7 rounded-full" />
        )}
        <button
          onClick={() => signOut()}
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signInWithGitHub()}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
    >
      <LogIn size={14} />
      <span>Login</span>
    </button>
  )
}
