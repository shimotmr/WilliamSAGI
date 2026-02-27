// ============================================================
// William Hub — Professional Dashboard v2
// ============================================================
'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const ThemeToggle = dynamic(() => import('./components/ThemeToggleWrapper'), {
  ssr: false,
  loading: () => <div className="w-10 h-10" />
})

// No default agents - load dynamically from API

interface Agent {
  name: string
  status: 'ok' | 'fail' | 'idle'
  activeTasks?: number
  currentTask?: string | null
}

// AgentStatus interface moved to agents API usage only

interface BoardTask {
  id: number
  board: 'agent' | 'william'
  priority: string
  title: string
  description: string | null
  result: string | null
  assignee: string
  status: string
  created_at: string
  updated_at: string
  completed_at: string | null
  acceptance_criteria: string | null
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | null
  next_run_at: string | null
}

interface Task {
  id: number
  agent: string
  task: string
  status: 'done' | 'in-progress' | 'planned'
}

const taskStatusColors = {
  'done': { dot: 'bg-emerald-400', text: 'text-emerald-400', label: '完成' },
  'in-progress': { dot: 'bg-amber-400', text: 'text-amber-400', label: '進行中' },
  'planned': { dot: 'bg-gray-500', text: 'text-gray-500', label: '待排' },
}

interface AppItem {
  name: string;
  desc: string;
  url: string;
  tag: string;
  accent: string;
  accentBg: string;
  borderColor: string;
  disabled?: boolean;
}

