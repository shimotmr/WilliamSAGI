import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '7')
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Query model_usage_log for last N days
  const { data: logs, error } = await supabase
    .from('model_usage_log')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 })
  }
  
  // Group by agent and model
  const agentStats: Record<string, { tokens: number; cost: number; requests: number }> = {}
  const modelStats: Record<string, { provider: string; tokens: number; cost: number; requests: number }> = {}
  
  for (const log of logs || []) {
    // By agent
    if (!agentStats[log.agent]) {
      agentStats[log.agent] = { tokens: 0, cost: 0, requests: 0 }
    }
    agentStats[log.agent].tokens += log.total_tokens || 0
    agentStats[log.agent].cost += parseFloat(log.cost_estimate) || 0
    agentStats[log.agent].requests += 1
    
    // By model
    const modelKey = log.model
    if (!modelStats[modelKey]) {
      modelStats[modelKey] = { provider: log.provider, tokens: 0, cost: 0, requests: 0 }
    }
    modelStats[modelKey].tokens += log.total_tokens || 0
    modelStats[modelKey].cost += parseFloat(log.cost_estimate) || 0
    modelStats[modelKey].requests += 1
  }
  
  // Format agent ranking
  const agentRanking = Object.entries(agentStats)
    .map(([agent, stats]) => ({
      agent,
      total_tokens: stats.tokens,
      total_cost: stats.cost,
      request_count: stats.requests,
      success_rate: 100
    }))
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 10)
  
  // Format model distribution
  const modelDistribution = Object.entries(modelStats)
    .map(([name, stats]) => ({
      name,
      provider: stats.provider,
      model: name,
      tokens: stats.tokens,
      cost: stats.cost,
      count: stats.requests
    }))
    .sort((a, b) => b.cost - a.cost)
  
  // Calculate today stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayLogs = (logs || []).filter((log: any) => new Date(log.created_at) >= today)
  
  const todayStats = {
    total_requests: todayLogs.length,
    total_tokens_in: todayLogs.reduce((sum: number, log: any) => sum + (log.input_tokens || 0), 0),
    total_tokens_out: todayLogs.reduce((sum: number, log: any) => sum + (log.output_tokens || 0), 0),
    total_tokens: todayLogs.reduce((sum: number, log: any) => sum + (log.total_tokens || 0), 0),
    total_cost: todayLogs.reduce((sum: number, log: any) => sum + parseFloat(log.cost_estimate || 0), 0),
    success_rate: 100
  }
  
  return NextResponse.json({
    status: 'success',
    data: {
      today: todayStats,
      modelDistribution,
      agentRanking
    }
  })
}
