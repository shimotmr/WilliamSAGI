'use client'

import type { WebOsData } from '@/features/openclaw-os/types'

export function NotificationPanel({ open, data, onClose, onOpenApp }: { open: boolean; data: WebOsData; onClose: () => void; onOpenApp: (id: 'events' | 'reports' | 'health' | 'telegram') => void }) {
  if (!open) return null
  return (
    <div className="fixed right-4 top-16 z-[145] w-[min(420px,calc(100vw-32px))] rounded-[28px] border border-white/10 bg-black/55 p-4 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-white/35">Notification center</div>
          <div className="mt-1 text-lg font-semibold text-white">最近動態</div>
        </div>
        <button onClick={onClose} className="text-sm text-white/55">關閉</button>
      </div>
      <div className="mt-4 space-y-2">
        {data.eventFeed.slice(0, 3).map((event) => (
          <button key={event.id} onClick={() => onOpenApp('events')} className="w-full rounded-2xl border border-white/8 bg-white/6 p-3 text-left">
            <div className="text-sm font-medium text-white">{event.eventType}</div>
            <div className="mt-1 text-xs text-white/45">#{event.taskId} · {event.relative}</div>
          </button>
        ))}
        {data.reports.slice(0, 2).map((report) => (
          <button key={report.id} onClick={() => onOpenApp('reports')} className="w-full rounded-2xl border border-white/8 bg-white/6 p-3 text-left">
            <div className="text-sm font-medium text-white">{report.title}</div>
            <div className="mt-1 text-xs text-white/45">{report.author} · {report.relative}</div>
          </button>
        ))}
        <button onClick={() => onOpenApp('health')} className="w-full rounded-2xl border border-amber-200/12 bg-amber-300/8 p-3 text-left">
          <div className="text-sm font-medium text-white">Health anomalies</div>
          <div className="mt-1 text-xs text-white/45">24h 異常：{data.summary.anomalousEvents24h}</div>
        </button>
      </div>
    </div>
  )
}
