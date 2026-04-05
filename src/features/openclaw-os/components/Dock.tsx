'use client'

import { Activity, Bot, CheckSquare, FileText, HeartPulse, MessageSquare, Workflow } from 'lucide-react'
import { useDockMagnify } from '@/features/openclaw-os/hooks/useDockMagnify'
import type { OsAppId } from '@/features/openclaw-os/types'

const icons = {
  tasks: CheckSquare,
  telegram: MessageSquare,
  reports: FileText,
  events: Activity,
  sessions: Workflow,
  agents: Bot,
  health: HeartPulse,
}

export function Dock({ items, activeIds, minimizedIds, onOpen }: { items: Array<{ id: OsAppId; title: string; tone: string }>; activeIds: OsAppId[]; minimizedIds: OsAppId[]; onOpen: (id: OsAppId) => void }) {
  const { scales, setPointerX, reset } = useDockMagnify(items.length)

  return (
    <div className="fixed inset-x-0 bottom-4 z-[130] flex justify-center px-4">
      <div className="flex items-end gap-2 rounded-[28px] border border-white/10 bg-black/35 px-3 py-3 shadow-2xl backdrop-blur-2xl supports-[backdrop-filter]:bg-black/28" onMouseLeave={reset}>
        {items.map((item, index) => {
          const Icon = icons[item.id]
          const scale = scales[index] ?? 1
          const active = activeIds.includes(item.id)
          const minimized = minimizedIds.includes(item.id)
          return (
            <button
              key={item.id}
              onMouseMove={(event) => {
                const rect = event.currentTarget.parentElement?.getBoundingClientRect()
                if (rect) setPointerX(event.clientX - rect.left)
              }}
              onClick={() => onOpen(item.id)}
              className="group flex flex-col items-center gap-2"
              aria-label={item.title}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-[18px] border transition duration-300 ease-out ${active ? 'animate-[dock-bounce_0.8s_ease]' : ''}`}
                style={{
                  transform: `translateY(${(1 - scale) * 10}px) scale(${scale})`,
                  borderColor: active ? `${item.tone}55` : 'rgba(255,255,255,0.08)',
                  background: active ? `linear-gradient(180deg, ${item.tone}35, rgba(255,255,255,0.08))` : 'rgba(255,255,255,0.06)',
                  boxShadow: active ? `0 18px 36px ${item.tone}28` : '0 12px 28px rgba(0,0,0,0.28)',
                  opacity: minimized ? 0.62 : 1,
                }}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <span className="rounded-full px-2 py-0.5 text-[11px] text-white/55 transition group-hover:bg-white/8 group-hover:text-white/82">{item.title}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${active ? 'opacity-100' : 'opacity-20'}`} style={{ background: item.tone }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
