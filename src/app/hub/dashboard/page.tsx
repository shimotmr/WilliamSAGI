'use client'

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { Target, Code, Palette, Search, BookOpen, PenTool, BarChart3, Mail, Bot, ClipboardList, Zap, CheckCircle, TrendingUp, Users, PieChart, Clock, Check } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'

import Breadcrumb from '@/components/Breadcrumb'
import AgentRanking from '@/app/hub/components/AgentRanking'
import ModelQuotaOverview from '@/app/hub/components/ModelQuotaOverview'
import ModelTrendChart from '@/app/hub/components/ModelTrendChart'
import SystemMonitor from '@/app/hub/components/SystemMonitor'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

type AgentData = {
  name: string
  role: string
  total: number
  completed: number
  todayCompleted: number
  successRate: number
  currentTask: string | null
  isActive: boolean
}

type RecentTask = {
  id: number
  title: string
  completedAt: string
  assignee: string
}

type RunningTask = {
  id: number
  title: string
  assignee: string
  updatedAt: string
  description: string | null
}

type TokenTrendPoint = {
  date: string
  tokens: number
  cost: number
}

type DashboardData = {
  statusCounts: Record<string, number>
  totalTasks: number
  weekCompleted: number
  completionRate: number
  agents: AgentData[]
  recentCompleted: RecentTask[]
  runningTasks: RunningTask[]
  tokenTrend: TokenTrendPoint[]
}

// Dynamic color generation for agents
const generateAgentColor = (name: string): string => {
  const colors = [
    '#ef4444', // red
    '#3b82f6', // blue 
    '#a855f7', // purple
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#6366f1', // indigo
    '#ec4899', // pink
    '#8b5cf6', // violet
    '#84cc16', // lime
  ]
  // Generate consistent color based on name hash
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff
  }
  return colors[Math.abs(hash) % colors.length]
}

// Dynamic icon mapping
const getAgentIcon = (name: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    'Travis': <Target size={18} />,
    'main': <Target size={18} />,
    'Coder': <Code size={18} />,
    'coder': <Code size={18} />,
    'coder-b': <Code size={18} />,
    'Designer': <Palette size={18} />,
    'designer': <Palette size={18} />,
    'Inspector': <Search size={18} />,
    'inspector': <Search size={18} />,
    'Researcher': <BookOpen size={18} />,
    'researcher': <BookOpen size={18} />,
    'Writer': <PenTool size={18} />,
    'writer': <PenTool size={18} />,
    'Analyst': <BarChart3 size={18} />,
    'analyst': <BarChart3 size={18} />,
    'Secretary': <Mail size={18} />,
    'secretary': <Mail size={18} />,
    'trader': <BarChart3 size={18} />,
  }
  return iconMap[name] || <Bot size={18} />
}

