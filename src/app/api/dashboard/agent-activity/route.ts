// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get agent jobs from last 30 days for activity stats
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: agentJobs, error } = await getSupabase()
    .from('agent_jobs')
    .select('*')
    .gte('spawned_at', thirtyDaysAgo.toISOString())
    .order('spawned_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by day - job counts and status
  const dailyActivity: Record<string, { date: string; total: number; completed: number; failed: number }> = {}

  for (const job of agentJobs || []) {
    const date = new Date(job.spawned_at).toISOString().split('T')[0]
    if (!dailyActivity[date]) {
      dailyActivity[date] = { date, total: 0, completed: 0, failed: 0 }
    }
    dailyActivity[date].total += 1
    if (job.status === 'completed') {
      dailyActivity[date].completed += 1
    } else if (job.status === 'failed') {
      dailyActivity[date].failed += 1
    }
  }

  const activityData = Object.values(dailyActivity)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date,
      totalJobs: d.total,
      completedJobs: d.completed,
      failedJobs: d.failed
    }))
    .slice(-30)

  // Get model usage for token consumption
  const { data: modelLogs } = await getSupabase()
    .from('model_usage_log')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  // Group by day for token consumption
  const dailyTokens: Record<string, { date: string; tokens: number; cost: number }> = {}

  for (const log of modelLogs || []) {
    const date = new Date(log.created_at).toISOString().split('T')[0]
    if (!dailyTokens[date]) {
      dailyTokens[date] = { date, tokens: 0, cost: 0 }
    }
    dailyTokens[date].tokens += log.total_tokens || 0
    dailyTokens[date].cost += parseFloat(log.cost_estimate) || 0
  }

  const tokenData = Object.values(dailyTokens)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date,
      tokens: d.tokens,
      cost: Math.round(d.cost * 100) / 100
    }))
    .slice(-30)

  // Weekly summary
  const weeklyTokens: Record<string, { week: string; tokens: number; jobs: number }> = {}
  
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    weeklyTokens[weekKey] = { week: weekKey, tokens: 0, jobs: 0 }
  }

  for (const log of modelLogs || []) {
    const logDate = new Date(log.created_at)
    const weekStart = new Date(logDate)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (weeklyTokens[weekKey]) {
      weeklyTokens[weekKey].tokens += log.total_tokens || 0
    }
  }

  for (const job of agentJobs || []) {
    const jobDate = new Date(job.spawned_at)
    const weekStart = new Date(jobDate)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (weeklyTokens[weekKey]) {
      weeklyTokens[weekKey].jobs += 1
    }
  }

  const weeklyData = Object.values(weeklyTokens)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map(w => ({
      week: w.week,
      tokens: w.tokens,
      jobs: w.jobs
    }))

  return NextResponse.json({ 
    ok: true, 
    dailyActivity: activityData,
    tokenConsumption: tokenData,
    weeklySummary: weeklyData
  })
}
