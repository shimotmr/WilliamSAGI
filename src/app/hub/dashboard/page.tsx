'use client'

import { useState } from 'react'
import { useSmartPolling } from '../../hooks/useSmartPolling'
import StatsGrid from '@/features/dashboard/components/StatsGrid'
import TokenTrendCard from '@/features/dashboard/components/TokenTrendCard'
import AgentStatusGrid from '@/features/dashboard/components/AgentStatusGrid'
import TaskLists from '@/features/dashboard/components/TaskLists'
import ModelUsageCard from '@/features/dashboard/components/ModelUsageCard'
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

  const load = async () => {
    try {
      const result = await fetchDashboardData()
      setData(result)
      setLastUpdated(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗')
    } finally {
      setLoading(false)
    }
  }
  useSmartPolling(load, 30000)

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

          <ModelUsageCard modelUsage={data.modelUsage} />

          <TeslaVehicleWidget />

          {/* 交易中心入口 */}
          <a href="https://shioaji.williamhsiao.tw" target="_blank" rel="noopener noreferrer"
            className="block group">
            <SectionCard title="">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--foreground)] group-hover:text-blue-400 transition-colors">交易中心</div>
                  <div className="text-xs text-[var(--foreground-muted)]">即時持倉 · 委託記錄</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--foreground-muted)] group-hover:text-blue-400 transition-colors flex-shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
            </SectionCard>
          </a>

          <AgentStatusGrid agents={data.agents} />
          <TaskLists runningTasks={data.runningTasks} recentCompleted={data.recentCompleted} />
        </div>
      )}
    </DashboardShell>
  )
}
