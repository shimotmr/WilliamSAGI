import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET(req: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit')||'20')
  const { data } = await supabase.from('reports').select('id,title,author,type,created_at').order('created_at',{ascending:false}).limit(limit)
  return NextResponse.json(data||[])
}
