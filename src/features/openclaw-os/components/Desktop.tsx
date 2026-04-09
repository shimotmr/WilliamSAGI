'use client'

import { Activity, Bot, CheckSquare, FileText, HeartPulse, MessageSquare, Workflow } from 'lucide-react'
import type { OsAppId, WebOsData } from '@/features/openclaw-os/types'
import { GlassPanel, MetricCard, StatusDot } from '@/features/openclaw-os/components/shared'
import { openClawOsTones } from '@/features/openclaw-os/types'

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
  const shortcuts: Array<{ id: OsAppId; label: string; detail: string; badge: string }> = [
    { id: 'tasks', label: 'Task Grid', detail: 'Active lanes & fast triage', badge: `${data.summary.activeNow} active` },
    { id: 'telegram', label: 'Telegram', detail: 'Realtime operator channel', badge: data.telegram.guardHealthy ? 'guard ok' : 'guard alert' },
    { id: 'reports', label: 'Reports', detail: 'Recent delivery archive', badge: `${data.summary.reportsReady} ready` },
    { id: 'events', label: 'Events', detail: 'Trace anomalies & handoffs', badge: `${data.summary.anomalousEvents24h} alerts` },
    { id: 'sessions', label: 'Sessions', detail: 'Runtime and lease surface', badge: `${data.sessions.length} live` },
    { id: 'agents', label: 'Agents', detail: 'Load radar & ownership', badge: `${data.agents.length} agents` },
    { id: 'health', label: 'Health', detail: 'Guard and gateway status', badge: data.summary.anomalousEvents24h ? 'needs review' : 'stable' },
  ]

  return (
    <div
      className="relative h-full overflow-hidden rounded-[36px] border border-white/8 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.34)]"
      onContextMenu={(event) => {
        event.preventDefault()
        onContextMenu(event.clientX, event.clientY)
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(94,234,212,0.14),transparent_20%),radial-gradient(circle_at_52%_82%,rgba(251,113,133,0.16),transparent_22%),linear-gradient(180deg,#07131b_0%,#091923_38%,#040a0f_100%)]" />
      <div className="absolute inset-x-[8%] top-[-18%] h-[44%] rounded-full bg-cyan-300/10 blur-[110px]" />
      <div className="absolute bottom-[-14%] left-[18%] h-[36%] w-[48%] rounded-full bg-sky-400/10 blur-[110px]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_16%,transparent_84%,rgba(255,255,255,0.03))]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute inset-x-6 top-6 h-32 rounded-[28px] border border-white/8 bg-white/[0.025] backdrop-blur-[2px]" />

      <div className="relative z-10 grid h-full grid-cols-[minmax(0,1.25fr)_360px] gap-5 max-[1200px]:grid-cols-1">
        <div className="flex min-h-0 flex-col gap-5">
          <GlassPanel className="rounded-[30px] border-white/10 bg-transparent p-6">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.34em] text-cyan-100/42">
              <span>OpenClaw desktop</span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] tracking-[0.22em] text-cyan-100/78">operator focus</span>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-white/34">Operations desktop</div>
                <div className="mt-3 max-w-2xl text-sm leading-6 text-white/54">桌面保留狀態與捷徑；主要內容交給 app windows。背景只做定錨，不搶畫面。</div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    `active ${data.summary.activeNow}`,
                    `pending ${data.summary.pendingNow}`,
                    data.telegram.guardHealthy ? 'guard healthy' : 'guard alert',
                    `${data.summary.anomalousEvents24h} anomalies`,
                  ].map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/62">{item}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/18 p-4 shadow-[0_22px_60px_rgba(0,0,0,0.26)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.28em] text-white/36">Focus rail</div>
                    <div className="mt-2 text-lg font-semibold text-white">今天先處理最吵的訊號</div>
                  </div>
                  <StatusDot color={data.summary.anomalousEvents24h ? openClawOsTones.red : openClawOsTones.green} />
                </div>
                <div className="mt-4 space-y-3 text-sm text-white/68">
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">Running now · {data.lanes.running.slice(0, 3).map((task) => `#${task.id}`).join(', ') || 'none'}</div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">Telegram guard · {data.telegram.guardHealthy ? 'healthy and synced' : 'needs operator review'}</div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">Latest delivery · {data.reports[0]?.title || 'no report yet'}</div>
                </div>
              </div>
            </div>
          </GlassPanel>

          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shortcuts.map((shortcut) => {
              const Icon = icons[shortcut.id]
              return (
                <button
                  key={shortcut.id}
                  onClick={() => onOpenApp(shortcut.id)}
                  className="group rounded-[28px] border border-white/10 bg-black/16 p-4 text-left backdrop-blur-md transition duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/8 hover:shadow-[0_22px_60px_rgba(0,0,0,0.28)] focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 text-white">
                      <div className="rounded-[18px] border border-white/8 bg-white/7 p-3">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-base font-medium">{shortcut.label}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/34">Launch app</div>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/55">{shortcut.badge}</span>
                  </div>
                  <div className="mt-4 text-sm leading-6 text-white/58">{shortcut.detail}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 max-[1200px]:grid-cols-2 max-sm:grid-cols-1">
          <GlassPanel className="rounded-[30px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/35">System pulse</div>
                <div className="mt-2 text-lg font-semibold text-white">Core metrics</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">live</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricCard label="Active" value={data.summary.activeNow} tone="positive" />
              <MetricCard label="Pending" value={data.summary.pendingNow} tone="neutral" />
              <MetricCard label="Done today" value={data.summary.completedToday} tone="warning" />
              <MetricCard label="Alerts" value={data.summary.anomalousEvents24h} tone="warning" />
            </div>
          </GlassPanel>

          <GlassPanel className="rounded-[30px] p-4">
            <div className="text-[10px] uppercase tracking-[0.28em] text-white/35">Agent load</div>
            <div className="mt-3 space-y-3">
              {data.agents.slice(0, 4).map((agent) => (
                <div key={agent.name} className="rounded-2xl border border-white/8 bg-white/4 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-white"><StatusDot color={agent.color} />{agent.name}</div>
                    <div className="text-xs text-white/45">{agent.running}/{agent.total}</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(10, (agent.running / Math.max(1, agent.total)) * 100))}%`, background: agent.color }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="rounded-[30px] p-4 max-[1200px]:col-span-2 max-sm:col-span-1">
            <div className="text-[10px] uppercase tracking-[0.28em] text-white/35">Quick brief</div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-white/62">
              <div className="rounded-2xl border border-white/8 bg-white/4 p-3">Top pending · {data.lanes.pending[0] ? `#${data.lanes.pending[0].id} ${data.lanes.pending[0].title}` : 'No pending queue'}</div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-3">Recent session · {data.sessions[0]?.sessionId || 'No active session surface'}</div>
              <div className="rounded-2xl border border-dashed border-white/10 bg-transparent p-3 text-white/42">Desktop stays quiet; open a window for detail.</div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
