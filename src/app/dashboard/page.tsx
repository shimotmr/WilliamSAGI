'use client'

import { useEffect, useMemo, useState } from 'react'

type HealthScore = {
  score?: number
  health_score?: number
  created_at?: string
}

type StatusCount = {
  status: string
  count: number
}

type AgentActivity = {
  model: string
  status: string
  count: number
}

export default function DashboardPage() {
  const [healthScores, setHealthScores] = useState<HealthScore[]>([])
  const [taskStats, setTaskStats] = useState<StatusCount[]>([])
  const [agentActivity, setAgentActivity] = useState<AgentActivity[]>([])
  const [learningStats, setLearningStats] = useState<StatusCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [healthRes, taskRes, agentRes, learningRes] = await Promise.all([
          fetch('/api/dashboard/health-scores', { cache: 'no-store' }),
          fetch('/api/dashboard/task-stats', { cache: 'no-store' }),
          fetch('/api/dashboard/agent-activity', { cache: 'no-store' }),
          fetch('/api/dashboard/learning-stats', { cache: 'no-store' }),
        ])

        const [healthData, taskData, agentData, learningData] = await Promise.all([
          healthRes.json(),
          taskRes.json(),
          agentRes.json(),
          learningRes.json(),
        ])

        setHealthScores(Array.isArray(healthData) ? healthData : [])
        setTaskStats(Array.isArray(taskData) ? taskData : [])
        setAgentActivity(Array.isArray(agentData) ? agentData : [])
        setLearningStats(Array.isArray(learningData) ? learningData : [])
      } catch {
        setHealthScores([])
        setTaskStats([])
        setAgentActivity([])
        setLearningStats([])
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  const sparklineValues = useMemo(() => {
    const raw = healthScores
      .map((item) => Number(item.score ?? item.health_score ?? 0))
      .filter((n) => Number.isFinite(n))

    if (raw.length === 0) return [0]
    return raw.slice(-20)
  }, [healthScores])

  const maxSpark = Math.max(...sparklineValues, 1)

  const taskCount = useMemo(() => {
    const findCount = (keys: string[]) => {
      const lower = keys.map((k) => k.toLowerCase())
      return taskStats
        .filter((item) => lower.includes((item.status || '').toLowerCase()))
        .reduce((sum, item) => sum + Number(item.count || 0), 0)
    }

    return {
      done: findCount(['completed', 'done', '已完成']),
      doing: findCount(['in_progress', '進行中', 'running']),
      todo: findCount(['todo', '待執行', 'pending', '待處理']),
    }
  }, [taskStats])

  const totalLearning = learningStats.reduce((sum, item) => sum + Number(item.count || 0), 0)

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">KPI Dashboard</h1>
          <p className="text-gray-400 mt-1">即時監控任務、健康分數、Agent 活動與學習狀態</p>
        </header>

        {loading ? (
          <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6 text-gray-300">載入中...</div>
        ) : (
          <>
            <section className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
              <h2 className="text-lg font-semibold mb-4">健康分數趨勢（近 30 天）</h2>
              <div className="h-36 flex items-end gap-1.5">
                {sparklineValues.map((value, idx) => {
                  const h = Math.max(8, Math.round((value / maxSpark) * 100))
                  return (
                    <div
                      key={`${value}-${idx}`}
                      className="flex-1 bg-emerald-400/80 rounded-t"
                      style={{ height: `${h}%` }}
                      title={`Score: ${value}`}
                    />
                  )
                })}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="完成任務" value={taskCount.done} color="text-emerald-400" />
              <StatCard title="進行中" value={taskCount.doing} color="text-yellow-400" />
              <StatCard title="待執行" value={taskCount.todo} color="text-sky-400" />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
                <h2 className="text-lg font-semibold mb-4">Agent 活動摘要（近 7 天）</h2>
                <div className="space-y-3">
                  {agentActivity.length === 0 ? (
                    <p className="text-gray-400">目前無資料</p>
                  ) : (
                    agentActivity.map((item, idx) => (
                      <div key={`${item.model}-${item.status}-${idx}`} className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.model} / {item.status}</span>
                        <span className="font-semibold text-white">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
                <h2 className="text-lg font-semibold mb-4">學習統計（rule_proposals）</h2>
                <p className="text-3xl font-bold text-purple-400">{totalLearning}</p>
                <p className="text-gray-400 text-sm mt-1">總提案數</p>
                <div className="mt-4 space-y-2">
                  {learningStats.map((item) => (
                    <div key={item.status} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.status}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  )
}
