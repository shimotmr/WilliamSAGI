import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const [{ data: quote, error }, { data: items }] = await Promise.all([
    supabase.from('quotations').select('*').eq('id', params.id).single(),
    supabase.from('quotation_items').select('*').eq('quotation_id', params.id).order('sort_order'),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ quote, items: items || [] })
}
