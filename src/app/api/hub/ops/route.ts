import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const supabase = getSupabase()
    const now = new Date()
    const todayStart = new Date(now.toISOString().slice(0, 10) + 'T00:00:00')

    // 1. Task Statistics
    const { data: allTasks } = await supabase
      .from('board_tasks')
      .select('id, title, status, priority, assignee, created_at, completed_at, updated_at')

    const taskStats = {
      total: allTasks?.length || 0,
      pending: allTasks?.filter(t => t.status === '待執行' || t.status === '待派發').length || 0,
      running: allTasks?.filter(t => t.status === '執行中').length || 0,
      completed: allTasks?.filter(t => t.status === '已完成').length || 0,
      failed: allTasks?.filter(t => t.status === '失敗').length || 0,
      todayCompleted: allTasks?.filter(t => 
        t.status === '已完成' && t.completed_at && new Date(t.completed_at) >= todayStart
      ).length || 0,
      todayCreated: allTasks?.filter(t => 
        new Date(t.created_at) >= todayStart
      ).length || 0,
    }

    // 2. Pending Items - Tasks that need attention
    const pendingItems = {
      highPriority: allTasks?.filter(t => 
        (t.status === '待執行' || t.status === '待派發') && 
        (t.priority === 'P0' || t.priority === 'P1')
      ).map(t => ({
        id: t.id,
        type: 'task',
        title: t.title || '',
        priority: t.priority,
        assignee: t.assignee,
      })) || [],
      
      running: allTasks?.filter(t => t.status === '執行中')
        .map(t => ({
          id: t.id,
          type: 'running',
          title: t.title || '',
          assignee: t.assignee,
          updatedAt: t.updated_at,
        })) || [],
        
      failed: allTasks?.filter(t => t.status === '失敗')
        .map(t => ({
          id: t.id,
          type: 'failed',
          title: t.title || '',
          assignee: t.assignee,
        })) || [],
    }

    // 3. System Status
    const { data: healthLogs } = await supabase
      .from('health_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    const { data: cronStatus } = await supabase
      .from('cron_executions')
      .select('script_name, status, executed_at')
      .gte('executed_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .order('executed_at', { ascending: false })
      .limit(20)

    const { data: activeAlerts } = await supabase
      .from('alert_rules')
      .select('id, name, severity')
      .eq('is_active', true)
      .limit(10)

    const systemStatus = {
      overall: healthLogs?.[0]?.status || 'healthy',
      lastCheck: healthLogs?.[0]?.created_at || null,
      cronJobs: {
        total: cronStatus?.length || 0,
        failed: cronStatus?.filter(c => c.status === 'failed').length || 0,
        lastRun: cronStatus?.[0]?.executed_at || null,
      },
      alerts: activeAlerts?.length || 0,
    }

    // 4. Agent Activity
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, emoji, status')

    const agentActivity = agents?.map(a => {
      const agentTasks = allTasks?.filter(t => 
        t.assignee?.toLowerCase() === a.name?.toLowerCase()
      ) || []
      return {
        name: a.name,
        emoji: a.emoji,
        status: a.status,
        activeTasks: agentTasks.filter(t => t.status === '執行中').length,
        completedToday: agentTasks.filter(t => 
          t.status === '已完成' && t.completed_at && new Date(t.completed_at) >= todayStart
        ).length,
      }
    }) || []

    // 5. Today's Focus Items
    const todayFocus = {
      urgentTasks: pendingItems.highPriority.slice(0, 5),
      runningTasks: pendingItems.running.slice(0, 5),
      failedTasks: pendingItems.failed.slice(0, 3),
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      taskStats,
      pendingItems,
      systemStatus,
      agentActivity,
      todayFocus,
    })
  } catch (error) {
    console.error('Ops API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ops data' },
      { status: 500 }
    )
  }
}
