import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.from('board_tasks').select('assignee, status').neq('assignee','待分配')
  const agents: Record<string,any> = {}
  for (const t of (data||[])) {
    if (!agents[t.assignee]) agents[t.assignee] = { name: t.assignee, running: 0, completed: 0, pending: 0 }
    if (t.status==='執行中') agents[t.assignee].running++
    else if (t.status==='已完成') agents[t.assignee].completed++
    else if (t.status==='待派發'||t.status==='待執行') agents[t.assignee].pending++
  }
  return NextResponse.json(Object.values(agents))
}
