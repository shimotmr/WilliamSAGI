// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getEventRulesSummary } from '@/lib/event-engine'

export const dynamic = 'force-dynamic'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const supabase = getSupabase()

    // 1. Task stats
    const { data: allTasks } = await supabase
      .from('board_tasks')
      .select('status')

    const taskStats = (allTasks || []).reduce((acc: Record<string, number>, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1
      return acc
    }, {})

    const total = allTasks?.length || 0
    const running = (taskStats['執行中'] || 0)
    const completed = (taskStats['已完成'] || 0)

    // 2. Today's token usage
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: tokenData } = await supabase
      .from('model_usage_log')
      .select('tokens_used, model, agent')
      .gte('created_at', todayStart.toISOString())

    const todayTokens = (tokenData || []).reduce((sum, row) => sum + (row.tokens_used || 0), 0)
    const topModel = getMostFrequent(tokenData || [], 'model')
    const topAgent = getMostFrequent(tokenData || [], 'agent')

    // 3. Health score
    const { data: healthData } = await supabase
      .from('system_health')
      .select('score, health_score, created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    const latestHealth = healthData?.[0]
    const healthScore = Number(latestHealth?.score ?? latestHealth?.health_score ?? 0)

    // 4. Agent activity (recent sessions)
    const { data: agentData } = await supabase
      .from('agent_jobs')
      .select('agent_name, status, model')
      .order('created_at', { ascending: false })
      .limit(20)

    const agents = (agentData || []).reduce((acc: Record<string, any>, row) => {
      const name = row.agent_name || 'unknown'
      if (!acc[name]) {
        acc[name] = { name, status: row.status, model: row.model, tasks: 0 }
      }
      acc[name].tasks++
      return acc
    }, {})

    // 5. Automation scripts count (from cron-like entries)
    const { count: automationCount } = await supabase
      .from('board_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('board', 'automation')
      .catch(() => ({ count: 0 })) as any

    // 6. Event rules
    const eventRules = getEventRulesSummary()

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
        lastCheck: latestHealth?.created_at || null,
      },
      agents: Object.values(agents),
      automation: {
        scriptCount: automationCount || 0,
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
