import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Status counts
    const { data: tasks } = await supabase
      .from('board_tasks')
      .select('status, assignee, title, updated_at, completed_at')

    const statusCounts: Record<string, number> = {}
    const agentMap: Record<string, { total: number; completed: number; todayCompleted: number }> = {}
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const todayStart = new Date(now.toDateString())
    let weekCompleted = 0

    for (const t of tasks || []) {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1
      if (!agentMap[t.assignee]) agentMap[t.assignee] = { total: 0, completed: 0, todayCompleted: 0 }
      agentMap[t.assignee].total++
      if (t.status === '已完成') {
        agentMap[t.assignee].completed++
        if (t.completed_at && new Date(t.completed_at) > weekAgo) weekCompleted++
        if (t.completed_at && new Date(t.completed_at) > todayStart) agentMap[t.assignee].todayCompleted++
      }
    }

    const agents = Object.entries(agentMap).map(([name, s]) => ({
      name,
      role: name,
      total: s.total,
      completed: s.completed,
      todayCompleted: s.todayCompleted,
      successRate: s.total > 0 ? Math.round(s.completed / s.total * 100) : 0,
      currentTask: null,
      isActive: false,
    })).sort((a, b) => b.completed - a.completed).slice(0, 8)

    // Running tasks
    const runningTasks = (tasks || [])
      .filter(t => t.status === '執行中')
      .slice(0, 5)
      .map(t => ({ id: 0, title: t.title, assignee: t.assignee, updatedAt: t.updated_at, description: null }))

    // Recent completed
    const recentCompleted = (tasks || [])
      .filter(t => t.status === '已完成' && t.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 5)
      .map((t, i) => ({ id: i, title: t.title, completedAt: t.completed_at!, assignee: t.assignee }))

    // Token trend (placeholder — 7 days)
    const tokenTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      return { date: d.toISOString().slice(0, 10), tokens: 0, cost: 0 }
    })

    return NextResponse.json({
      statusCounts,
      totalTasks: tasks?.length || 0,
      weekCompleted,
      completionRate: statusCounts['已完成'] && tasks?.length
        ? Math.round(statusCounts['已完成'] / tasks.length * 100) : 0,
      agents,
      recentCompleted,
      runningTasks,
      tokenTrend,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
