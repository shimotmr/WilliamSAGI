'use client'

import { Activity } from 'lucide-react'
import type { WebOsData } from '@/features/openclaw-os/types'
import { SectionTitle, StatusDot } from '@/features/openclaw-os/components/shared'

export function EventsApp({ data }: { data: WebOsData }) {
  return (
    <div className="h-full space-y-4">
      <SectionTitle eyebrow="Trace" title="Event surface" detail="將 handoff、完成、異常拉成一條真正可讀的時間軸。" />
      <div className="grid gap-3 xl:grid-cols-2">
        {data.eventFeed.map((event) => {
          const color = event.tone === 'positive' ? '#34d399' : event.tone === 'warning' ? '#f59e0b' : '#5eead4'
          return (
            <div key={`${event.id ?? event.taskId}-${event.createdAt}`} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white"><Activity className="h-4 w-4" style={{ color }} /> #{event.taskId} {event.title}</div>
                <StatusDot color={color} />
              </div>
              <div className="mt-3 text-base font-semibold text-white">{event.eventType}</div>
              <div className="mt-2 text-sm leading-6 text-white/65">{event.summary || '無附帶摘要，直接看原始 event。'}</div>
              <div className="mt-4 text-xs uppercase tracking-[0.24em] text-white/35">{event.relative}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
