'use client'

import { ChevronDown, ChevronRight, FileText, HeartPulse, House, MessageSquare, RefreshCcw, Settings2, Sparkles, Workflow } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { GlassPanel, MetricCard, SectionTitle, StatusDot } from '@/features/openclaw-os/components/shared'
import type { WebOsData } from '@/features/openclaw-os/types'
import { openClawOsTones } from '@/features/openclaw-os/types'

type MobileTab = 'home' | 'tasks' | 'inbox' | 'reports' | 'settings'

type ExpandableCardProps = {
  id: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  tone: string
  expanded: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}

function ExpandableCard({ id, title, subtitle, icon: Icon, tone, expanded, onToggle, children }: ExpandableCardProps) {
  return (
    <GlassPanel className="overflow-hidden rounded-[28px] p-0">
      <button
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-white/5 active:scale-[0.99]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: `${tone}44`, background: `linear-gradient(180deg, ${tone}2b, rgba(255,255,255,0.05))` }}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{title}</div>
            <div className="truncate text-xs text-white/52">{subtitle}</div>
          </div>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-white/62" /> : <ChevronRight className="h-4 w-4 text-white/62" />}
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden border-t border-white/8 px-4 py-4">{children}</div>
      </div>
    </GlassPanel>
  )
}

export function MobileDashboard({ data, onRefresh, refreshing = false }: { data: WebOsData; onRefresh?: () => Promise<void> | void; refreshing?: boolean }) {
  const [tab, setTab] = useState<MobileTab>('home')
  const [expanded, setExpanded] = useState<string>('tasks')
  const [pull, setPull] = useState(0)
  const startY = useRef<number | null>(null)

  const cards = useMemo(() => ([
    {
      id: 'tasks',
      title: 'Tasks',
      subtitle: `${data.summary.activeNow} 個執行中 · ${data.summary.pendingNow} 個待排`,
      tone: openClawOsTones.blue,
      icon: Workflow,
      render: (
        <div className="space-y-3">
          {data.lanes.running.slice(0, 4).map((task) => (
            <div key={task.id} className="rounded-2xl border border-white/8 bg-white/4 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">#{task.id} {task.title}</div>
                  <div className="mt-1 text-xs text-white/48">{task.assignee} · {task.priority || '—'} · {task.status}</div>
                </div>
                <div className="rounded-full bg-cyan-400/12 px-2 py-1 text-[11px] text-cyan-200">{task.progress ?? 0}%</div>
              </div>
            </div>
          ))}
          {!data.lanes.running.length ? <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-white/48">現在沒有執行中任務。</div> : null}
        </div>
      ),
    },
    {
      id: 'telegram',
      title: 'Telegram',
      subtitle: data.telegram.guardHealthy ? 'Guard 正常' : 'Guard 需要注意',
      tone: openClawOsTones.green,
      icon: MessageSquare,
      render: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-3 py-3 text-sm text-white/72">
            <span>Gateway / Guard</span>
            <div className="flex items-center gap-2"><StatusDot color={data.telegram.guardHealthy ? openClawOsTones.green : openClawOsTones.red} /><span>{data.telegram.guardHealthy ? 'healthy' : 'attention'}</span></div>
          </div>
          {data.telegram.messages.slice(0, 3).map((message) => (
            <div key={message.id} className="rounded-2xl border border-white/8 bg-black/18 p-3">
              <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-white/38">
                <span>{message.senderLabel}</span>
                <span>{message.relative}</span>
              </div>
              <div className="mt-2 line-clamp-3 text-sm leading-6 text-white/72">{message.body}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'reports',
      title: 'Reports',
      subtitle: `${data.summary.reportsReady} 份可交付`,
      tone: openClawOsTones.amber,
      icon: FileText,
      render: (
        <div className="space-y-3">
          {data.reports.slice(0, 4).map((report) => (
            <div key={report.id} className="rounded-2xl border border-white/8 bg-white/4 p-3">
              <div className="text-sm font-medium text-white">{report.title}</div>
              <div className="mt-1 text-xs text-white/48">{report.author} · {report.type} · {report.relative}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'health',
      title: 'Health',
      subtitle: `${data.summary.anomalousEvents24h} 個異常事件`,
      tone: openClawOsTones.red,
      icon: HeartPulse,
      render: (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Suppressed" value={data.watchtower.dispatchSuppressed} tone="warning" />
          <MetricCard label="Handoffs" value={data.watchtower.leaseHandoffs} tone="neutral" />
          <MetricCard label="Harness fail" value={data.watchtower.harnessFailed} tone="warning" />
          <MetricCard label="Signals" value={data.watchtower.completedSignals} tone="positive" />
        </div>
      ),
    },
    {
      id: 'agents',
      title: 'Agents',
      subtitle: `${data.agents.length} 個 agent`,
      tone: '#c084fc',
      icon: Sparkles,
      render: (
        <div className="space-y-3">
          {data.agents.map((agent) => (
            <div key={agent.name} className="rounded-2xl border border-white/8 bg-white/4 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white"><StatusDot color={agent.color} />{agent.name}</div>
                <div className="text-xs text-white/48">running {agent.running} / total {agent.total}</div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(8, (agent.running / Math.max(1, agent.total)) * 100))}%`, background: agent.color }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ]), [data])

  const visibleCards = cards.filter((card) => {
    if (tab === 'home') return ['tasks', 'telegram', 'reports', 'health', 'agents'].includes(card.id)
    if (tab === 'tasks') return card.id === 'tasks'
    if (tab === 'inbox') return card.id === 'telegram'
    if (tab === 'reports') return card.id === 'reports'
    return ['health', 'agents'].includes(card.id)
  })

  return (
    <main
      className="min-h-screen bg-[#07131b] px-3 pb-28 pt-4 text-white"
      onTouchStart={(event) => {
        if (window.scrollY <= 0) startY.current = event.touches[0]?.clientY ?? null
      }}
      onTouchMove={(event) => {
        if (startY.current == null || refreshing) return
        const distance = (event.touches[0]?.clientY ?? 0) - startY.current
        if (distance > 0) setPull(Math.min(88, distance * 0.45))
      }}
      onTouchEnd={async () => {
        if (pull > 52 && onRefresh) await onRefresh()
        startY.current = null
        setPull(0)
      }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-3 flex justify-center transition-all duration-200" style={{ height: pull ? 24 + pull * 0.45 : 14, opacity: pull ? 1 : 0.55 }}>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 text-[11px] uppercase tracking-[0.22em] text-white/45">
            <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{pull > 52 ? '放開重新整理' : '下拉更新'}</span>
          </div>
        </div>

        <GlassPanel className="rounded-[32px] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.34em] text-cyan-100/38">OpenClaw mobile</div>
              <div className="mt-3 text-2xl font-semibold leading-tight text-white">把桌面濃縮成口袋版控制台。</div>
              <div className="mt-2 text-sm leading-6 text-white/58">快讀狀態、展開卡片、下拉刷新。手機不是縮圖，是另一個節奏。</div>
            </div>
            <button onClick={() => onRefresh?.()} className="rounded-2xl border border-white/10 bg-white/6 p-3 text-white/70 transition hover:bg-white/10 active:scale-95">
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetricCard label="Active" value={data.summary.activeNow} tone="positive" />
            <MetricCard label="Pending" value={data.summary.pendingNow} tone="neutral" />
            <MetricCard label="Reports" value={data.summary.reportsReady} tone="warning" />
            <MetricCard label="Events" value={data.summary.anomalousEvents24h} tone="warning" />
          </div>
        </GlassPanel>

        <div className="mt-4 space-y-3">
          {visibleCards.map((card) => (
            <ExpandableCard
              key={card.id}
              id={card.id}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              tone={card.tone}
              expanded={expanded === card.id}
              onToggle={(id) => setExpanded((current) => current === id ? '' : id)}
            >
              {card.render}
            </ExpandableCard>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(7,19,27,0.88)] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 rounded-[28px] border border-white/10 bg-black/24 px-2 py-2">
          {[
            { id: 'home' as const, label: 'Home', icon: House },
            { id: 'tasks' as const, label: 'Tasks', icon: Workflow },
            { id: 'inbox' as const, label: 'Inbox', icon: MessageSquare },
            { id: 'reports' as const, label: 'Reports', icon: FileText },
            { id: 'settings' as const, label: 'Settings', icon: Settings2 },
          ].map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[22px] px-2 py-2 text-[11px] transition"
                style={{ background: active ? 'linear-gradient(180deg, rgba(94,234,212,0.18), rgba(94,234,212,0.06))' : 'transparent', color: active ? openClawOsTones.text : 'rgba(236,248,255,0.52)' }}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
