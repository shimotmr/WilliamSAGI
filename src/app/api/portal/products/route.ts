import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const brand = searchParams.get('brand')

  let query = supabase.from('products_full').select('id,aurotek_pn,name,name_en,brand,list_price,currency,material_type,is_sellable').eq('is_sellable', true).order('brand').order('name').limit(300)
  if (q) query = query.or(`name.ilike.%${q}%,aurotek_pn.ilike.%${q}%,name_en.ilike.%${q}%`)
  if (brand) query = query.eq('brand', brand)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data })
}
