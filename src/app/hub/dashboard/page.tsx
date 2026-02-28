'use client'

import React, { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { Bot, ClipboardList, Zap, CheckCircle, TrendingUp, Clock, Activity, Server, Database, Users, BarChart3, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

// Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode; name?: string}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode; name?: string}) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return (
      <div className="flex items-center gap-2 text-sm p-4 rounded-xl"
        style={{background: 'oklch(0.18 0.02 260)', color: 'oklch(0.55 0.02 260)'}}>
        <AlertCircle size={14} />{this.props.name || '元件'} 載入中...
      </div>
    )
    return this.props.children
  }
}

type AgentData = {
  name: string; role: string; total: number; completed: number
  todayCompleted: number; successRate: number; isActive: boolean
}
type RecentTask = { id: number; title: string; completedAt: string; assignee: string }
type RunningTask = { id: number; title: string; assignee: string; updatedAt: string }
type TokenTrendPoint = { date: string; tokens: number; cost: number }
type DashboardData = {
  statusCounts: Record<string, number>; totalTasks: number; weekCompleted: number
  completionRate: number; agents: AgentData[]; recentCompleted: RecentTask[]
  runningTasks: RunningTask[]; tokenTrend: TokenTrendPoint[]
}

const AGENT_COLORS: Record<string, string> = {
  travis: 'oklch(0.60 0.22 260)', blake: 'oklch(0.65 0.20 145)',
  rex: 'oklch(0.65 0.22 300)', oscar: 'oklch(0.65 0.22 220)',
  warren: 'oklch(0.65 0.22 60)', griffin: 'oklch(0.65 0.22 20)',
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{background: 'oklch(0.16 0.015 260)', border: '1px solid oklch(0.22 0.02 260)'}}>
      <div className="p-3 rounded-xl shrink-0" style={{background: `${color}22`}}>
        <Icon size={20} style={{color}} />
      </div>
      <div>
        <p className="text-xs font-medium mb-1" style={{color: 'oklch(0.55 0.02 260)'}}>{label}</p>
        <p className="text-2xl font-bold" style={{color: 'oklch(0.92 0.01 260)'}}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{color: 'oklch(0.50 0.02 260)'}}>{sub}</p>}
      </div>
    </div>
  )
}

