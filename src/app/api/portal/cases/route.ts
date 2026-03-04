// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')
  const rep = searchParams.get('rep')
  const q = searchParams.get('q')
  const expired = searchParams.get('expired') // 'true' = 過期, 'false' = 未過期

  let query = supabase.from('cases').select('*').order('updated_at', { ascending: false }).limit(200)
  if (stage) query = query.eq('stage', stage)
  if (rep) query = query.eq('rep', rep)
  if (q) query = query.or(`end_customer.ilike.%${q}%,dealer.ilike.%${q}%,machine.ilike.%${q}%,order_id.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 過期篩選 - 根據出貨日判斷
  const today = new Date().toISOString().slice(0,10)
  let filtered = data || []
  
  if (expired === 'true') {
    // 出貨日已過但尚未出貨的案件 (非已出貨、非失敗)
    filtered = filtered.filter(c => 
      c.ship_date && 
      c.ship_date < today && 
      c.stage !== '已出貨' && 
      c.stage !== '失敗'
    )
  } else if (expired === 'false') {
    // 未過期：還沒到出貨日 或 已出貨 或 失敗
    filtered = filtered.filter(c => 
      !c.ship_date || 
      c.ship_date >= today || 
      c.stage === '已出貨' || 
      c.stage === '失敗'
    )
  }

  // 計算金額統計
  const totalAmt = filtered.reduce((s,c) => s + (c.amount||0), 0)
  const totalExp = filtered.reduce((s,c) => s + (c.expected||0), 0)
  const count = filtered.length

  return NextResponse.json({ 
    cases: filtered,
    stats: { count, totalAmount: totalAmt, totalExpected: totalExp }
  })
}
