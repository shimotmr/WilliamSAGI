import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/board_tasks?select=status,priority,created_at,completed_at`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    if (!res.ok) {
      throw new Error('Failed to fetch tasks')
    }

    const tasks = await res.json()

    const statusCounts: Record<string, number> = {}
    const priorityCounts: Record<string, number> = {}

    tasks.forEach((task: any) => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1
      if (task.priority) {
        priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1
      }
    })

    const total = tasks.length
    const completed = tasks.filter((t: any) => t.status === '已完成').length
    const failed = tasks.filter((t: any) => t.status === '失敗').length

    return NextResponse.json({
      total,
      completed,
      failed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      statusCounts,
      priorityCounts,
      lastUpdate: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}
