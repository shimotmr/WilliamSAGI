import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()
  const month = searchParams.get('month') || (new Date().getMonth() + 1).toString()

  const [{ data: targets }, { data: cases }] = await Promise.all([
    supabase.from('targets').select('*').eq('year', parseInt(year)).eq('month', parseInt(month)),
    supabase.from('cases').select('rep,amount,stage,ship_date').in('stage', ['簽約','出貨'])
      .gte('ship_date', `${year}-${month.padStart(2,'0')}-01`)
      .lte('ship_date', `${year}-${month.padStart(2,'0')}-31`)
  ])

  // 計算每人業績
  const actual: Record<string,number> = {}
  for (const c of (cases||[])) {
    actual[c.rep] = (actual[c.rep]||0) + (c.amount||0)
  }

  const summary = (targets||[]).map(t => ({
    rep: t.rep_name,
    target: t.target_amount,
    actual: actual[t.rep_name] || 0,
    rate: t.target_amount > 0 ? Math.round(((actual[t.rep_name]||0) / t.target_amount) * 100) : 0
  })).sort((a,b) => b.rate - a.rate)

  return NextResponse.json({ summary, year, month })
}
