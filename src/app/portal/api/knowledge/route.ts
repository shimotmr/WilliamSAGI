import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let query = supabase.from('sop_rules')
    .select('id,name,category,description,risk_level,automation_level,compliance_score,is_active,last_updated')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .limit(200)
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  const { data } = await query
  return NextResponse.json({ items: data || [], total: (data || []).length })
}
