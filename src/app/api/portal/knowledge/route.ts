import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET(req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const cat = searchParams.get('category')
  let query = supabase.from('sop_rules').select('id,name,category,description,core_points,risk_level,last_updated,tags').eq('is_active', true).order('category').limit(200)
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  if (cat) query = query.eq('category', cat)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}
