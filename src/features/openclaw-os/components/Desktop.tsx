'use client'

import { Activity, Bot, CheckSquare, FileText, HeartPulse, MessageSquare, Workflow } from 'lucide-react'
import type { OsAppId, WebOsData } from '@/features/openclaw-os/types'
import { GlassPanel, MetricCard } from '@/features/openclaw-os/components/shared'

const icons = {
  tasks: CheckSquare,
  telegram: MessageSquare,
  reports: FileText,
  events: Activity,
  sessions: Workflow,
  agents: Bot,
  health: HeartPulse,
}

export function Desktop({ data, onOpenApp, onContextMenu }: { data: WebOsData; onOpenApp: (id: OsAppId) => void; onContextMenu: (x: number, y: number) => void }) {
  const shortcuts: Array<{ id: OsAppId; label: string; detail: string }> = [
    { id: 'tasks', label: 'Task Grid', detail: 'Active lanes & task inspector' },
    { id: 'telegram', label: 'Telegram', detail: 'Realtime command console' },
    { id: 'reports', label: 'Reports', detail: 'Recent delivery archive' },
    { id: 'events', label: 'Events', detail: 'Trace anomalies & handoffs' },
    { id: 'sessions', label: 'Sessions', detail: 'Runtime and lease surface' },
    { id: 'agents', label: 'Agents', detail: 'Load radar' },
    { id: 'health', label: 'Health', detail: 'Guard and gateway status' },
  ]

  return (
    <div className="relative h-full overflow-hidden rounded-[32px] border border-white/8 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.34)]" onContextMenu={(event) => { event.preventDefault(); onContextMenu(event.clientX, event.clientY) }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,234,212,0.18),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_55%_80%,rgba(251,113,133,0.14),transparent_20%),linear-gradient(180deg,#08161f_0%,#07131b_45%,#040b10_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_38%)] opacity-80" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="relative z-10 grid h-full grid-cols-[1.15fr_0.85fr] gap-5 max-xl:grid-cols-1">
        <div className="flex flex-col justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.36em] text-cyan-100/35">
              <span>OpenClaw desktop</span>
              <span className="rounded-full border border-white/10 bg-white/6 px-2 py-1 text-[10px] tracking-[0.24em] text-white/45">Focus mode</span>
            </div>
            <div className="mt-4 max-w-3xl text-5xl font-semibold leading-tight text-white max-md:text-3xl">把 dashboard 打掉，換成真的 operations desktop。</div>
            <div className="mt-4 max-w-2xl text-base leading-7 text-white/62">這不是卡片牆。它該像一台桌面 OS：有 app、有視窗、有通知、有任務焦點，能讓人直接工作。</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shortcuts.map((shortcut) => {
              const Icon = icons[shortcut.id]
              return (
                <button key={shortcut.id} onClick={() => onOpenApp(shortcut.id)} className="group rounded-[26px] border border-white/10 bg-black/18 p-4 text-left backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/8 hover:shadow-[0_22px_60px_rgba(0,0,0,0.28)] focus:outline-none focus:ring-2 focus:ring-cyan-300/30">
                  <div className="flex items-center gap-3 text-white"><div className="rounded-2xl bg-white/8 p-3"><Icon className="h-5 w-5" /></div><span className="text-base font-medium">{shortcut.label}</span></div>
                  <div className="mt-4 text-sm leading-6 text-white/55">{shortcut.detail}</div>
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid gap-4">
          <GlassPanel className="p-4">
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <MetricCard label="Active now" value={data.summary.activeNow} tone="positive" />
              <MetricCard label="Pending now" value={data.summary.pendingNow} tone="neutral" />
              <MetricCard label="Completed today" value={data.summary.completedToday} tone="warning" />
              <MetricCard label="Anomalies" value={data.summary.anomalousEvents24h} tone="warning" />
            </div>
          </GlassPanel>
          <GlassPanel className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.28em] text-white/35">Desktop widgets</div>
              <div className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">Live</div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/8 bg-white/4 p-3 text-sm text-white/72">Tasks running · {data.lanes.running.map((task) => `#${task.id}`).join(', ') || 'none'}</div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-3 text-sm text-white/72">Telegram guard · {data.telegram.guardHealthy ? 'healthy' : 'needs attention'}</div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-3 text-sm text-white/72">Latest report · {data.reports[0]?.title || 'none yet'}</div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
