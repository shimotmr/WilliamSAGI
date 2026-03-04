// @ts-nocheck
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const getSupabase = () => createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

  // 本月數據
  const monthStart = `${year}-${String(month).padStart(2,'0')}-01`
  const monthEnd = `${year}-${String(month).padStart(2,'0')}-31`

  const [{ data: targets }, { data: cases }, { data: allCases }] = await Promise.all([
    getSupabase().from('targets').select('*').eq('year', year).eq('month', month),
    getSupabase().from('cases').select('rep,amount,stage,ship_date,dealer,expected').in('stage', ['已出貨','待出貨'])
      .gte('ship_date', monthStart).lte('ship_date', monthEnd),
    getSupabase().from('cases').select('rep,amount,stage,ship_date,dealer,expected,order_date'),
  ])

  // 計算每人本月業績
  const actual: Record<string,number> = {}
  for (const c of (cases||[])) {
    actual[c.rep] = (actual[c.rep]||0) + (c.amount||0)
  }

  // YTD 數據
  const ytdStart = `${year}-01-01`
  const ytdEnd = monthEnd
  const [{ data: ytdTargets }, { data: ytdCases }]: [{ data: any }, { data: any }] = await Promise.all([
    getSupabase().from('targets').select('*').gte('year', year).lte('year', year),
    getSupabase().from('cases').select('rep,amount,stage').in('stage', ['已出貨','待出貨']).gte('ship_date', ytdStart).lte('ship_date', ytdEnd),
  ])

  const ytdActual: Record<string,number> = {}
  for (const c of (ytdCases||[])) {
    ytdActual[c.rep] = (ytdActual[c.rep]||0) + (c.amount||0)
  }
  const ytdTargetSum = (ytdTargets||[]).reduce((s:number,t:any)=>s+(t.target_amount||0),0)
  const ytdActualSum = Object.values(ytdActual).reduce((s:number,v:any)=>s+(v||0),0)
  const ytdRate = ytdTargetSum > 0 ? Math.round(ytdActualSum/ytdTargetSum*100) : 0

  // 月度趨勢 (每月數據)
  const monthlyTrend: {month:number,target:number,actual:number,rate:number}[] = []
  for (let m = 1; m <= 12; m++) {
    const mStart = `${year}-${String(m).padStart(2,'0')}-01`
    const mEnd = `${year}-${String(m).padStart(2,'0')}-31`
    const mTargets = (ytdTargets||[]).filter((t:any) => t.month === m)
    const mCases = (ytdCases||[]).filter((c:any) => c.ship_date && c.ship_date >= mStart && c.ship_date <= mEnd)
    const mTarget = mTargets.reduce((s:number,t:any)=>s+(t.target_amount||0),0)
    const mActual = mCases.reduce((s:number,c:any)=>s+(c.amount||0),0)
    monthlyTrend.push({ month: m, target: mTarget, actual: mActual, rate: mTarget > 0 ? Math.round(mActual/mTarget*100) : 0 })
  }

  // Funnel 分析
  const funnelStages = ['進行中', '已出貨', '待出貨', '失敗']
  const funnel: {stage:string,count:number,amount:number,rate:number}[] = []
  const totalCount = (allCases||[]).length
  let cumCount = 0
  for (const stage of funnelStages) {
    const stageCases = (allCases||[]).filter(c => c.stage === stage)
    const count = stageCases.length
    cumCount += count
    const amount = stageCases.reduce((s:number,c:any)=>s+(c.amount||0),0)
    funnel.push({ 
      stage, 
      count, 
      amount,
      rate: totalCount > 0 ? Math.round(cumCount/totalCount*100) : 0 
    })
  }

  // 業務績效排名
  const repPerf: Record<string,{target:number,actual:number,amount:number}> = {}
  for (const t of (ytdTargets||[])) {
    if (!repPerf[t.rep_name]) repPerf[t.rep_name] = { target: 0, actual: 0, amount: 0 }
    repPerf[t.rep_name].target += t.target_amount
  }
  for (const c of (ytdCases||[])) {
    if (repPerf[c.rep]) repPerf[c.rep].actual += c.amount||0
  }
  for (const c of (allCases||[])) {
    if (repPerf[c.rep]) repPerf[c.rep].amount += c.amount||0
  }
  const repRanking = Object.entries(repPerf).map(([rep, v]) => ({
    rep,
    target: v.target,
    actual: v.actual,
    amount: v.amount,
    rate: v.target > 0 ? Math.round(v.actual/v.target*100) : 0,
  })).sort((a,b) => b.actual - a.actual)

  // 經銷商排名
  const dealerPerf: Record<string,{count:number,amount:number,expected:number}> = {}
  for (const c of (allCases||[])) {
    if (!dealerPerf[c.dealer]) dealerPerf[c.dealer] = { count: 0, amount: 0, expected: 0 }
    dealerPerf[c.dealer].count++
    dealerPerf[c.dealer].amount += c.amount||0
    dealerPerf[c.dealer].expected += c.expected||0
  }
  const dealerRanking = Object.entries(dealerPerf).map(([dealer, v]) => ({
    dealer,
    count: v.count,
    amount: v.amount,
    expected: v.expected,
  })).sort((a,b) => b.amount - a.amount).slice(0, 10)

  // 過期預警 (出貨日已過但尚未出貨)
  const today = new Date().toISOString().slice(0,10)
  const expiring = (allCases||[]).filter(c => 
    c.stage !== '已出貨' && c.stage !== '失敗' && c.ship_date && c.ship_date < today
  ).map(c => ({
    rep: c.rep,
    dealer: c.dealer,
    end_customer: c.end_customer,
    ship_date: c.ship_date,
    amount: c.amount,
    stage: c.stage,
    daysOverdue: Math.floor((new Date().getTime() - new Date(c.ship_date!).getTime()) / (1000*60*60*24))
  })).sort((a,b) => b.daysOverdue - a.daysOverdue).slice(0, 10)

  // 個人達成表
  const summary = (targets||[]).map(t => ({
    rep: t.rep_name,
    target: t.target_amount,
    actual: actual[t.rep_name] || 0,
    rate: t.target_amount > 0 ? Math.round(((actual[t.rep_name]||0) / t.target_amount) * 100) : 0
  })).sort((a,b) => b.rate - a.rate)

  const totalTarget = (targets||[]).reduce((s,r)=>s+r.target_amount,0)
  const totalActual = (cases||[]).reduce((s:number,c:any)=>s+(c.amount||0),0)
  const totalRate = totalTarget > 0 ? Math.round(totalActual/totalTarget*100) : 0

  return NextResponse.json({ 
    summary, 
    year, 
    month,
    totalTarget,
    totalActual,
    totalRate,
    ytd: { target: ytdTargetSum, actual: ytdActualSum, rate: ytdRate },
    monthlyTrend,
    funnel,
    repRanking,
    dealerRanking,
    expiring,
  })
}
