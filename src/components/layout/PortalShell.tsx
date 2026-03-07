import type { ReactNode } from 'react'

export default function PortalShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: 'var(--background)' }}>
      {children}
    </main>
  )
}