function AgentCard({ agent }: { agent: AgentData }) {
  const color = AGENT_COLORS[agent.name.toLowerCase()] || 'oklch(0.60 0.10 260)'
  return (
    <div className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{background: 'oklch(0.16 0.015 260)', border: '1px solid oklch(0.22 0.02 260)'}}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{background: color}}>
          {agent.name.slice(0,1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{color: 'oklch(0.90 0.01 260)'}}>{agent.name}</p>
          <p className="text-xs truncate" style={{color: 'oklch(0.55 0.02 260)'}}>{agent.role}</p>
        </div>
        {agent.isActive && (
          <span className="ml-auto w-2 h-2 rounded-full shrink-0" style={{background: 'oklch(0.65 0.20 145)'}} />
        )}
      </div>
      <div className="flex justify-between text-xs mb-2" style={{color: 'oklch(0.55 0.02 260)'}}>
        <span>完成 {agent.completed}</span>
        <span>成功率 {agent.successRate}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{background: 'oklch(0.22 0.02 260)'}}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{width: `${agent.successRate}%`, background: color}} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      const d = await fetch('/api/hub/dashboard').then(r => r.json())
      if (d && !d.error) { setData(d); setLastUpdated(new Date()) }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t) }, [])

  const cardBg = {background: 'oklch(0.16 0.015 260)', border: '1px solid oklch(0.22 0.02 260)'}
  const textMuted = {color: 'oklch(0.55 0.02 260)'}
  const textPrimary = {color: 'oklch(0.90 0.01 260)'}

  return (
    <div className="min-h-screen p-6" style={{background: 'oklch(0.11 0.012 260)'}}>
      <div className="max-w-7xl mx-auto">
        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/hub" className="inline-flex items-center gap-1 text-xs mb-2 transition-colors hover:opacity-80"
              style={textMuted}>← Back to Hub</Link>
            <Breadcrumb items={[{label:'Hub',href:'/hub'},{label:'Dashboard'}]} />
            <h1 className="text-2xl font-bold mt-1" style={textPrimary}>Clawd Dashboard</h1>
            <p className="text-sm" style={textMuted}>系統即時監控中心 · 每 30 秒自動重整</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80"
            style={{...cardBg, ...textMuted}}>
            <RefreshCw size={14} />
            {lastUpdated ? lastUpdated.toLocaleTimeString('zh-TW') : '載入中'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-t-indigo-500 rounded-full animate-spin"
              style={{borderColor: 'oklch(0.22 0.02 260)', borderTopColor: 'oklch(0.55 0.25 280)'}} />
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-64 rounded-2xl" style={cardBg}>
            <div className="text-center">
              <AlertCircle size={32} className="mx-auto mb-2" style={{color: 'oklch(0.55 0.20 20)'}} />
              <p style={textMuted}>載入失敗，請重試</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={ClipboardList} label="待執行" value={data.statusCounts['待執行'] || 0}
                sub={`共 ${data.totalTasks} 個任務`} color="oklch(0.65 0.22 220)" />
              <StatCard icon={Zap} label="執行中" value={data.statusCounts['執行中'] || 0}
                sub="Agent 運作中" color="oklch(0.75 0.18 80)" />
              <StatCard icon={CheckCircle} label="已完成" value={data.statusCounts['已完成'] || 0}
                sub={`本週 ${data.weekCompleted} 個`} color="oklch(0.65 0.20 145)" />
              <StatCard icon={TrendingUp} label="完成率" value={`${data.completionRate}%`}
                sub="歷史總覽" color="oklch(0.60 0.22 280)" />
            </div>

            {/* Middle row: system + chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System monitor */}
              <div className="rounded-2xl p-5" style={cardBg}>
                <div className="flex items-center gap-2 mb-4">
                  <Server size={16} style={{color: 'oklch(0.60 0.22 280)'}} />
                  <h2 className="font-semibold text-sm" style={textPrimary}>系統狀態</h2>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{background: 'oklch(0.65 0.20 145 / 0.2)', color: 'oklch(0.65 0.20 145)'}}>
                    ● 正常
                  </span>
                </div>
                <ErrorBoundary name="系統監控">
                  <div className="space-y-3">
                    {[
                      { icon: Activity, label: 'Gateway', value: 'Running :18789' },
                      { icon: Database, label: '任務總數', value: `${data.totalTasks} 個` },
                      { icon: Users, label: '活躍 Agents', value: `${data.agents.filter(a=>a.isActive).length} / ${data.agents.length}` },
                    ].map(({icon: Icon, label, value}) => (
                      <div key={label} className="flex items-center gap-3 py-2"
                        style={{borderBottom: '1px solid oklch(0.20 0.015 260)'}}>
                        <Icon size={14} style={{color: 'oklch(0.55 0.22 280)'}} />
                        <span className="text-xs flex-1" style={textMuted}>{label}</span>
                        <span className="text-xs font-medium" style={textPrimary}>{value}</span>
                      </div>
                    ))}
                  </div>
                </ErrorBoundary>
              </div>

              {/* Token trend */}
              <div className="rounded-2xl p-5" style={cardBg}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={16} style={{color: 'oklch(0.60 0.22 280)'}} />
                  <h2 className="font-semibold text-sm" style={textPrimary}>Token 趨勢（近 7 天）</h2>
                </div>
                {data.tokenTrend.length > 0 ? (
                  <Line
                    data={{
                      labels: data.tokenTrend.map(d => d.date.slice(5)),
                      datasets: [{
                        label: 'Tokens',
                        data: data.tokenTrend.map(d => d.tokens),
                        borderColor: 'oklch(0.60 0.22 280)',
                        backgroundColor: 'oklch(0.60 0.22 280 / 0.1)',
                        fill: true, tension: 0.4, pointRadius: 3,
                      }]
                    }}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { color: 'oklch(0.20 0.015 260)' }, ticks: { color: 'oklch(0.50 0.02 260)', font: {size: 10} } },
                        y: { grid: { color: 'oklch(0.20 0.015 260)' }, ticks: { color: 'oklch(0.50 0.02 260)', font: {size: 10} } }
                      }
                    }}
                    height={160}
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center" style={textMuted}>
                    <p className="text-sm">尚無資料</p>
                  </div>
                )}
              </div>
            </div>

            {/* Agents grid */}
            {data.agents.length > 0 && (
              <div className="rounded-2xl p-5" style={cardBg}>
                <div className="flex items-center gap-2 mb-4">
                  <Bot size={16} style={{color: 'oklch(0.60 0.22 280)'}} />
                  <h2 className="font-semibold text-sm" style={textPrimary}>Agent 狀態總覽</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {data.agents.map(agent => <AgentCard key={agent.name} agent={agent} />)}
                </div>
              </div>
            )}

            {/* Tasks tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Running */}
              <div className="rounded-2xl p-5" style={cardBg}>
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} style={{color: 'oklch(0.75 0.18 80)'}} />
                  <h2 className="font-semibold text-sm" style={textPrimary}>執行中任務</h2>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{background: 'oklch(0.75 0.18 80 / 0.15)', color: 'oklch(0.75 0.18 80)'}}>
                    {data.runningTasks.length}
                  </span>
                </div>
                {data.runningTasks.length === 0 ? (
                  <p className="text-sm text-center py-6" style={textMuted}>目前無執行中任務</p>
                ) : (
                  <div className="space-y-2">
                    {data.runningTasks.map((t, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 text-xs"
                        style={{borderBottom: i < data.runningTasks.length - 1 ? '1px solid oklch(0.20 0.015 260)' : 'none'}}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse"
                          style={{background: 'oklch(0.75 0.18 80)'}} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium" style={textPrimary}>{t.title}</p>
                          <p style={textMuted}>{t.assignee}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent completed */}
              <div className="rounded-2xl p-5" style={cardBg}>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={16} style={{color: 'oklch(0.65 0.20 145)'}} />
                  <h2 className="font-semibold text-sm" style={textPrimary}>最近完成任務</h2>
                </div>
                {data.recentCompleted.length === 0 ? (
                  <p className="text-sm text-center py-6" style={textMuted}>尚無完成紀錄</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentCompleted.map((t, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 text-xs"
                        style={{borderBottom: i < data.recentCompleted.length - 1 ? '1px solid oklch(0.20 0.015 260)' : 'none'}}>
                        <CheckCircle size={12} className="mt-0.5 shrink-0" style={{color: 'oklch(0.65 0.20 145)'}} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium" style={textPrimary}>{t.title}</p>
                          <p style={textMuted}>{t.assignee} · {new Date(t.completedAt).toLocaleDateString('zh-TW')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="text-center text-xs pb-4" style={textMuted}>
              William Hub — Clawd Dashboard · © 2026
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
