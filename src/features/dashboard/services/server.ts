import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { DashboardData } from '../types'

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseServerClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const todayStart = new Date(now.toDateString())

  const { data: tasks } = await supabase
    .from('board_tasks')
    .select('status, assignee, title, updated_at, completed_at')

  const statusCounts: Record<string, number> = {}
  let weekCompleted = 0

  for (const t of tasks || []) {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1
    if (t.status === '已完成' && t.completed_at && new Date(t.completed_at) > weekAgo) {
      weekCompleted++
    }
  }

  const { data: agentsData } = await supabase
    .from('agents')
    .select('id, name, color, emoji, role, status')
    .eq('status', 'active')
    .order('name')

  const agentStats: Record<string, { total: number; completed: number; todayCompleted: number }> = {}

  for (const t of tasks || []) {
    const name = t.assignee?.toLowerCase() || ''
    if (!agentStats[name]) {
      agentStats[name] = { total: 0, completed: 0, todayCompleted: 0 }
    }
    agentStats[name].total++
    if (t.status === '已完成') {
      agentStats[name].completed++
      if (t.completed_at && new Date(t.completed_at) > todayStart) {
        agentStats[name].todayCompleted++
      }
    }
  }

  const agents = (agentsData || []).map((a) => {
    const stats = agentStats[a.name.toLowerCase()] || { total: 0, completed: 0, todayCompleted: 0 }
    return {
      name: a.name,
      role: a.role || a.name,
      color: a.color || '#5E6AD2',
      emoji: a.emoji || '',
      total: stats.total,
      completed: stats.completed,
      todayCompleted: stats.todayCompleted,
      successRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      currentTask: null,
      isActive: false,
    }
  })

  const runningTasks = (tasks || [])
    .filter((t) => t.status === '執行中')
    .slice(0, 5)
    .map((t) => ({ id: 0, title: t.title, assignee: t.assignee, updatedAt: t.updated_at }))

  const recentCompleted = (tasks || [])
    .filter((t) => t.status === '已完成' && t.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 5)
    .map((t, i) => ({ id: i, title: t.title, completedAt: t.completed_at!, assignee: t.assignee }))

  const { data: tokenData } = await supabase
    .from('model_usage_log')
    .select('created_at, total_tokens, cost_estimate')
    .gte('created_at', weekAgo.toISOString())
    .order('created_at', { ascending: true })

  const tokenByDay: Record<string, { tokens: number; cost: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    tokenByDay[key] = { tokens: 0, cost: 0 }
  }

  for (const t of tokenData || []) {
    const key = new Date(t.created_at).toISOString().slice(0, 10)
    if (tokenByDay[key]) {
      tokenByDay[key].tokens += t.total_tokens || 0
      tokenByDay[key].cost += t.cost_estimate || 0
    }
  }

  const tokenTrend = Object.entries(tokenByDay).map(([date, data]) => ({
    date,
    tokens: data.tokens,
    cost: Math.round(data.cost * 100) / 100,
  }))

  // Model usage stats - last 7 days
  const modelStats: Record<string, { provider: string; tokens: number; cost: number; count: number }> = {}
  for (const t of tokenData || []) {
    const modelKey = t.model || 'unknown'
    if (!modelStats[modelKey]) {
      modelStats[modelKey] = { provider: t.provider || 'unknown', tokens: 0, cost: 0, count: 0 }
    }
    modelStats[modelKey].tokens += t.total_tokens || 0
    modelStats[modelKey].cost += t.cost_estimate || 0
    modelStats[modelKey].count += 1
  }

  const modelUsage = Object.entries(modelStats)
    .map(([name, stats]) => ({
      name,
      provider: stats.provider,
      tokens: stats.tokens,
      cost: Math.round(stats.cost * 100) / 100,
      count: stats.count,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10)

  return {
    statusCounts,
    totalTasks: tasks?.length || 0,
    weekCompleted,
    completionRate:
      statusCounts['已完成'] && tasks?.length
        ? Math.round((statusCounts['已完成'] / tasks.length) * 100)
        : 0,
    agents,
    recentCompleted,
    runningTasks,
    tokenTrend,
    modelUsage,
  }
}
