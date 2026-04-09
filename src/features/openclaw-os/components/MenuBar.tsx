'use client'

import { Bell, Command, Sparkles, Wifi } from 'lucide-react'
import { openClawOsTones } from '@/features/openclaw-os/types'

export function MenuBar({ activeTitle, clock, onMissionControl, onNotifications }: { activeTitle: string; clock: string; onMissionControl: () => void; onNotifications: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-[120] px-4 pt-3">
      <div className="flex h-12 items-center justify-between rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,16,24,0.82),rgba(6,12,17,0.72))] px-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="flex min-w-0 items-center gap-3 text-sm text-white/80">
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/6 text-white">◉</button>
          <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/45 sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-cyan-200" /> OpenClaw OS
          </div>
          <button onClick={onMissionControl} className="truncate font-semibold text-white transition hover:text-cyan-200">{activeTitle}</button>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/68">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1 md:flex"><Wifi className="h-3.5 w-3.5 text-emerald-300" /> Gateway linked</div>
          <button onClick={onMissionControl} className="flex items-center gap-2 rounded-full border border-white/8 bg-white/6 px-3 py-1 transition hover:bg-white/10"><Command className="h-3.5 w-3.5" /> Mission</button>
          <button onClick={onNotifications} className="rounded-full border border-white/8 bg-white/6 p-2 transition hover:bg-white/10"><Bell className="h-3.5 w-3.5" style={{ color: openClawOsTones.accent }} /></button>
          <div className="rounded-full border border-white/8 bg-black/18 px-3 py-1.5 font-medium text-white">{clock}</div>
        </div>
      </div>
    </div>
  )
}
