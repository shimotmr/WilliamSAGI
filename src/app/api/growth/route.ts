// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 30

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // 1. 任務完成量趨勢（近30天，依日期統計已完成）
  const { data: tasks } = await supabase
    .from('board_tasks')
    .select('completed_at, created_at, status')
    .gte('created_at', since)

  // 依日期統計完成數
  const trendMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split('T')[0]
    trendMap[key] = 0
  }
  for (const t of tasks || []) {
    if (t.status === '已完成' && t.completed_at) {
      const key = t.completed_at.split('T')[0]
      if (key in trendMap) trendMap[key]++
    }
  }
  const trend = Object.entries(trendMap).map(([date, count]) => ({ date, count }))
  const total = trend.reduce((s, d) => s + d.count, 0)
  const avgPerDay = total > 0 ? Math.round(total / 30) : 0

  // 2. 報告產出趨勢（近30天，依類型分類）
  const { data: reports } = await supabase
    .from('reports')
    .select('type, created_at')
    .gte('created_at', since)

  const reportMap: Record<string, Record<string, number>> = {}
  for (const key of Object.keys(trendMap)) reportMap[key] = {}
  for (const r of reports || []) {
    const key = r.created_at?.split('T')[0]
    if (key && key in reportMap) {
      const t = r.type?.toLowerCase() || 'report'
      const cat = t.includes('research') || t.includes('研究') ? 'research'
        : t.includes('review') || t.includes('審查') ? 'review'
        : t.includes('design') || t.includes('設計') ? 'design'
        : t.includes('analys') || t.includes('分析') ? 'analysis'
        : 'report'
      reportMap[key][cat] = (reportMap[key][cat] || 0) + 1
    }
  }
  const reportTrend = Object.entries(reportMap).map(([date, counts]) => ({ date, ...counts }))

  // 3. 系統能力擴展記錄（最新20筆 capabilities）
  const { data: capabilities } = await supabase
    .from('capabilities')
    .select('id, title, description, category, added_at')
    .order('added_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    trend,
    summary: {
      total,
      avgPerDay,
      cumulative: trend.reduce((acc: number[], d) => {
        acc.push((acc[acc.length - 1] || 0) + d.count)
        return acc
      }, [])
    },
    reportTrend,
    capabilities: capabilities || []
  })
}
