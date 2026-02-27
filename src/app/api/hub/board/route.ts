import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status')
  const statuses = statusParam ? statusParam.split(',') : null

  let query = supabase.from('board_tasks').select('id,title,status,assignee,priority,updated_at,description').order('priority').order('id',{ascending:false}).limit(150)
  if (statuses) query = query.in('status', statuses)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data })
}
