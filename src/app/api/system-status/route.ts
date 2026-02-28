import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function GET() {
  const { count: active } = await supabase.from('board_tasks').select('*', { count: 'exact', head: true }).eq('status', '執行中')
  const { count: total } = await supabase.from('board_tasks').select('*', { count: 'exact', head: true })
  return NextResponse.json({ activeTasks: active||0, totalTasks: total||0, status: 'ok' })
}
