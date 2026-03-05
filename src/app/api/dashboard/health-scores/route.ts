// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get last 30 days of health logs
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: healthLogs, error } = await getSupabase()
    .from('health_logs')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by date and calculate average daily score
  const dailyScores: Record<string, { date: string; score: number; tokens: number; stuck: number }> = {}

  for (const log of healthLogs || []) {
    const date = new Date(log.created_at).toISOString().split('T')[0]
    if (!dailyScores[date]) {
      dailyScores[date] = { date, score: 0, tokens: 0, stuck: 0, count: 0 }
    }
    dailyScores[date].score += parseFloat(log.score) || 0
    dailyScores[date].stuck += log.stuck_task_count || 0
    dailyScores[date].count += 1
  }

  // Calculate averages
  const result = Object.values(dailyScores).map(d => ({
    date: d.date,
    score: d.count > 0 ? Math.round((d.score / d.count) * 10) / 10 : 0,
    stuckTasks: d.stuck
  }))

  return NextResponse.json({ 
    ok: true, 
    data: result 
  })
}
