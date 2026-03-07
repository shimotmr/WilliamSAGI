'use client'

import { useEffect, useMemo, useState } from 'react'
import PortalHeader from '@/features/portal/components/PortalHeader'
import PortalHero from '@/features/portal/components/PortalHero'
import PortalModuleGrid from '@/features/portal/components/PortalModuleGrid'
import { usePortalUser } from '@/features/portal/hooks/usePortalUser'
import { getVisiblePortalMenuItems } from '@/features/portal/services/menu'
import PortalShell from '@/components/layout/PortalShell'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早安'
  if (hour < 18) return '午安'
  return '晚安'
}

export default function PortalPage() {
  const user = usePortalUser()
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement
    const theme = root.getAttribute('data-theme') || 'portal-light'
    setMode(theme.endsWith('-dark') ? 'dark' : 'light')
  }, [])

  const greeting = useMemo(() => getGreeting(), [])
  const visibleItems = useMemo(() => getVisiblePortalMenuItems(user.isAdmin), [user.isAdmin])

  return (
    <PortalShell>
      <PortalHeader />
      <PortalHero greeting={greeting} displayName={user.displayName} />
      <PortalModuleGrid items={visibleItems} mode={mode} />

      <footer className="py-6 text-center text-xs md:text-sm" style={{ color: 'var(--foreground-muted)' }}>
        Aurotek Sales Portal • Powered by Jarvis 🤖
      </footer>
    </PortalShell>
  )
}
