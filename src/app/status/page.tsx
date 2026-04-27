'use client'

import { useState, useCallback } from 'react'
import { useSmartPolling } from '../hooks/useSmartPolling'
import {
  Activity, Cpu, CheckCircle2, Clock, ListTodo,
  Zap, Shield, Bot, AlertTriangle, RefreshCw,
  Workflow, ChevronRight, ArrowUpRight, ArrowDownRight,
  Server, BarChart3
} from 'lucide-react'

// ─── Types ────────────────────────────────────
interface StatusData {
  openclaw: {
    status: 'online' | 'offline'
    uptime: string
    version: string
  }
  tasks: {
    total: number
    running: number
    completed: number
    pending: number
    breakdown: Record<string, number>
  }
  tokens: {
    today: number
    topModel: string
    topAgent: string
    alert: boolean
  }
  health: {
    score: number
    status: 'healthy' | 'warning' | 'critical'
    lastCheck: string | null
  }
  agents: Array<{
    name: string
    status: string
    model: string
    tasks: number
  }>
  automation: {
    scriptCount: number
  }
  eventRules: Array<{
    type: string
    name: string
    description: string
    enabled: boolean
    threshold?: number
  }>
  timestamp: string
}

// ─── Helpers ──────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function timeAgo(iso: string | null): string {
  if (!iso) return '從未'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '剛剛'
  if (mins < 60) return `${mins} 分鐘前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小時前`
  return `${Math.floor(hours / 24)} 天前`
}

const statusConfig = {
  online: { color: 'text-emerald-400', bg: 'bg-emerald-400', label: '線上', pulse: true },
  offline: { color: 'text-rose-400', bg: 'bg-rose-400', label: '離線', pulse: false },
}

const healthConfig = {
  healthy: { color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30', icon: Shield },
  warning: { color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/30', icon: AlertTriangle },
  critical: { color: 'text-rose-400', bg: 'from-rose-500/20 to-rose-500/5', border: 'border-rose-500/30', icon: AlertTriangle },
}

const agentEmoji: Record<string, string> = {
  travis: '', blake: '', rex: '', oscar: '', warren: '', griffin: '',
}

// ─── Components ───────────────────────────────

function GlowCard({ children, className = '', glow }: {
  children: React.ReactNode
  className?: string
  glow?: 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'none'
}) {
  const glowMap = {
    emerald: 'shadow-emerald-500/5 hover:shadow-emerald-500/10',
    amber: 'shadow-amber-500/5 hover:shadow-amber-500/10',
    rose: 'shadow-rose-500/5 hover:shadow-rose-500/10',
    sky: 'shadow-sky-500/5 hover:shadow-sky-500/10',
    purple: 'shadow-purple-500/5 hover:shadow-purple-500/10',
    none: '',
  }
  return (
    <div className={`
      relative rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent
      backdrop-blur-sm shadow-xl transition-all duration-300
      ${glowMap[glow || 'none']} ${className}
    `}>
      {children}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, sub, trend, color = 'text-white' }: {
  icon: typeof Activity
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | null
  color?: string
}) {
  return (
    <GlowCard className="p-5">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-white/[0.06]">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={`text-3xl font-bold tracking-tight ${color}`}>{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </GlowCard>
  )
}

function PulsingDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-3 w-3">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
    </span>
  )
}

function ProgressRing({ value, size = 120, strokeWidth = 8, color = '#34d399' }: {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(value, 100) / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} fill="none"
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  )
}

