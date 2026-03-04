// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase
    .from('board_tasks')
    .select('id,title,status,assignee,priority,updated_at')
    .in('status', ['執行中', '待派發'])
    .order('updated_at', { ascending: false })
    .limit(30)
  return NextResponse.json({ tasks: data || [] })
}
