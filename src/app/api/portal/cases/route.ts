import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')
  const rep = searchParams.get('rep')
  const q = searchParams.get('q')

  let query = supabase.from('cases').select('*').order('updated_at', { ascending: false }).limit(200)
  if (stage) query = query.eq('stage', stage)
  if (rep) query = query.eq('rep', rep)
  if (q) query = query.or(`end_customer.ilike.%${q}%,dealer.ilike.%${q}%,machine.ilike.%${q}%,order_id.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cases: data })
}
