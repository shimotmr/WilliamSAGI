"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase-client'

interface DailyCost {
  date: string
  cost: number
  tokens: number
}

interface AgentCost {
  agent: string
  cost: number
  tokens: number
}

interface ModelCost {
  model: string
  cost: number
  tokens: number
}

const AGENT_COLORS: Record<string, string> = {
  travis: '#06b6d4', blake: '#3b82f6', rex: '#8b5cf6',
  oscar: '#f59e0b', warren: '#10b981', griffin: '#ef4444',
}

const PIE_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1']

export function CostAnalytics() {
  const [daily, setDaily] = useState<DailyCost[]>([])
  const [byAgent, setByAgent] = useState<AgentCost[]>([])
  const [byModel, setByModel] = useState<ModelCost[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCost, setTotalCost] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: raw } = await supabase
      .from('model_usage_log')
      .select('agent,model,total_tokens,cost_estimate,created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    if (!raw || raw.length === 0) {
      setLoading(false)
      return
    }

    // Daily aggregation
    const dailyMap: Record<string, { cost: number; tokens: number }> = {}
    const agentMap: Record<string, { cost: number; tokens: number }> = {}
    const modelMap: Record<string, { cost: number; tokens: number }> = {}
    let tc = 0, tt = 0

    for (const r of raw) {
      const date = r.created_at?.split('T')[0] || 'unknown'
      const cost = Number(r.cost_estimate) || 0
      const tokens = Number(r.total_tokens) || 0
      const agent = (r.agent || 'unknown').toLowerCase()
      const model = r.model || 'unknown'

      tc += cost
      tt += tokens

      if (!dailyMap[date]) dailyMap[date] = { cost: 0, tokens: 0 }
      dailyMap[date].cost += cost
      dailyMap[date].tokens += tokens

      if (!agentMap[agent]) agentMap[agent] = { cost: 0, tokens: 0 }
      agentMap[agent].cost += cost
      agentMap[agent].tokens += tokens

      if (!modelMap[model]) modelMap[model] = { cost: 0, tokens: 0 }
      modelMap[model].cost += cost
      modelMap[model].tokens += tokens
    }

    setDaily(Object.entries(dailyMap).map(([date, v]) => ({ date, ...v })))
    setByAgent(Object.entries(agentMap).map(([agent, v]) => ({ agent, ...v })).sort((a, b) => b.cost - a.cost))
    setByModel(Object.entries(modelMap).map(([model, v]) => ({ model, ...v })).sort((a, b) => b.cost - a.cost))
    setTotalCost(tc)
    setTotalTokens(tt)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  const maxDailyCost = Math.max(...daily.map(d => d.cost), 0.01)
  const totalAgentCost = byAgent.reduce((s, a) => s + a.cost, 0) || 1
  const maxModelCost = Math.max(...byModel.map(m => m.cost), 0.01)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-4">
          <p className="text-xs text-gray-500 mb-1">7 日總成本</p>
          <p className="text-2xl font-bold text-cyan-400">${totalCost.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4">
          <p className="text-xs text-gray-500 mb-1">總 Token</p>
          <p className="text-2xl font-bold text-blue-400">{(totalTokens / 1000000).toFixed(2)}M</p>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4">
          <p className="text-xs text-gray-500 mb-1">使用模型數</p>
          <p className="text-2xl font-bold text-purple-400">{byModel.length}</p>
        </div>
      </div>

      {/* Daily Cost Line Chart (CSS-based) */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">📈 7 日費用趨勢</h3>
        <div className="flex items-end gap-1 h-40">
          {daily.map((d, i) => {
            const h = Math.max((d.cost / maxDailyCost) * 100, 2)
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-cyan-400">${d.cost.toFixed(2)}</span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all hover:from-cyan-500 hover:to-cyan-300"
                  style={{ height: `${h}%` }}
                  title={`${d.date}: $${d.cost.toFixed(2)} / ${(d.tokens/1000).toFixed(0)}K tokens`}
                />
                <span className="text-[10px] text-gray-600">{d.date.slice(5)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Agent Pie Chart (CSS donut) */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">🤖 Agent 費用分佈</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Donut via conic-gradient */}
          <div className="relative w-40 h-40 shrink-0">
            <div
              className="w-full h-full rounded-full"
              style={{
                background: buildConicGradient(byAgent.map((a, i) => ({
                  pct: (a.cost / totalAgentCost) * 100,
                  color: AGENT_COLORS[a.agent] || PIE_COLORS[i % PIE_COLORS.length],
                }))),
              }}
            />
            <div className="absolute inset-4 rounded-full bg-[#0a0a0f] flex items-center justify-center">
              <span className="text-xs text-gray-500">${totalCost.toFixed(0)}</span>
            </div>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {byAgent.map((a, i) => (
              <div key={a.agent} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: AGENT_COLORS[a.agent] || PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="text-gray-400 capitalize">{a.agent}</span>
                <span className="text-gray-500 ml-auto">${a.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model Bar Chart */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">⚙️ 模型費用排行</h3>
        <div className="space-y-2">
          {byModel.slice(0, 10).map((m, i) => {
            const pct = (m.cost / maxModelCost) * 100
            return (
              <div key={m.model} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-36 truncate shrink-0" title={m.model}>
                  {m.model.split('/').pop()}
                </span>
                <div className="flex-1 h-5 bg-white/[0.03] rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-16 text-right">${m.cost.toFixed(2)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function buildConicGradient(slices: { pct: number; color: string }[]) {
  let acc = 0
  const stops: string[] = []
  for (const s of slices) {
    stops.push(`${s.color} ${acc}% ${acc + s.pct}%`)
    acc += s.pct
  }
  return `conic-gradient(${stops.join(', ')})`
}
