import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: tasks } = await supabase
    .from('board_tasks')
    .select('status')
    .in('status', ['執行中', '待派發', '待執行', '已完成', '失敗'])
  const counts = (tasks || []).reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})
  return NextResponse.json({
    status: 'ok',
    running: counts['執行中'] || 0,
    pending: (counts['待派發'] || 0) + (counts['待執行'] || 0),
    completed: counts['已完成'] || 0,
    failed: counts['失敗'] || 0,
    timestamp: new Date().toISOString()
  })
}
