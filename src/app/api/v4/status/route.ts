import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()

  // Active tasks (執行中)
  const { data: activeTasks } = await supabase
    .from('board_tasks')
    .select('id, title, assignee, status, updated_at, created_at')
    .eq('status', '執行中')
    .order('updated_at', { ascending: false })
    .limit(10)

  // Recent completed/failed (事件流)
  const { data: recentTasks } = await supabase
    .from('board_tasks')
    .select('id, title, assignee, status, completed_at, updated_at, result')
    .in('status', ['已完成', '失敗', '執行中', '待執行'])
    .order('updated_at', { ascending: false })
    .limit(20)

  // Phase stats
  const { data: allTasks } = await supabase
    .from('board_tasks')
    .select('id, status, priority, assignee, created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // Calculate stats
  const tasks = allTasks || []
  const completed = tasks.filter(t => t.status === '已完成').length
  const failed = tasks.filter(t => t.status === '失敗').length
  const running = tasks.filter(t => t.status === '執行中').length
  const pending = tasks.filter(t => t.status === '待執行' || t.status === '待派發').length
  const total = tasks.length
  const successRate = total > 0 ? Math.round((completed / Math.max(completed + failed, 1)) * 100) : 0

  // Agent stats
  const agents = ['blake', 'rex', 'oscar', 'warren', 'griffin']
  const agentStats = agents.map(agent => {
    const agentTasks = tasks.filter(t => t.assignee === agent)
    const agentCompleted = agentTasks.filter(t => t.status === '已完成').length
    const agentFailed = agentTasks.filter(t => t.status === '失敗').length
    const agentActive = (activeTasks || []).find(t => t.assignee === agent)
    return {
      name: agent,
      completed: agentCompleted,
      failed: agentFailed,
      total: agentTasks.length,
      active: agentActive || null,
    }
  })

  return NextResponse.json({
    activeTasks: activeTasks || [],
    recentTasks: recentTasks || [],
    stats: { completed, failed, running, pending, total, successRate },
    agentStats,
    timestamp: new Date().toISOString(),
  })
}
