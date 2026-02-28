// ============================================================
// Agent Control Center v2 — Real-time from board_tasks
// ============================================================
'use client'

import {
  Bot, ClipboardList, Search, Palette, PenTool, Microscope,
  Code2, TrendingUp, ChevronRight, Monitor, ArrowLeft,
  Zap, Activity, Users, Loader2, RefreshCw, AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import React, { useState, useEffect, useCallback, useRef } from 'react'

import Breadcrumb from '@/components/Breadcrumb'

interface Agent {
  id: string
  name: string
  prefix: string
  role: string
  title: string
  description: string
  model_primary: string
  status: string
  color: string
  skills: string[]
  quotes: string[]
  last_status: string
  last_run_at: string
  currentTask: string | null
  activeTasks: number
  emoji: string
}

const POLL_INTERVAL_MS = 30_000 // 30 seconds

const workflows = [
  { name: '開發流程', flow: ['Designer', 'Coder', 'Inspector', 'Travis'], desc: '設計 → 實作 → 審查 → 驗收', color: '#3b82f6' },
  { name: '報告流程', flow: ['Researcher', 'Writer', 'Designer', 'Travis'], desc: '研究 → 撰寫 → 美化 → 驗收', color: '#8b5cf6' },
  { name: '簽核流程', flow: ['Secretary', 'Travis', 'William'], desc: '偵測 → 摘要 → 人工確認', color: '#f59e0b' },
]

const iconMap: Record<string, React.ElementType> = {
  Bot, ClipboardList, Search, Palette, PenTool, Microscope, Code2, TrendingUp,
}

function getIcon(emoji: string, size = 16) {
  const Icon = iconMap[emoji]
  return Icon ? <Icon size={size} /> : <Bot size={size} />
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function ArrowRight() {
  return <ChevronRight size={12} className="text-gray-700" />
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selected, setSelected] = useState<Agent | null>(null)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedRef = useRef<Agent | null>(null)
  selectedRef.current = selected

  const fetchAgents = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)

    try {
      const res = await fetch('/api/agents', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: Agent[] = await res.json()

      // Sort: Travis first, then active/working, then others
      const sorted = data.sort((a, b) => {
        if (a.id === 'main') return -1
        if (b.id === 'main') return 1
        if (a.activeTasks > 0 && b.activeTasks === 0) return -1
        if (b.activeTasks > 0 && a.activeTasks === 0) return 1
        if (a.status === 'active' && b.status !== 'active') return -1
        if (b.status === 'active' && a.status !== 'active') return 1
        return 0
      })

      setAgents(sorted)
      setError(null)
      setLastUpdated(new Date())

      // Keep selected agent in sync with fresh data
      const currentSelected = selectedRef.current
      if (currentSelected) {
        const fresh = sorted.find(a => a.id === currentSelected.id)
        if (fresh) setSelected(fresh)
      }
    } catch (err) {
      console.error('[AgentsPage] fetch error:', err)
      setError('無法取得最新資料，顯示上次快取')
      // Don't clear existing agents on error — show stale data
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load + polling
  useEffect(() => {
    fetchAgents()
    pollingRef.current = setInterval(() => fetchAgents(), POLL_INTERVAL_MS)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchAgents])

  function handleSelect(agent: Agent) {
    if (selected?.id === agent.id) {
      const quotes = agent.quotes || []
      if (quotes.length > 0) setQuoteIdx(i => (i + 1) % quotes.length)
    } else {
      setSelected(agent)
      setQuoteIdx(0)
    }
  }

  const activeCount = agents.filter(a => a.status === 'active').length
  const workingCount = agents.filter(a => a.activeTasks > 0).length

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <a href="/" className="text-foreground-muted text-sm hover:text-foreground transition mb-3 inline-flex items-center gap-1.5">
            <ArrowLeft size={14} />
            William Hub
          </a>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Monitor size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Agent Control Center</h1>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-foreground-muted flex items-center gap-1">
                    <Users size={10} />
                    {agents.length} Agents
                  </span>
                  <span className="text-xs text-emerald-500/70 flex items-center gap-1">
                    <Activity size={10} />
                    {activeCount} Online
                  </span>
                  {workingCount > 0 && (
                    <span className="text-xs text-blue-400/70 flex items-center gap-1">
                      <Zap size={10} />
                      {workingCount} Working
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Refresh button + last updated */}
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-[10px] text-foreground-disabled hidden sm:block">
                  {lastUpdated.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 更新
                </span>
              )}
              <button
                onClick={() => fetchAgents(true)}
                disabled={refreshing}
                title="手動刷新"
                className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:border-gray-600 transition disabled:opacity-40"
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/15 rounded-lg px-3 py-2">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
        </header>

        <Breadcrumb items={[{label:'Hub',href:'/hub'},{label:'Agents'}]} />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-foreground-muted" />
          </div>
        )}

        {/* Agent Cards Grid */}
        {!loading && (
          <section className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {agents.map((agent) => {
                const isOff = agent.status !== 'active'
                const isSel = selected?.id === agent.id
                const isWorking = agent.activeTasks > 0
                const color = agent.color || '#6b7280'

                return (
                  <button
                    key={agent.id}
                    onClick={() => handleSelect(agent)}
                    className={`relative text-left rounded-xl border p-3 sm:p-4 transition-all duration-200 group
                      ${isSel ? 'ring-1' : 'hover:border-gray-700/60'}
                      ${isOff ? 'opacity-50' : ''}`}
                    style={{
                      borderColor: isSel ? `${color}50` : 'rgba(31,41,55,0.4)',
                      background: isSel ? `${color}08` : 'rgba(17,24,39,0.3)',
                      boxShadow: isSel ? `0 0 0 2px ${color}30` : undefined,
                    }}
                  >
                    {/* Active task badge */}
                    {isWorking && (
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-blue-500/15 border border-blue-500/25 rounded-full px-1.5 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[9px] font-mono text-blue-400">{agent.activeTasks}</span>
                      </div>
                    )}

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5">
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0"
                        style={{ border: `2px solid ${color}50` }}>
                        <Image
                          src={`/avatars/${agent.name.toLowerCase()}.png`}
                          alt={agent.name}
                          fill
                          className="object-cover scale-[1.35]"
                        />
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111827] z-10 
                          ${isOff ? 'bg-gray-600' : isWorking ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-200 flex items-center gap-1.5">
                          {agent.name}
                          <span className="text-[10px] font-mono text-gray-600">{agent.prefix}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">{agent.title || agent.role}</div>
                      </div>
                    </div>

                    {/* Description */}
                    {agent.description && (
                      <div className="text-[11px] text-gray-500 mb-2 line-clamp-1 hidden sm:block">{agent.description}</div>
                    )}

                    {/* Current Task or idle status */}
                    <div className="text-[11px] text-foreground-subtle flex items-start gap-1.5">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        isOff ? 'bg-gray-700' : isWorking ? 'bg-blue-500/60' : 'bg-emerald-500/40'
                      }`} />
                      <span className="truncate leading-relaxed">
                        {agent.currentTask || (isOff ? '離線' : '待命中')}
                      </span>
                    </div>

                    {/* Multiple tasks indicator */}
                    {agent.activeTasks > 1 && (
                      <div className="text-[9px] text-blue-400/60 mt-1 ml-3">
                        +{agent.activeTasks - 1} 個任務執行中
                      </div>
                    )}

                    {/* Last active */}
                    {agent.last_run_at && (
                      <div className="text-[9px] text-foreground-disabled mt-1.5">{timeAgo(agent.last_run_at)}</div>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Detail Panel */}
        {selected && (
          <section className="mb-8 rounded-xl border p-4 sm:p-5 transition-all animate-in fade-in duration-200"
            style={{ borderColor: `${selected.color}25`, background: 'rgba(17,24,39,0.4)' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-lg"
                  style={{ border: `2px solid ${selected.color}40` }}>
                  <Image
                    src={`/avatars/${selected.name.toLowerCase()}.png`}
                    alt={selected.name}
                    fill
                    className="object-cover scale-[1.35]"
                  />
                </div>
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span style={{ color: selected.color }}>{getIcon(selected.emoji, 14)}</span>
                    {selected.name}
                    <span className="text-xs font-mono text-foreground-subtle">{selected.prefix}</span>
                  </div>
                  <div className="text-xs text-foreground-muted mt-0.5">{selected.title}</div>
                  <div className="text-[11px] text-foreground-subtle mt-0.5">{selected.role}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-foreground-subtle hover:text-foreground transition p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Description */}
            {selected.description && (
              <p className="text-sm text-foreground-muted mb-4 leading-relaxed">{selected.description}</p>
            )}

            {/* Skills */}
            {selected.skills && selected.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selected.skills.map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{ borderColor: `${selected.color}25`, color: `${selected.color}aa` }}>{s}</span>
                ))}
              </div>
            )}

            {/* Quote */}
            {selected.quotes && selected.quotes.length > 0 && (
              <div
                className="rounded-lg p-3 cursor-pointer transition-colors hover:bg-white/[0.02]"
                style={{ background: `${selected.color}06`, border: `1px solid ${selected.color}15` }}
                onClick={() => handleSelect(selected)}
              >
                <div className="text-sm text-foreground leading-relaxed">
                  「{selected.quotes[quoteIdx]}」
                </div>
                <div className="text-[10px] text-foreground-subtle mt-2 flex items-center gap-2">
                  點擊切換台詞
                  <span className="flex gap-1">
                    {selected.quotes.map((_, i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === quoteIdx ? 'bg-foreground-muted' : 'bg-foreground-disabled'}`} />
                    ))}
                  </span>
                </div>
              </div>
            )}

            {/* Status bar */}
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className={`w-2 h-2 rounded-full ${selected.status === 'active' ? 'bg-emerald-400' : 'bg-foreground-disabled'}`} />
              <span className="text-foreground-muted">{selected.model_primary}</span>
              {selected.activeTasks > 0 && (
                <>
                  <span className="text-foreground-disabled">·</span>
                  <span className="text-blue-400 flex items-center gap-1">
                    <Zap size={10} />
                    {selected.activeTasks} 個任務執行中
                  </span>
                </>
              )}
              <span className="text-foreground-disabled">·</span>
              <span className={selected.currentTask ? 'text-blue-400' : 'text-foreground-muted'}>
                {selected.currentTask || '待命中'}
              </span>
              {selected.last_run_at && (
                <>
                  <span className="text-foreground-disabled">·</span>
                  <span className="text-foreground-subtle">{timeAgo(selected.last_run_at)}</span>
                </>
              )}
            </div>

            {/* Last status */}
            {selected.last_status && (
              <div className="mt-2 text-[10px] text-foreground-subtle truncate">
                {selected.last_status}
              </div>
            )}
          </section>
        )}

        {/* Workflows */}
        <section className="mb-8">
          <h2 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap size={12} />
            Workflows
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {workflows.map((w) => (
              <div key={w.name} className="rounded-xl border border-border bg-card p-4">
                <div className="text-sm font-semibold mb-3" style={{ color: w.color }}>{w.name}</div>
                <div className="flex items-center flex-wrap gap-1.5 text-xs text-foreground-muted mb-2">
                  {w.flow.map((name, i) => {
                    const agent = agents.find(a => a.name === name)
                    return (
                      <span key={name} className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded border text-[11px]"
                          style={{
                            borderColor: agent ? `${agent.color}30` : 'rgba(107,114,128,0.3)',
                            color: agent ? agent.color : '#9ca3af',
                          }}>{name}</span>
                        {i < w.flow.length - 1 && <ArrowRight />}
                      </span>
                    )
                  })}
                </div>
                <div className="text-[11px] text-foreground-subtle">{w.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-[11px] text-foreground-subtle py-4">
          Agent Control Center v2 · Live from board_tasks · 每 30 秒自動刷新
        </footer>
      </div>
    </main>
  )
}
