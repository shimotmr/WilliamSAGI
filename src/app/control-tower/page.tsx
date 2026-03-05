"use client"

import { useEffect, useMemo, useState } from 'react'

type ScheduleItem = {
  name: string
  schedule: string
  last_run?: string | null
  status: 'ok' | 'error' | 'idle' | string
  enabled: boolean
}

type ActiveTaskItem = {
  id?: number
  title?: string
  assignee?: string
  updated_at?: string
  created_at?: string
}

type HealthItem = {
  score?: number
  health_score?: number
  created_at?: string
}

type RepairItem = {
  id?: number
  title?: string
  message?: string
  detail?: string
  repaired_at?: string
  created_at?: string
}

const statusColor: Record<string, string> = {
  ok: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  error: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  idle: 'bg-gray-500/20 text-gray-300 border-gray-500/40'
}

function formatTime(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString('zh-TW', { hour12: false })
}

export default function ControlTowerPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [activeTasks, setActiveTasks] = useState<ActiveTaskItem[]>([])
  const [health, setHealth] = useState<HealthItem[]>([])
  const [repairs, setRepairs] = useState<RepairItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, h, r] = await Promise.all([
          fetch('/api/control-tower/schedules', { cache: 'no-store' }),
          fetch('/api/control-tower/active-tasks', { cache: 'no-store' }),
          fetch('/api/control-tower/health', { cache: 'no-store' }),
          fetch('/api/control-tower/repairs', { cache: 'no-store' })
        ])

        const [sData, tData, hData, rData] = await Promise.all([
          s.json(),
          t.json(),
          h.json(),
          r.json()
        ])

        setSchedules(Array.isArray(sData) ? sData : [])
        setActiveTasks(Array.isArray(tData) ? tData : [])
        setHealth(Array.isArray(hData) ? hData : [])
        setRepairs(Array.isArray(rData) ? rData : [])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const latestScore = useMemo(() => {
    if (!health.length) return 0
    return Number(health[0].score ?? health[0].health_score ?? 0)
  }, [health])

  const scoreColor = latestScore > 80 ? 'text-emerald-400' : latestScore > 60 ? 'text-yellow-400' : 'text-rose-400'

  const trend = useMemo(() => {
    return health
      .slice(0, 5)
      .map((x) => Number(x.score ?? x.health_score ?? 0))
      .reverse()
  }, [health])

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">自主控制塔</h1>
          <p className="text-gray-400 mt-2">排程、任務、健康與修復即時總覽</p>
        </header>

        {loading && <div className="text-gray-400 text-sm">載入中...</div>}

        <section className="bg-gray-800/70 border border-gray-700 rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-4">Cron 排程列表</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">名稱</th>
                  <th className="text-left py-2">排程</th>
                  <th className="text-left py-2">上次執行</th>
                  <th className="text-left py-2">狀態</th>
                  <th className="text-left py-2">啟停</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((item) => (
                  <tr key={item.name} className="border-b border-gray-800">
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3 text-gray-300">{item.schedule}</td>
                    <td className="py-3 text-gray-400">{formatTime(item.last_run)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-md border text-xs ${statusColor[item.status] || statusColor.idle}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        className={`w-12 h-6 rounded-full relative transition ${item.enabled ? 'bg-emerald-500/70' : 'bg-gray-600'}`}
                        aria-label={`${item.name}-toggle`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${item.enabled ? 'left-6' : 'left-0.5'}`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
                {!schedules.length && (
                  <tr>
                    <td colSpan={5} className="py-4 text-gray-500 text-center">目前沒有資料</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-gray-800/70 border border-gray-700 rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">活躍任務</h2>
            <div className="space-y-3">
              {activeTasks.map((task, idx) => (
                <div key={`${task.id || idx}`} className="bg-gray-900/60 border border-gray-700 rounded-lg p-3">
                  <div className="font-medium">{task.title || `Task #${task.id}`}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatTime(task.updated_at || task.created_at)} · {task.assignee || '未指派'}
                  </div>
                </div>
              ))}
              {!activeTasks.length && <p className="text-gray-500 text-sm">目前沒有進行中任務</p>}
            </div>
          </section>

          <section className="bg-gray-800/70 border border-gray-700 rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">系統健康</h2>
            <div className={`text-5xl font-bold ${scoreColor}`}>{latestScore}</div>
            <p className="text-gray-400 text-sm mt-2">最新健康分數</p>

            <div className="mt-5">
              <p className="text-sm text-gray-300 mb-2">最近 5 筆趨勢</p>
              <div className="flex items-end gap-2 h-24">
                {trend.map((score, idx) => {
                  const h = Math.max(8, Math.min(100, score))
                  const c = score > 80 ? 'bg-emerald-400' : score > 60 ? 'bg-yellow-400' : 'bg-rose-400'
                  return (
                    <div key={`${idx}-${score}`} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-gray-700 rounded-t" style={{ height: `${h}%` }}>
                        <div className={`w-full h-full rounded-t ${c}`} />
                      </div>
                      <span className="text-[10px] text-gray-400">{score}</span>
                    </div>
                  )
                })}
                {!trend.length && <p className="text-gray-500 text-sm">尚無健康分數紀錄</p>}
              </div>
            </div>
          </section>
        </div>

        <section className="bg-gray-800/70 border border-gray-700 rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-4">最近修復</h2>
          <div className="space-y-3">
            {repairs.map((item, idx) => (
              <div key={`${item.id || idx}`} className="bg-gray-900/60 border border-gray-700 rounded-lg p-3">
                <div className="font-medium">{item.title || item.message || '修復項目'}</div>
                <div className="text-sm text-gray-300 mt-1">{item.detail || item.message || '—'}</div>
                <div className="text-xs text-gray-500 mt-2">{formatTime(item.repaired_at || item.created_at)}</div>
              </div>
            ))}
            {!repairs.length && <p className="text-gray-500 text-sm">尚無修復紀錄</p>}
          </div>
        </section>
      </div>
    </main>
  )
}
