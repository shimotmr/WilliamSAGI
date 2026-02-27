import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const status = searchParams.get('status')

  let query = supabase.from('quotations').select('*').order('created_at', { ascending: false }).limit(100)
  if (status) query = query.eq('status', status)
  if (q) query = query.or(`customer_name.ilike.%${q}%,quotation_no.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quotations: data })
}
