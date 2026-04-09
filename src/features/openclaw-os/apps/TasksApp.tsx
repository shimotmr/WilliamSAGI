'use client'

import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, CheckCircle2, Clock3, Loader2 } from 'lucide-react'
import type { TaskDetail, TaskItem, WebOsData } from '@/features/openclaw-os/types'
import { MetricCard, ScrollArea, SectionTitle } from '@/features/openclaw-os/components/shared'

function TaskList({ title, tasks, onPick }: { title: string; tasks: TaskItem[]; onPick: (id: number) => void }) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/8 bg-white/4 p-4">
      <div className="text-sm font-medium text-slate-100">{title}</div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <button key={task.id} onClick={() => onPick(task.id)} className="w-full rounded-2xl border border-white/8 bg-black/20 px-3 py-3 text-left transition hover:border-cyan-200/30 hover:bg-white/8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">#{task.id} {task.title}</div>
                <div className="mt-1 text-xs text-white/45">{task.assignee} · {task.priority} · {task.status}</div>
              </div>
              <ArrowUpRight className="mt-0.5 h-4 w-4 text-white/35" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function TasksApp({ data }: { data: WebOsData }) {
  const [selectedId, setSelectedId] = useState<number | null>(data.lanes.running[0]?.id ?? data.lanes.pending[0]?.id ?? null)
  const [detail, setDetail] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/hub/openclaw-os/task/${selectedId}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setDetail(json)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  return (
    <div className="grid h-full grid-cols-[1.25fr_1fr] gap-4 max-lg:grid-cols-1">
      <div className="space-y-4">
        <SectionTitle eyebrow="Ops kernel" title="Task orchestration" detail="把 queue、active lanes、task detail 收成真正能操作的桌面 App。" />
        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          <MetricCard label="Active now" value={data.summary.activeNow} tone="positive" />
          <MetricCard label="Pending" value={data.summary.pendingNow} tone="neutral" />
          <MetricCard label="Done today" value={data.summary.completedToday} tone="warning" />
        </div>
        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          <TaskList title="Running lane" tasks={data.lanes.running} onPick={setSelectedId} />
          <TaskList title="Pending lane" tasks={data.lanes.pending} onPick={setSelectedId} />
        </div>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
        <SectionTitle eyebrow="Inspector" title={selectedId ? `Task #${selectedId}` : 'Task detail'} detail="事件、步驟、報告在同一個視窗內完成巡檢。" />
        {loading ? <div className="mt-8 flex items-center gap-2 text-sm text-white/55"><Loader2 className="h-4 w-4 animate-spin" /> 載入中</div> : null}
        {!loading && detail ? (
          <ScrollArea className="mt-4 h-[calc(100%-64px)] space-y-4">
            <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4">
              <div className="text-base font-semibold text-white">{String(detail.task.title)}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/55">
                <span>{String(detail.task.status)}</span>
                <span>·</span>
                <span>{String(detail.task.assignee)}</span>
                <span>·</span>
                <span>{String(detail.task.priority)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-100"><Activity className="h-4 w-4 text-cyan-300" /> Events</div>
              {detail.events.slice(-6).reverse().map((event, index) => (
                <div key={`${event.id ?? index}-${event.created_at}`} className="rounded-2xl border border-white/8 bg-white/4 p-3 text-sm text-white/75">
                  <div className="font-medium text-white">{event.event_type}</div>
                  <div className="mt-1 text-xs text-white/45">{event.created_at}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-100"><Clock3 className="h-4 w-4 text-emerald-300" /> Steps</div>
              {detail.steps.slice(0, 6).map((step) => (
                <div key={step.id} className="rounded-2xl border border-white/8 bg-black/20 p-3 text-sm text-white/75">
                  <div className="font-medium text-white">{step.step_number}. {step.description}</div>
                  <div className="mt-1 text-xs text-white/45">{step.status}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3 pb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-100"><CheckCircle2 className="h-4 w-4 text-amber-300" /> Reports</div>
              {detail.reports.length === 0 ? <div className="text-sm text-white/45">尚未掛報告。</div> : detail.reports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-white/8 bg-black/20 p-3 text-sm text-white/75">
                  <div className="font-medium text-white">{report.title}</div>
                  <div className="mt-1 text-xs text-white/45">{report.author} · {report.type}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : null}
      </div>
    </div>
  )
}
