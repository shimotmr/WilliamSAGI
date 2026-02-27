import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const today = new Date().toISOString().split('T')[0]

  const [{ data: tasks }, { data: recent }] = await Promise.all([
    supabase.from('board_tasks').select('status'),
    supabase.from('board_tasks').select('id,title,assignee,status,updated_at')
      .order('updated_at',{ascending:false}).limit(10),
  ])

  const counts = (tasks||[]).reduce((acc:any,t:any) => {
    acc[t.status] = (acc[t.status]||0) + 1
    return acc
  }, {})

  return NextResponse.json({
    activeTasks: counts['執行中'] || 0,
    completedToday: counts['已完成'] || 0,
    failedToday: counts['失敗'] || 0,
    pendingTasks: (counts['待執行']||0) + (counts['待派發']||0),
    recentTasks: recent || [],
  })
}
