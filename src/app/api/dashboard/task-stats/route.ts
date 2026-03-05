// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get tasks from last 4 weeks
  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const { data: tasks, error } = await getSupabase()
    .from('board_tasks')
    .select('id, status, completed_at, created_at')
    .gte('created_at', fourWeeksAgo.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by week
  const weeklyStats: Record<string, { completed: number; total: number; week: string }> = {}

  for (let i = 0; i < 4; i++) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    const weekKey = `${weekStart.toISOString().split('T')[0]}`
    weeklyStats[weekKey] = { week: weekKey, completed: 0, total: 0 }
  }

  // Count tasks by week
  for (const task of tasks || []) {
    const taskDate = new Date(task.created_at)
    const weekStart = new Date(taskDate)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (weeklyStats[weekKey]) {
      weeklyStats[weekKey].total += 1
      if (task.status === '已完成' && task.completed_at) {
        weeklyStats[weekKey].completed += 1
      }
    }
  }

  // Calculate completion rate
  const result = Object.values(weeklyStats)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map(w => ({
      week: w.week,
      completed: w.completed,
      total: w.total,
      completionRate: w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0
    }))

  // Also get stuck tasks ratio by day
  const dailyStuck: Record<string, { date: string; stuck: number; total: number }> = {}
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: allTasks } = await getSupabase()
    .from('board_tasks')
    .select('id, status, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  for (const task of allTasks || []) {
    const date = new Date(task.created_at).toISOString().split('T')[0]
    if (!dailyStuck[date]) {
      dailyStuck[date] = { date, stuck: 0, total: 0 }
    }
    dailyStuck[date].total += 1
    // Tasks stuck for more than 2 days in pending/executing status
    const daysOld = (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if ((task.status === '執行中' || task.status === '待派發') && daysOld > 2) {
      dailyStuck[date].stuck += 1
    }
  }

  const stuckData = Object.values(dailyStuck)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date,
      stuckRatio: d.total > 0 ? Math.round((d.stuck / d.total) * 100) : 0,
      stuckCount: d.stuck,
      totalCount: d.total
    }))
    .slice(-30)

  return NextResponse.json({ 
    ok: true, 
    weeklyStats: result,
    dailyStuck: stuckData
  })
}
