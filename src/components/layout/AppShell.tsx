import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function AppShell({ children, className = '' }: Props) {
  return (
    <main
      className={`min-h-screen bg-[var(--background)] text-[var(--foreground)] ${className}`}
    >
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </main>
  )
}
