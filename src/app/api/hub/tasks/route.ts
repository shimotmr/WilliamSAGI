import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET(req: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let query = supabase.from('board_tasks').select('id,title,status,assignee,priority,updated_at').order('updated_at',{ascending:false}).limit(50)
  if (status) query = query.eq('status', status)
  const { data } = await query
  return NextResponse.json(data||[])
}
