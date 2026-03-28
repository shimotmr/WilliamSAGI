// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cache: 30 秒 TTL，避免每次都打 Supabase（健檢每小時跑 8 次，不需要即時數據）
export const revalidate = 30

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const supabase = getSupabase()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // 4 個查詢並行執行，從循序改為 Promise.all
    const [
      { data: allTasks },
      { data: tokenData },
      { data: agentsData },
      { data: recentTasks },
    ] = await Promise.all([
      supabase.from('board_tasks').select('status'),
      supabase.from('model_usage_log').select('total_tokens, model, agent').gte('created_at', todayStart.toISOString()),
      supabase.from('agents').select('id, status').eq('status', 'active'),
      supabase.from('board_tasks').select('assignee, status').order('updated_at', { ascending: false }).limit(20),
    ])

    // 1. Task stats
    const taskStats = (allTasks || []).reduce((acc: Record<string, number>, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1
      return acc
    }, {})

    const total = allTasks?.length || 0
    const running = (taskStats['執行中'] || 0)
    const completed = (taskStats['已完成'] || 0)

    // 2. Token usage
    const todayTokens = (tokenData || []).reduce((sum, row) => sum + (row.total_tokens || 0), 0)
    const topModel = getMostFrequent(tokenData || [], 'model')
    const topAgent = getMostFrequent(tokenData || [], 'agent')

    // 3. Health score
    const activeAgents = agentsData?.length || 0
    const healthScore = activeAgents >= 8 ? 95 : activeAgents >= 5 ? 80 : 50

    const agentActivity: Record<string, { name: string; status: string; tasks: number }> = {}
    for (const t of recentTasks || []) {
      const name = t.assignee || 'unknown'
      if (!agentActivity[name]) {
        agentActivity[name] = { name, status: t.status === '執行中' ? 'running' : 'idle', tasks: 0 }
      }
      agentActivity[name].tasks++
    }

    // 5. Event rules - 硬編碼
    const eventRules = [
      { type: 'task_completed', name: '任務完成通知', description: '任務完成後自動發送通知', enabled: true },
      { type: 'deployment_failed', name: '部署失敗自動修復', description: '部署失敗時建立修復任務', enabled: true },
      { type: 'high_token_usage', name: 'Token 過高告警', description: '今日 Token 超過 500K 時告警', enabled: true, threshold: 500000 },
    ]

    return NextResponse.json({
      openclaw: {
        status: 'online',
        uptime: formatUptime(process.uptime()),
        version: '2.0',
      },
      tasks: {
        total,
        running,
        completed,
        pending: total - running - completed,
        breakdown: taskStats,
      },
      tokens: {
        today: todayTokens,
        topModel: topModel || 'N/A',
        topAgent: topAgent || 'N/A',
        alert: todayTokens > 500000,
      },
      health: {
        score: healthScore,
        status: healthScore > 80 ? 'healthy' : healthScore > 60 ? 'warning' : 'critical',
        lastCheck: new Date().toISOString(),
      },
      agents: Object.values(agentActivity).slice(0, 10),
      automation: {
        scriptCount: 10,
      },
      eventRules,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getMostFrequent(data: any[], key: string): string | null {
  const counts: Record<string, number> = {}
  for (const row of data) {
    const val = row[key]
    if (val) counts[val] = (counts[val] || 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || null
}