function getAgentColor(name: string): string {
  return generateAgentColor(name)
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return '剛剛'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  return `${Math.floor(diff / 86400)} 天前`
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hub/system-status')
      .then(r => r.json())
      .then(d => { if (d && !d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/hub/system-status')
        .then(r => r.json())
        .then(d => { if (d && !d.error) setData(d) })
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const chartData = data ? {
    labels: ['待執行', '執行中', '已完成'],
    datasets: [{
      data: [
        data.statusCounts['待執行'] || 0,
        data.statusCounts['執行中'] || 0,
        data.statusCounts['已完成'] || 0,
      ],
      backgroundColor: ['#facc15', '#60a5fa', '#4ade80'],
      borderColor: ['#1e293b', '#1e293b', '#1e293b'],
      borderWidth: 3,
      hoverOffset: 8,
    }],
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e5e7eb',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 13 },
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
      },
    },
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-500/[0.07] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-purple-500/[0.05] rounded-full blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground text-sm mb-4 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Back to Hub
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                <Bot size={20} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Clawd Dashboard</h1>
                <p className="text-foreground-muted text-sm">系統即時監控中心 · 自動更新</p>
              </div>
            </div>
            <div className="hidden sm:block text-right text-xs text-foreground-subtle">
              每 30 秒自動重整
            </div>
          </div>
        </header>

        <Breadcrumb items={[{label:'Hub',href:'/hub'},{label:'Dashboard'}]} />

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center text-foreground-muted py-20">載入失敗</div>
        ) : (
          <>
            {/* System Status Monitor */}
            <SystemMonitor />

            {/* Model Quota Overview */}
            <ModelQuotaOverview />

            {/* Model Usage Trend Chart */}
            <ModelTrendChart />

            {/* Agent Ranking - Doughnut Chart */}
            <AgentRanking />

            {/* KPI Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: '總任務數', value: data.totalTasks, color: '#60a5fa', icon: <ClipboardList size={14} /> },
                { label: '執行中', value: data.statusCounts['執行中'] || 0, color: '#facc15', icon: <Zap size={14} /> },
                { label: '本週完成', value: data.weekCompleted, color: '#4ade80', icon: <CheckCircle size={14} /> },
                { label: '完成率', value: `${data.completionRate}%`, color: '#c084fc', icon: <TrendingUp size={14} /> },
              ].map(item => (
                <Link key={item.label} href="/board" className="group rounded-xl border border-border bg-card backdrop-blur-sm p-5 hover:border-border-strong hover:brightness-110 transition-all duration-300 block">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-foreground-muted">{item.icon}</span>
                    <span className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">{item.label}</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight" style={{ color: item.color }}>
                    {item.value}
                  </div>
                </Link>
              ))}
            </div>

            {/* Agent Cards */}
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users size={14} /> Agent 狀態總覽
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.agents.map(agent => {
                  const color = getAgentColor(agent.name)
                  const icon = getAgentIcon(agent.name)
                  return (
                    <div
                      key={agent.name}
                      className="group rounded-xl border p-5 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
                      style={{
                        borderColor: `${color}30`,
                        background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>
                            {icon}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{agent.name}</div>
                            <div className="text-[10px] text-foreground-subtle">{agent.role}</div>
                          </div>
                        </div>
                        {/* Status light */}
                        <div className="relative">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${agent.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`}
                          />
                          {agent.isActive && (
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-40" />
                          )}
                        </div>
                      </div>

                      {/* Current task */}
                      {agent.currentTask && (
                        <div className="mb-3 px-2.5 py-1.5 rounded-md bg-background-elevated border border-border">
                          <div className="text-[10px] text-foreground-muted mb-0.5">執行中</div>
                          <div className="text-xs text-foreground truncate">{agent.currentTask}</div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] text-foreground-subtle mb-0.5">今日完成</div>
                          <div className="text-xl font-bold" style={{ color }}>{agent.todayCompleted}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-foreground-subtle mb-0.5">總完成</div>
                          <div className="text-xl font-bold text-foreground">{agent.completed}</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${agent.successRate}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                        />
                      </div>
                      <div className="text-[10px] text-foreground-subtle mt-1 text-right">{agent.successRate}% 完成率</div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Running Tasks Section */}
            {data.runningTasks && data.runningTasks.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Zap size={14} className="text-yellow-400" /> 當前任務進度
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.runningTasks.map(task => {
                    const color = getAgentColor(task.assignee)
                    return (
                      <div
                        key={task.id}
                        className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 backdrop-blur-sm p-4 hover:border-yellow-500/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            <span className="text-xs text-yellow-400 font-medium">執行中</span>
                          </div>
                          <span className="text-[10px] text-foreground-subtle">#{task.id}</span>
                        </div>
                        <h3 className="text-sm font-medium text-foreground mb-2 line-clamp-2">{task.title}</h3>
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-[10px] px-2 py-0.5 rounded"
                            style={{ color, background: `${color}15` }}
                          >
                            {task.assignee}
                          </span>
                          <span className="text-[10px] text-foreground-subtle">
                            {timeAgo(task.updatedAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Token Trend Section */}
            {data.tokenTrend && data.tokenTrend.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp size={14} /> Token 消耗趨勢（近 7 天）
                </h2>
                <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
                  <div className="h-[200px]">
                    <Line data={{
                      labels: data.tokenTrend.map(d => d.date.slice(5)),
                      datasets: [
                        {
                          label: 'Tokens',
                          data: data.tokenTrend.map(d => d.tokens),
                          borderColor: '#8b5cf6',
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          fill: true,
                          tension: 0.4,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                        },
                        {
                          label: 'Cost ($)',
                          data: data.tokenTrend.map(d => d.cost * 1000),
                          borderColor: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.05)',
                          fill: true,
                          tension: 0.4,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                          yAxisID: 'y1',
                        },
                      ],
                    }} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { mode: 'index', intersect: false },
                      scales: {
                        x: {
                          grid: { color: '#334155' },
                          ticks: { color: '#94a3b8' },
                        },
                        y: {
                          grid: { color: '#334155' },
                          ticks: { color: '#94a3b8', callback: (v) => Number(v).toLocaleString() },
                          position: 'left',
                        },
                        y1: {
                          grid: { display: false },
                          ticks: { color: '#10b981', callback: (v) => '$' + Number(v).toFixed(2) },
                          position: 'right',
                        },
                      },
                      plugins: {
                        legend: { labels: { color: '#e2e8f0' } },
                      },
                    }} />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                    {data.tokenTrend.slice(-7).map((d, i) => (
                      <div key={i} className="text-center">
                        <div className="text-lg font-bold text-purple-400">{Math.round(d.tokens / 1000)}K</div>
                        <div className="text-[10px] text-foreground-muted">{d.date.slice(5)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Chart + Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              {/* Doughnut Chart */}
              <div className="lg:col-span-2 rounded-xl border border-border bg-card backdrop-blur-sm p-6">
                <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <PieChart size={14} /> 任務分布
                </h2>
                <div className="h-[260px] flex items-center justify-center">
                  {chartData && <Doughnut data={chartData} options={chartOptions} />}
                </div>
                {/* Inline stats */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                  {[
                    { label: '待執行', value: data.statusCounts['待執行'] || 0, color: '#facc15' },
                    { label: '執行中', value: data.statusCounts['執行中'] || 0, color: '#60a5fa' },
                    { label: '已完成', value: data.statusCounts['已完成'] || 0, color: '#4ade80' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[10px] text-foreground-muted mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="lg:col-span-3 rounded-xl border border-border bg-card backdrop-blur-sm p-6">
                <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock size={14} /> 最近完成任務
                </h2>
                <div className="space-y-1">
                  {data.recentCompleted.length === 0 ? (
                    <div className="text-foreground-subtle text-sm py-8 text-center">暫無已完成任務</div>
                  ) : (
                    data.recentCompleted.map((task, i) => {
                      const color = getAgentColor(task.assignee)
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/30 transition-colors group"
                        >
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center self-stretch">
                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                            {i < data.recentCompleted.length - 1 && (
                              <div className="w-px flex-1 bg-border mt-1" />
                            )}
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate group-hover:brightness-110 transition-colors">
                              #{task.id} {task.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color, background: `${color}15` }}>
                                {task.assignee}
                              </span>
                              <span className="text-[10px] text-foreground-subtle">{timeAgo(task.completedAt)}</span>
                            </div>
                          </div>
                          {/* Check */}
                          <div className="text-green-500/60 flex-shrink-0"><Check size={14} /></div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <footer className="mt-8 text-center text-foreground-subtle text-xs tracking-wide">
          William Hub — Clawd Dashboard · © 2026
        </footer>
      </div>
    </main>
  )
}
