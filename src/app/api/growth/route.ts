// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {
  const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  const { data: tasks } = await getSupabase().from('board_tasks')
    .select('status,created_at,completed_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  const total = (tasks || []).length
  const completed = (tasks || []).filter(t => t.status === '已完成').length
  return NextResponse.json({
    total_tasks: total,
    completed_tasks: completed,
    completion_rate: total > 0 ? Math.round(completed / total * 100) : 0,
    weekly_completions: [],
    agent_performance: [],
  })
}
