// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cache for 30 seconds - task counts don't change every second
export const revalidate = 30

export async function GET() {
  const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const supabase = getSupabase()

  // 單一 RPC 查詢 + 10筆 recent（並行）
  const [countResult, recentResult] = await Promise.all([
    // 用 rpc 做 aggregation（避免重複全表 scan）
    supabase.rpc('get_task_counts', {}),
    // 取最近 10 筆
    supabase.from('board_tasks')
      .select('id,title,assignee,status,updated_at')
      .order('updated_at', { ascending: false })
      .limit(10)
  ])

  // fallback: 如果 RPC 不存在，用原始 query
  const counts = countResult.data 
    ? countResult.data 
    : await computeCountsFallback(supabase)

  return NextResponse.json({
    activeTasks: counts.activeTasks || 0,
    completedToday: counts.completedToday || 0,
    failedToday: counts.failedToday || 0,
    pendingTasks: (counts.pendingTasks || 0),
    recentTasks: recentResult.data || [],
  })
}

async function computeCountsFallback(supabase: any) {
  // Fallback: 用 single query 拿所有數據再 client-side count
  const { data: tasks } = await supabase
    .from('board_tasks')
    .select('status')
  
  const counts: any = {}
  ;(tasks || []).forEach((t: any) => {
    counts[t.status] = (counts[t.status] || 0) + 1
  })
  
  return {
    activeTasks: counts['執行中'] || 0,
    completedToday: counts['已完成'] || 0,
    failedToday: counts['失敗'] || 0,
    pendingTasks: (counts['待執行'] || 0) + (counts['待派發'] || 0),
  }
}
