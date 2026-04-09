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
      <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,17,24,0.84),rgba(5,10,15,0.7))] p-2 shadow-[0_26px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl supports-[backdrop-filter]:bg-black/28" onMouseLeave={reset}>
        <div className="mb-2 flex items-center justify-between px-3 text-[10px] uppercase tracking-[0.24em] text-white/35">
          <span>App dock</span>
          <span>{activeIds.length} open</span>
        </div>
        <div className="flex items-end gap-2 px-1 pb-1">
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
                className="group flex w-[74px] flex-col items-center gap-1.5 rounded-[24px] px-1 pb-1 pt-2"
                aria-label={item.title}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-[20px] border transition duration-300 ease-out ${active ? 'animate-[dock-bounce_0.8s_ease]' : ''}`}
                  style={{
                    transform: `translateY(${(1 - scale) * 10}px) scale(${scale})`,
                    borderColor: active ? `${item.tone}55` : 'rgba(255,255,255,0.08)',
                    background: active ? `linear-gradient(180deg, ${item.tone}32, rgba(255,255,255,0.08))` : 'rgba(255,255,255,0.05)',
                    boxShadow: active ? `0 18px 36px ${item.tone}26` : '0 12px 28px rgba(0,0,0,0.2)',
                    opacity: minimized ? 0.54 : 1,
                  }}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="max-w-full truncate px-2 text-[11px] text-white/58 transition group-hover:text-white/82">{item.title}</span>
                <span className="h-1.5 rounded-full transition-all" style={{ width: active ? 18 : 6, background: item.tone, opacity: minimized ? 0.34 : active ? 1 : 0.25 }} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
