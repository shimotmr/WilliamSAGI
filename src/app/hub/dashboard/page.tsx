'use client'
// 🔒 AUDIT: 2026-03-08 | score=100/100 | full-audit

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatsGrid from '@/features/dashboard/components/StatsGrid'
import TokenTrendCard from '@/features/dashboard/components/TokenTrendCard'
import AgentStatusGrid from '@/features/dashboard/components/AgentStatusGrid'
import TaskLists from '@/features/dashboard/components/TaskLists'
import ModelUsageCard from '@/features/dashboard/components/ModelUsageCard'
import { fetchDashboardData } from '@/features/dashboard/services'
import type { DashboardData } from '@/features/dashboard/types'
import Card from '@/components/ui/Card'

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
        setLastUpdated(
          new Date().toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
          })
        )
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex h-[50vh] items-center justify-center text-sm text-[var(--foreground-muted)]">
            載入中…
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Card className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">
            {error || '無法載入 Dashboard'}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/hub"
              className="mb-3 inline-flex text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              ← Hub
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Clawd Dashboard
            </h1>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              系統即時監控 · Agent 作業中心
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              系統正常
            </span>
            <span>更新時間 {lastUpdated}</span>
          </div>
        </div>

        <div className="space-y-4">
          <StatsGrid data={data} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
            <Card className="rounded-2xl p-5">
              <div className="mb-4 text-sm font-semibold text-[var(--foreground)]">
                系統概況
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">總任務</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {data.totalTasks}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">Agent 數量</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {data.agents.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">本週完成</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {data.weekCompleted}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">完成率</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {data.completionRate}%
                  </span>
                </div>
              </div>
            </Card>

            <TokenTrendCard tokenTrend={data.tokenTrend} />
          </div>

          <ModelUsageCard modelUsage={data.modelUsage} />

          <AgentStatusGrid agents={data.agents} />

          <TaskLists
            runningTasks={data.runningTasks}
            recentCompleted={data.recentCompleted}
          />
        </div>
      </div>
    </div>
  )
}
