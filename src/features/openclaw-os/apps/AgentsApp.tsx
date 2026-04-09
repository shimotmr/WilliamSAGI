'use client'

import { Bot } from 'lucide-react'
import type { WebOsData } from '@/features/openclaw-os/types'
import { SectionTitle } from '@/features/openclaw-os/components/shared'

export function AgentsApp({ data }: { data: WebOsData }) {
  return (
    <div className="h-full space-y-4">
      <SectionTitle eyebrow="Load radar" title="Agent distribution" detail="把 agent 當成一級介面，不再藏在列表底下。" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.agents.map((agent) => (
          <div key={agent.name} className="rounded-[26px] border border-white/8 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Bot className="h-4 w-4" style={{ color: agent.color }} /> {agent.name}</div>
              <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: `${agent.color}24`, color: agent.color }}>{agent.total}</span>
            </div>
            <div className="mt-5 space-y-2 text-sm text-white/68">
              <div>Running · {agent.running}</div>
              <div>Pending · {agent.pending}</div>
              <div>Completed · {agent.completed}</div>
            </div>
            <div className="mt-5 h-2 rounded-full bg-white/8">
              <div className="h-2 rounded-full" style={{ width: `${Math.max(12, Math.min(100, Math.round((agent.running / Math.max(agent.total, 1)) * 100)))}%`, background: agent.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
