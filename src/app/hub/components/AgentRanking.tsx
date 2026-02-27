'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Users, PieChart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

// Agent colors - consistent with dashboard theme
const agentColors = [
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // orange
  '#3b82f6', // blue
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
]

interface AgentRankingData {
  agent_id: string
  display_name: string
  total_tokens: number
  total_prompts: number
  total_cost: number
  activity_trend: 'high' | 'medium' | 'low'
}

interface ApiResponse {
  status: string
  data: {
    period: string
    total_agents: number
    rankings: AgentRankingData[]
  }
}

function getAgentColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff
  }
  return agentColors[Math.abs(hash) % agentColors.length]
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

function formatCost(cost: number): string {
  if (cost >= 1) return `$${cost.toFixed(2)}`
  return `$${cost.toFixed(4)}`
}

export default function AgentRanking() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)
  const [metric, setMetric] = useState<'tokens' | 'prompts' | 'cost'>('tokens')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/model-usage/by-agent?days=${days}&limit=10`)
      const json = await res.json()
      if (json.status === 'success') {
        setData(json)
        setError(null)
      } else {
        setError(json.error || 'Failed to fetch')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [days])

  // Prepare chart data
  const rankings = data?.data?.rankings || []
  const maxValue = rankings.length > 0 
    ? (metric === 'tokens' ? rankings[0].total_tokens 
      : metric === 'prompts' ? rankings[0].total_prompts 
      : rankings[0].total_cost)
    : 1

  const chartData = {
    labels: rankings.map(a => a.display_name || a.agent_id),
    datasets: [{
      data: rankings.map(a => 
        metric === 'tokens' ? a.total_tokens 
        : metric === 'prompts' ? a.total_prompts 
        : a.total_cost
      ),
      backgroundColor: rankings.map(a => getAgentColor(a.agent_id)),
      borderColor: '#1e293b',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            if (metric === 'cost') {
              return `${context.label}: ${formatCost(value)} (${percentage}%)`
            }
            return `${context.label}: ${formatNumber(value)} ${metric} (${percentage}%)`
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    }
  }

  if (loading && !data) {
    return (
      <section className="mb-8">
        <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
              <Users size={14} /> Agent 消耗排行
            </h2>
          </div>
          <div className="flex items-center justify-center h-[280px]">
            <div className="w-8 h-8 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  if (error || !data || rankings.length === 0) {
    return (
      <section className="mb-8">
        <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
              <Users size={14} /> Agent 消耗排行
            </h2>
            <button onClick={fetchData} className="text-foreground-muted hover:text-foreground text-xs">
              Retry
            </button>
          </div>
          <div className="text-center text-foreground-muted py-8">
            {error || 'No data available'}
          </div>
        </div>
      </section>
    )
  }

  const totalTokens = rankings.reduce((sum, a) => sum + a.total_tokens, 0)
  const totalPrompts = rankings.reduce((sum, a) => sum + a.total_prompts, 0)
  const totalCost = rankings.reduce((sum, a) => sum + a.total_cost, 0)

  return (
    <section className="mb-8">
      <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
            <Users size={14} /> Agent 消耗排行 - {days}天
          </h2>
          
          {/* Metric + Time selector */}
          <div className="flex items-center gap-2">
            <div className="flex rounded border border-border overflow-hidden">
              {(['tokens', 'prompts', 'cost'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-2 py-1 text-xs transition-colors ${
                    metric === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-foreground-muted hover:bg-slate-700'
                  }`}
                >
                  {m === 'cost' ? '$' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex rounded border border-border overflow-hidden">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-2 py-1 text-xs transition-colors ${
                    days === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-foreground-muted hover:bg-slate-700'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart + List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doughnut Chart */}
          <div className="h-[280px] flex items-center justify-center">
            <Doughnut data={chartData} options={chartOptions} />
          </div>

          {/* Rankings List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3">
              Top Consumers
            </div>

            {rankings.map((agent, index) => {
              const value = metric === 'tokens' ? agent.total_tokens 
                : metric === 'prompts' ? agent.total_prompts 
                : agent.total_cost
              const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
              const color = getAgentColor(agent.agent_id)

              return (
                <div
                  key={agent.agent_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-background-elevated transition-colors"
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-background-elevated border border-border flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: color }}
                      />
                      <span className="font-medium text-sm truncate">
                        {agent.display_name || agent.agent_id}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}CC)`
                        }}
                      />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold" style={{ color }}>
                      {metric === 'cost' ? formatCost(value) : formatNumber(value)}
                    </div>
                    <div className="text-[10px] text-foreground-subtle">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">
                {rankings.length}
              </div>
              <div className="text-[10px] text-foreground-subtle">Active Agents</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400">
                {formatNumber(totalTokens)}
              </div>
              <div className="text-[10px] text-foreground-subtle">Total Tokens</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">
                {rankings[0]?.display_name || rankings[0]?.agent_id || '—'}
              </div>
              <div className="text-[10px] text-foreground-subtle">Top Consumer</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
