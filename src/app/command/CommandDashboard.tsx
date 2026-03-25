"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useSupabaseRealtime } from './useSupabaseRealtime'

interface TaskStats {
  total_today: number
  pending: number
  running: number
  completed_today: number
  failed_today: number
  frozen: FrozenTask[]
}

interface FrozenTask {
  id: number
  title: string
  assignee: string
  status: string
  updated_at: string
  last_failure_reason: string | null
  retry_count: number
}

const AGENT_EMOJI: Record<string, string> = {
  travis: '🤖', blake: '🧑‍💻', rex: '🧠', oscar: '🎭', warren: '📈', griffin: '🛡️',
}

export function CommandDashboard() {
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [byAgent, setByAgent] = useState<Record<string, { running: number; completed: number; failed: number }>>({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Fetch today's stats
    const [
      { count: totalToday },
      { count: pending },
      { count: running },
      { count: completedToday },
      { count: failedToday },
      { data: frozenRaw },
      { data: allActive },
    ] = await Promise.all([
      supabase.from('board_tasks').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('board_tasks').select('*', { count: 'exact', head: true }).eq('status', '待執行'),
      supabase.from('board_tasks').select('*', { count: 'exact', head: true }).eq('status', '執行中'),
      supabase.from('board_tasks').select('*', { count: 'exact', head: true }).eq('status', '已完成').gte('completed_at', today),
      supabase.from('board_tasks').select('*', { count: 'exact', head: true }).eq('status', '已失敗').gte('updated_at', today),
      supabase.from('board_tasks')
        .select('id,title,assignee,status,updated_at,last_failure_reason,retry_count')
        .eq('status', '執行中')
        .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
        .order('updated_at', { ascending: true })
        .limit(10),
      supabase.from('board_tasks')
        .select('assignee,status')
        .in('status', ['執行中', '已完成', '已失敗', '待執行'])
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    // Agent breakdown from recent tasks
    const agentMap: Record<string, { running: number; completed: number; failed: number }> = {}
    allActive?.forEach((t: any) => {
      const a = (t.assignee || 'unknown').toLowerCase()
      if (!agentMap[a]) agentMap[a] = { running: 0, completed: 0, failed: 0 }
      if (t.status === '執行中') agentMap[a].running++
      else if (t.status === '已完成') agentMap[a].completed++
      else if (t.status === '已失敗') agentMap[a].failed++
    })

    setStats({
      total_today: totalToday || 0,
      pending: pending || 0,
      running: running || 0,
      completed_today: completedToday || 0,
      failed_today: failedToday || 0,
      frozen: (frozenRaw || []) as FrozenTask[],
    })
    setByAgent(agentMap)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useSupabaseRealtime('board_tasks', fetchData)

  if (loading) return <LoadingSkeleton />

  const s = stats!

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="今日建立" value={s.total_today} color="blue" />
        <StatCard label="待執行" value={s.pending} color="yellow" />
        <StatCard label="執行中" value={s.running} color="cyan" />
        <StatCard label="今日完成" value={s.completed_today} color="green" />
        <StatCard label="今日失敗" value={s.failed_today} color="red" />
      </div>

      {/* Frozen Tasks Alert */}
      {s.frozen.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            凍結任務警示 ({s.frozen.length})
          </h3>
          <div className="space-y-2">
            {s.frozen.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-red-500/10 rounded-lg px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-red-400 font-mono">#{t.id}</span>
                  <span className="text-gray-200 truncate max-w-[300px]">{t.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">
                    {AGENT_EMOJI[t.assignee?.toLowerCase()] || '❓'} {t.assignee}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {t.retry_count > 0 && <span>重試 {t.retry_count}x</span>}
                  <span>{timeAgo(t.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Overview */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Agent 近 7 日活動</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(byAgent)
            .sort((a, b) => (b[1].completed + b[1].running) - (a[1].completed + a[1].running))
            .map(([name, data]) => (
              <div key={name} className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{AGENT_EMOJI[name] || '❓'}</span>
                  <span className="text-sm font-medium capitalize">{name}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">執行中</span>
                    <span className="text-cyan-400">{data.running}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">完成</span>
                    <span className="text-green-400">{data.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">失敗</span>
                    <span className={data.failed > 0 ? 'text-red-400' : 'text-gray-600'}>{data.failed}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400',
    yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400',
    cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
    green: 'from-green-500/10 to-green-600/5 border-green-500/20 text-green-400',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-400',
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${c}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 h-20 animate-pulse" />
        ))}
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 h-40 animate-pulse" />
    </div>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
