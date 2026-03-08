'use client'

import { useEffect, useState } from 'react'
import StatsGrid from '@/features/dashboard/components/StatsGrid'
import TokenTrendCard from '@/features/dashboard/components/TokenTrendCard'
import AgentStatusGrid from '@/features/dashboard/components/AgentStatusGrid'
import TaskLists from '@/features/dashboard/components/TaskLists'
import { fetchDashboardData } from '@/features/dashboard/services'
import type { DashboardData } from '@/features/dashboard/types'
import SectionCard from '@/components/ui/SectionCard'
import PageHeader from '@/components/ui/PageHeader'
import DashboardShell from '@/components/layout/DashboardShell'
import TeslaVehicleWidget from '@/features/dashboard/components/TeslaVehicleWidget'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const result = await fetchDashboardData()
        if (!mounted) return
        setData(result)
        setLastUpdated(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }))
        setError('')
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : '載入失敗')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 30000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  return (
    <DashboardShell>
      <PageHeader
        title="Clawd Dashboard"
        description="系統即時監控 · Agent 作業中心"
        backHref="/hub"
        backLabel="Hub"
        rightSlot={
          <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              系統正常
            </span>
            <span>更新時間 {lastUpdated}</span>
          </div>
        }
      />

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center text-sm text-[var(--foreground-muted)]">載入中…</div>
      ) : error || !data ? (
        <SectionCard title="載入失敗">
          <div className="text-sm text-red-600">{error || '無法載入 Dashboard'}</div>
        </SectionCard>
      ) : (
        <div className="space-y-4">
          <StatsGrid data={data} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
            <SectionCard title="系統概況">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">總任務</span>
                  <span className="font-medium text-[var(--foreground)]">{data.totalTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">Agent 數量</span>
                  <span className="font-medium text-[var(--foreground)]">{data.agents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">本週完成</span>
                  <span className="font-medium text-[var(--foreground)]">{data.weekCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">完成率</span>
                  <span className="font-medium text-[var(--foreground)]">{data.completionRate}%</span>
                </div>
              </div>
            </SectionCard>

            <TokenTrendCard tokenTrend={data.tokenTrend} />
          </div>

          <TeslaVehicleWidget />
          <AgentStatusGrid agents={data.agents} />
          <TaskLists runningTasks={data.runningTasks} recentCompleted={data.recentCompleted} />
        </div>
      )}
    </DashboardShell>
  )
}
