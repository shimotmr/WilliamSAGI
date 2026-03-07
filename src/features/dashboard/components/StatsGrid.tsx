'use client'

import Card from '@/components/ui/Card'
import type { DashboardData } from '../types'

interface Props {
  data: DashboardData
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub: string
}) {
  return (
    <Card className="rounded-2xl p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </div>
      <div className="mt-2 text-xs text-[var(--foreground-muted)]">
        {sub}
      </div>
    </Card>
  )
}

export default function StatsGrid({ data }: Props) {
  const pending = data.statusCounts['待執行'] ?? 0
  const running = data.statusCounts['執行中'] ?? 0
  const completed = data.statusCounts['已完成'] ?? 0

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="待執行" value={pending} sub={`共 ${data.totalTasks} 個任務`} />
      <StatCard label="執行中" value={running} sub="Agent 作業中" />
      <StatCard label="已完成" value={completed} sub={`本週 +${data.weekCompleted}`} />
      <StatCard label="完成率" value={`${data.completionRate}%`} sub="歷史統計" />
    </div>
  )
}