// ─── Main Page ────────────────────────────────
export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
      setLastRefresh(new Date())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useSmartPolling(fetchData, 30000, [fetchData])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">載入系統狀態...</p>
        </div>
      </main>
    )
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <GlowCard className="p-8 text-center max-w-md" glow="rose">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">無法連線</h2>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition">
            重試
          </button>
        </GlowCard>
      </main>
    )
  }

  if (!data) return null

  const sc = statusConfig[data.openclaw.status] || statusConfig.offline
  const hc = healthConfig[data.health.status] || healthConfig.healthy
  const HealthIcon = hc.icon

  const completionRate = data.tasks.total > 0
    ? Math.round((data.tasks.completed / data.tasks.total) * 100)
    : 0

  const healthColor = data.health.score > 80 ? '#34d399' : data.health.score > 60 ? '#fbbf24' : '#f87171'

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-purple-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">系統儀表板</h1>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
                <PulsingDot active={data.openclaw.status === 'online'} />
                <span className={`text-sm font-medium ${sc.color}`}>{sc.label}</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              WilliamSAGI · v{data.openclaw.version} · 已運行 {data.openclaw.uptime}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">
              更新於 {lastRefresh.toLocaleTimeString('zh-TW', { hour12: false })}
            </span>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition border border-white/[0.08]"
              title="重新整理"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </header>

        {/* Top metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={ListTodo}
            label="任務總數"
            value={data.tasks.total}
            sub={`${data.tasks.pending} 待執行`}
            color="text-white"
          />
          <MetricCard
            icon={Activity}
            label="執行中"
            value={data.tasks.running}
            color="text-amber-400"
          />
          <MetricCard
            icon={CheckCircle2}
            label="已完成"
            value={data.tasks.completed}
            sub={`${completionRate}% 完成率`}
            color="text-emerald-400"
            trend="up"
          />
          <MetricCard
            icon={Zap}
            label="今日 Token"
            value={formatNumber(data.tokens.today)}
            sub={data.tokens.topModel}
            color={data.tokens.alert ? 'text-rose-400' : 'text-sky-400'}
            trend={data.tokens.alert ? 'up' : null}
          />
        </div>

        {/* Health + Token detail row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Health Ring */}
          <GlowCard className={`p-6 bg-gradient-to-b ${hc.bg} ${hc.border}`} glow={data.health.status === 'healthy' ? 'emerald' : 'rose'}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <HealthIcon className={`w-4 h-4 ${hc.color}`} />
                  系統健康
                </h3>
                <p className={`text-xs mt-1 ${hc.color}`}>
                  {data.health.status === 'healthy' ? '一切正常' : data.health.status === 'warning' ? '需要關注' : '嚴重問題'}
                </p>
              </div>
              <span className="text-xs text-gray-600">
                {timeAgo(data.health.lastCheck)}
              </span>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <ProgressRing value={data.health.score} color={healthColor} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${hc.color}`}>{data.health.score}</span>
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Token usage detail */}
          <GlowCard className="p-6 col-span-1 lg:col-span-2">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4" />
              Token 消耗詳情
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-white">{formatNumber(data.tokens.today)}</p>
                <p className="text-xs text-gray-500 mt-1">今日消耗</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-300">{data.tokens.topModel}</p>
                <p className="text-xs text-gray-500 mt-1">最高模型</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-300">{data.tokens.topAgent}</p>
                <p className="text-xs text-gray-500 mt-1">最高 Agent</p>
              </div>
            </div>
            {data.tokens.alert && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-sm text-rose-300">Token 用量超過日常閾值，建議檢查任務排程</span>
              </div>
            )}
          </GlowCard>
        </div>

        {/* Agents + Event Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Agent List */}
          <GlowCard className="p-6" glow="purple">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4" />
              Agent 狀態
            </h3>
            <div className="space-y-3">
              {data.agents.length === 0 ? (
                <p className="text-gray-600 text-sm">目前無活躍 Agent</p>
              ) : (
                data.agents.map((agent) => (
                  <div
                    key={agent.name}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{agentEmoji[agent.name.toLowerCase()] || ''}</span>
                      <div>
                        <p className="font-medium text-sm capitalize">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.model || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{agent.tasks} 任務</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        agent.status === 'completed' || agent.status === '已完成'
                          ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                          : agent.status === 'running' || agent.status === '執行中'
                          ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                          : 'text-gray-400 bg-gray-500/10 border-gray-500/30'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlowCard>

          {/* Event Trigger Rules */}
          <GlowCard className="p-6" glow="sky">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-4">
              <Workflow className="w-4 h-4" />
              事件觸發引擎
            </h3>
            <div className="space-y-3">
              {data.eventRules.map((rule) => (
                <div
                  key={rule.type}
                  className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                      <p className="font-medium text-sm">{rule.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-500 ml-4">{rule.description}</p>
                  {rule.threshold && (
                    <p className="text-xs text-gray-600 ml-4 mt-1">
                      閾值: {formatNumber(rule.threshold)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </GlowCard>
        </div>

        {/* Automation + Task Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Automation */}
          <GlowCard className="p-6">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-4">
              <Server className="w-4 h-4" />
              自動化
            </h3>
            <p className="text-4xl font-bold text-white">{data.automation.scriptCount}</p>
            <p className="text-sm text-gray-500 mt-1">自動化腳本</p>
          </GlowCard>

          {/* Task breakdown */}
          <GlowCard className="p-6 col-span-1 lg:col-span-2">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" />
              任務看板分佈
            </h3>
            <div className="space-y-2">
              {Object.entries(data.tasks.breakdown).map(([status, count]) => {
                const pct = data.tasks.total > 0 ? Math.round((count / data.tasks.total) * 100) : 0
                const barColor =
                  status.includes('完成') ? 'bg-emerald-400' :
                  status.includes('執行') ? 'bg-amber-400' :
                  status.includes('待') ? 'bg-sky-400' :
                  status.includes('失敗') ? 'bg-rose-400' :
                  'bg-gray-500'
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-20 shrink-0 text-right">{status}</span>
                    <div className="flex-1 h-5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 shrink-0">{count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </GlowCard>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-700">
          WilliamSAGI Status · 自動更新每 30 秒 · {data.timestamp && new Date(data.timestamp).toLocaleString('zh-TW', { hour12: false })}
        </footer>
      </div>
    </main>
  )
}
