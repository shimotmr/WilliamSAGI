import type { ReactNode } from 'react'
import AppShell from './AppShell'

export default function DashboardShell({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
