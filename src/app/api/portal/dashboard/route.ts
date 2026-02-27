import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth() + 1
  const monthStart = `${y}-${String(m).padStart(2,'0')}-01`

  const [
    { data: caseStats },
    { data: targets },
    { data: recentCases },
    { data: quoteStats },
  ] = await Promise.all([
    // 各階段案件數 + 金額
    supabase.from('cases').select('stage,amount,expected').neq('stage','取消'),
    // 本月目標 + 業績
    supabase.from('targets').select('target_amount').eq('year', y).eq('month', m),
    // 最近更新案件
    supabase.from('cases').select('id,end_customer,dealer,stage,amount,ship_date,rep').order('updated_at',{ascending:false}).limit(5),
    // 本月報價
    supabase.from('quotations').select('status,total_amount').gte('quote_date', monthStart),
  ])

  // 統計
  const stages = ['詢價','報價','簽約','出貨']
  const stageMap: Record<string,{count:number,amount:number}> = {}
  for (const c of (caseStats||[])) {
    if (!stageMap[c.stage]) stageMap[c.stage] = {count:0,amount:0}
    stageMap[c.stage].count++
    stageMap[c.stage].amount += c.amount||0
  }

  const totalTarget = (targets||[]).reduce((s,t)=>s+t.target_amount,0)
  const monthActual = (caseStats||[]).filter(c=>['簽約','出貨'].includes(c.stage)).reduce((s,c)=>s+c.amount,0)
  const pipeline = (caseStats||[]).filter(c=>['詢價','報價'].includes(c.stage)).reduce((s,c)=>s+(c.expected||c.amount||0),0)

  return NextResponse.json({
    summary: {
      monthTarget: totalTarget,
      monthActual,
      monthRate: totalTarget > 0 ? Math.round(monthActual/totalTarget*100) : 0,
      pipeline,
      activeQuotes: (quoteStats||[]).filter(q=>q.status==='已送出').length,
    },
    stageMap,
    recentCases: recentCases||[],
  })
}
