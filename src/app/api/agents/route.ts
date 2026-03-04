// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {
  const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  const { data } = await supabase
    .from('board_tasks')
    .select('assignee, status')
    .neq('assignee', '待分配')
  const agentMap: Record<string, { name: string; running: number; completed: number; pending: number }> = {}
  for (const t of (data || [])) {
    if (!agentMap[t.assignee]) agentMap[t.assignee] = { name: t.assignee, running: 0, completed: 0, pending: 0 }
    if (t.status === '執行中') agentMap[t.assignee].running++
    else if (t.status === '已完成') agentMap[t.assignee].completed++
    else if (t.status === '待派發' || t.status === '待執行') agentMap[t.assignee].pending++
  }
  return NextResponse.json(Object.values(agentMap))
}
