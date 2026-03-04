// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  const { data: tasks } = await supabase
    .from('board_tasks')
    .select('id,title,status,assignee,priority,updated_at')
    .in('status', ['執行中', '待派發', '待執行'])
    .order('updated_at', { ascending: false })
    .limit(100)

  const statusCounts = (tasks || []).reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})

  return NextResponse.json({ tasks: tasks || [], statusCounts, ok: true })
}

export async function POST() {
  return NextResponse.json({ ok: true })
}
