'use client'

import type { User, Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase-client'

export type UserRole = 'owner' | 'member' | 'pending' | null

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole
  loading: boolean
  pendingCount: number
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  pendingCount: 0,
  signInWithGitHub: async () => {},
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const supabase = createClient()

  const syncUser = async () => {
    try {
      const res = await fetch('/api/user/sync', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setRole(data.role)
      }
    } catch (e) {}
  }

  const fetchPendingCount = async () => {
    try {
      const res = await fetch('/api/admin/pending-count')
      if (res.ok) {
        const data = await res.json()
        setPendingCount(data.count)
      }
    } catch (e) {}
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        syncUser().then(fetchPendingCount)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        syncUser().then(fetchPendingCount)
      } else {
        setRole(null)
        setPendingCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setRole(null)
    setPendingCount(0)
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, pendingCount, signInWithGitHub, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
