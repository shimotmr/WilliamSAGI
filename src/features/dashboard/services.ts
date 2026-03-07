import type { DashboardData } from './types'

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch('/api/hub/dashboard', {
    method: 'GET',
    cache: 'no-store',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load dashboard')
  }

  return data as DashboardData
}
