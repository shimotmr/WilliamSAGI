'use client'

import { Workflow } from 'lucide-react'
import type { WebOsData } from '@/features/openclaw-os/types'
import { SectionTitle } from '@/features/openclaw-os/components/shared'

export function SessionsApp({ data }: { data: WebOsData }) {
  return (
    <div className="h-full space-y-4">
      <SectionTitle eyebrow="Runtime" title="Session inspector" detail="session id、runtime、updatedAt 放在同一條檢修面。" />
      <div className="grid gap-3 lg:grid-cols-2">
        {data.sessions.map((session) => (
          <div key={session.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white"><Workflow className="h-4 w-4 text-violet-300" /> #{session.id} {session.title}</div>
            <div className="mt-3 grid gap-2 text-sm text-white/68">
              <div>Status · {session.status}</div>
              <div>Assignee · {session.assignee}</div>
              <div>Runtime · {session.dispatchRuntime}</div>
              <div>Session · {session.sessionId}</div>
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.24em] text-white/35">{session.relative}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
