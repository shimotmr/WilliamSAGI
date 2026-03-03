import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let query = supabase.from('products_full')
    .select('id,aurotek_pn,name,name_en,brand,list_price,currency,material_type')
    .eq('is_active', true)
    .order('brand', { ascending: true })
    .limit(500)
  if (q) query = query.or(`name.ilike.%${q}%,aurotek_pn.ilike.%${q}%,name_en.ilike.%${q}%`)
  const { data } = await query
  return NextResponse.json({ products: data || [] })
}