const apps: AppItem[] = [
  {
    name: 'Aurotek Portal',
    desc: '通路營業管理系統',
    url: 'https://aurotek-sales-portal.vercel.app',
    tag: '公司',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  {
    name: 'Travis Daily',
    desc: 'AI 動態 / 研究報告 / 技術筆記',
    url: 'https://travis-daily.vercel.app',
    tag: '專欄',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.25)',
  },
  {
    name: 'Task Board',
    desc: 'Travis + William 任務看板',
    url: '/board',
    tag: 'LIVE',
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  {
    name: 'Agent Prompts',
    desc: 'Agent 系統提示詞模板庫',
    url: '/prompts',
    tag: 'NEW',
    accent: '#8b5cf6',
    accentBg: 'rgba(139,92,246,0.08)',
    borderColor: 'rgba(139,92,246,0.25)',
  },
  {
    name: 'Disk Health',
    desc: '磁碟健康度監控與清理記錄',
    url: '/disk-health',
    tag: 'NEW',
    accent: '#10b981',
    accentBg: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  {
    name: 'Dashboard',
    desc: '任務統計 & Agent 狀態總覽',
    url: '/dashboard',
    tag: 'LIVE',
    accent: '#8b5cf6',
    accentBg: 'rgba(139,92,246,0.08)',
    borderColor: 'rgba(139,92,246,0.25)',
  },
  {
    name: 'Trading System',
    desc: '程式交易 / 策略回測 / 即時監控',
    url: '/trade',
    tag: 'LIVE',
    accent: '#10b981',
    accentBg: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  {
    name: 'Reports',
    desc: 'AI Reports / Markdown / Doc / PDF',
    url: '/reports',
    tag: 'LIVE',
    accent: '#06b6d4',
    accentBg: 'rgba(6,182,212,0.08)',
    borderColor: 'rgba(6,182,212,0.25)',
  },
  {
    name: 'Travis',
    desc: 'AI 多 Agent 控制台',
    url: '/agents',
    tag: 'LIVE',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.08)',
    borderColor: 'rgba(168,85,247,0.25)',
  },
  {
    name: 'Growth',
    desc: '系統與團隊成長趨勢分析',
    url: '/growth',
    tag: 'LIVE',
    accent: '#14b8a6',
    accentBg: 'rgba(20,184,166,0.08)',
    borderColor: 'rgba(20,184,166,0.25)',
  },
  {
    name: 'Rules Dashboard',
    desc: 'SOP 規則合規性檢查 / 紅綠燈健康狀態',
    url: '/rules',
    tag: 'LIVE',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  {
    name: 'RAG Testing',
    desc: 'RAG 測試題庫管理 / 批次上傳 / 測試執行',
    url: '/rag-testing',
    tag: 'LIVE',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.08)',
    borderColor: 'rgba(249,115,22,0.25)',
  },
]

// --- SVG Icons (stroke-based, unified style) ---
function IconAurotek({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="11" rx="1" />
      <path d="M7 10V6a5 5 0 0 1 10 0v4" />
      <line x1="3" y1="14" x2="21" y2="14" />
      <line x1="8" y1="14" x2="8" y2="21" />
      <line x1="16" y1="14" x2="16" y2="21" />
      <line x1="12" y1="14" x2="12" y2="21" />
    </svg>
  )
}

function IconTravisDaily({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="7" x2="17" y2="7" />
      <line x1="7" y1="11" x2="13" y2="11" />
      <line x1="7" y1="15" x2="11" y2="15" />
      <line x1="14" y1="13" x2="17" y2="13" />
      <line x1="14" y1="16" x2="17" y2="16" />
    </svg>
  )
}

function IconTrading({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="17 7 21 7 21 11" />
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="7" y1="21" x2="7" y2="17" />
      <line x1="11" y1="21" x2="11" y2="14" />
      <line x1="15" y1="21" x2="15" y2="16" />
    </svg>
  )
}

function IconTravis({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="12" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <circle cx="15" cy="10" r="1.5" />
      <line x1="9" y1="16" x2="9" y2="20" />
      <line x1="15" y1="16" x2="15" y2="20" />
      <line x1="6" y1="20" x2="18" y2="20" />
      <line x1="12" y1="4" x2="12" y2="1" />
      <circle cx="12" cy="1" r="0.5" fill={color} />
    </svg>
  )
}

function IconBoard({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
      <line x1="5" y1="6" x2="9" y2="6" />
      <line x1="5" y1="8" x2="7" y2="8" />
      <line x1="15" y1="6" x2="19" y2="6" />
      <line x1="15" y1="8" x2="17" y2="8" />
    </svg>
  )
}

function IconDashboard({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function IconReports({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  )
}

function IconGrowth({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

function IconRules({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function IconRAG({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

const iconMap: Record<string, React.FC<{ color: string }>> = {
  'Dashboard': IconDashboard,
  'Aurotek Portal': IconAurotek,
  'Travis Daily': IconTravisDaily,
  'Task Board': IconBoard,
  'Trading System': IconTrading,
  'Reports': IconReports,
  'Travis': IconTravis,
  'Growth': IconGrowth,
  'Rules Dashboard': IconRules,
  'RAG Testing': IconRAG,
}

// --- Helpers ---
function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function getDateStr(): string {
  const d = new Date()
  const tw = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  return `${days[tw.getUTCDay()]}, ${months[tw.getUTCMonth()]} ${tw.getUTCDate()}, ${tw.getUTCFullYear()}`
}

function StatusDot({ status }: { status: 'ok' | 'fail' | 'idle' }) {
  const colors = { ok: '#10b981', fail: '#ef4444', idle: '#6b7280' }
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: colors[status] }}
    />
  )
}

// --- Arrow Icon ---
function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

// ============================================================
// Page Component
// ============================================================
export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [tokens, setTokens] = useState({ today: 0, week: 0, month: 0, total: 0 })
  const [tasks, setTasks] = useState<Task[]>([])

  // Map database task statuses to homepage display statuses
  const mapTaskStatus = (dbStatus: string): 'done' | 'in-progress' | 'planned' => {
    switch (dbStatus) {
      case '已完成':
      case '已關閉':
        return 'done'
      case '執行中':
        return 'in-progress'
      case '待執行':
      case '待規劃':
      case '中期目標':
      case '長期目標':
      default:
        return 'planned'
    }
  }

  useEffect(() => {
    const loadTasks = async () => {
      try {
        console.log('🔍 William Hub - 載入任務資料...')
        
        const [activeResponse, doneResponse] = await Promise.all([
          fetch('/api/board?category=active'),
          fetch('/api/board?category=done')
        ])
        
        if (!activeResponse.ok || !doneResponse.ok) {
          throw new Error('API response not ok')
        }
        
        const [activeTasks, doneTasks] = await Promise.all([
          activeResponse.json(),
          doneResponse.json()
        ])
        
        console.log(`✅ 活動任務: ${Array.isArray(activeTasks) ? activeTasks.length : 0} 個`)
        console.log(`✅ 已完成任務: ${Array.isArray(doneTasks) ? doneTasks.length : 0} 個`)
        
        const allTasks: BoardTask[] = []
        
        // Add active tasks
        if (Array.isArray(activeTasks)) {
          allTasks.push(...activeTasks)
        }
        
        // Add recent completed tasks (last 3 days)
        if (Array.isArray(doneTasks)) {
          const threeDaysAgo = new Date()
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
          
          const recentlyCompleted = doneTasks.filter(task => 
            task.completed_at && new Date(task.completed_at) > threeDaysAgo
          )
          allTasks.push(...recentlyCompleted.slice(0, 3)) // Max 3 recent completed
        }
        
        // Sort by updated_at desc and limit to 8 tasks total
        const recentTasks = allTasks
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 8)
          .map((boardTask): Task => ({
            id: boardTask.id,
            agent: boardTask.assignee || 'System',
            task: boardTask.title,
            status: mapTaskStatus(boardTask.status)
          }))
        
        console.log(`✅ 最終任務列表: ${recentTasks.length} 個`)
        setTasks(recentTasks)
        
      } catch (error) {
        console.error('❌ 載入任務失敗:', error)
        setTasks([])
      }
    }
    
    loadTasks()
  }, [])

  useEffect(() => {
    fetch('/api/token-stats')
      .then(r => r.json())
      .then(d => { if (d && !d.error) setTokens(d) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Fetch all agents from agents table with their status
    fetch('/api/agents')
      .then(r => r.json())
      .then((agentData) => {
        if (Array.isArray(agentData)) {
          const agentList: Agent[] = agentData.map(agent => ({
            name: agent.name,
            status: (agent.activeTasks > 0 ? 'ok' : (agent.status === 'active' ? 'idle' : 'fail')) as 'ok' | 'fail' | 'idle',
            activeTasks: agent.activeTasks || 0,
            currentTask: agent.currentTask || null
          }))
          setAgents(agentList)
        }
      })
      .catch(() => {
        // Keep empty state on error
        setAgents([])
      })
  }, [])

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-5 py-12 sm:py-20">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white">
                W
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">William Hub</h1>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-foreground-muted text-sm ml-12">Command Center</p>
        </header>

        {/* Strategic Panel */}
        <section className="mb-8 rounded-xl border border-border bg-card backdrop-blur-sm">
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            {/* Top row: date + agents */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="text-sm text-foreground-muted font-medium tracking-wide">
                {getDateStr()}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {agents.map((a) => (
                  <div key={a.name} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <StatusDot status={a.status} />
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Token stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Today', value: tokens.today },
                { label: 'This Week', value: tokens.week },
                { label: 'This Month', value: tokens.month },
                { label: 'Total', value: tokens.total },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[11px] text-foreground-subtle uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">
                    {formatNumber(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tasks */}
        <section className="mb-8 rounded-xl border border-border bg-card backdrop-blur-sm">
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">Tasks</h2>
              <span className="text-xs text-foreground-subtle">{tasks.filter(t => t.status === 'done').length}/{tasks.length} done</span>
            </div>
            <div className="space-y-2.5">
              {tasks.map((t) => {
                const s = taskStatusColors[t.status]
                return (
                  <div key={t.id} className={`flex items-start gap-3 text-sm ${t.status === 'done' ? 'opacity-50' : ''}`}>
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <span className={`${t.status === 'done' ? 'line-through text-foreground-muted' : 'text-foreground'}`}>
                        <span className="text-foreground-subtle font-mono text-xs mr-1.5">#{t.id}</span>
                        {t.task}
                      </span>
                    </div>
                    <span className="text-xs text-foreground-subtle shrink-0">{t.agent}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* App Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {apps.map((app) => {
            const Icon = iconMap[app.name]
            const inner = (
              <div
                className={`group relative rounded-xl border p-5 sm:p-6 transition-all duration-200 ${
                  app.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer hover:translate-y-[-2px] hover:shadow-lg'
                }`}
                style={{
                  borderColor: app.borderColor,
                  background: app.accentBg,
                }}
              >
                {/* Tag */}
                <span
                  className={`absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full border ${
                    app.disabled 
                      ? 'border-gray-600/30 text-gray-500' 
                      : ''
                  }`}
                  style={{
                    ...(app.disabled ? {} : {
                      borderColor: app.borderColor,
                      color: app.accent,
                    })
                  }}
                >
                  {app.tag}
                </span>

                {/* Icon */}
                <div className="mb-3">
                  {Icon && <Icon color={app.accent} />}
                </div>

                {/* Text */}
                <h2 className="text-base font-semibold text-foreground mb-1">{app.name}</h2>
                <p className="text-sm text-foreground-muted leading-relaxed">{app.desc}</p>

                {/* Arrow */}
                {!app.disabled && (
                  <div className="absolute bottom-5 right-5 text-foreground-subtle group-hover:text-foreground transition-colors">
                    <ArrowRight />
                  </div>
                )}
              </div>
            )

            if (app.disabled) return <div key={app.name}>{inner}</div>
            return (
              <a key={app.name} href={app.url} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            )
          })}
        </section>

        {/* Footer */}
        <footer className="mt-14 text-center text-foreground-subtle text-xs tracking-wide">
          William Hub v2
        </footer>
      </div>
    </main>
  )
}
