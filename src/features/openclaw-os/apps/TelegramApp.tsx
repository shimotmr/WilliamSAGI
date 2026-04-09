'use client'

import { MessageSquare, Shield, Zap } from 'lucide-react'
import type { WebOsData } from '@/features/openclaw-os/types'
import { MetricCard, ScrollArea, SectionTitle } from '@/features/openclaw-os/components/shared'

export function TelegramApp({ data }: { data: WebOsData }) {
  const telegram = data.telegram
  return (
    <div className="grid h-full grid-cols-[0.95fr_1.05fr] gap-4 max-lg:grid-cols-1">
      <div className="space-y-4">
        <SectionTitle eyebrow="Realtime" title="Telegram console" detail="不再是 dashboard 卡片，而是完整訊息操作面。" />
        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          <MetricCard label="Inbound" value={telegram.messageStats.inbound} tone="positive" />
          <MetricCard label="Outbound" value={telegram.messageStats.outbound} tone="neutral" />
          <MetricCard label="Reply context" value={telegram.messageStats.replyContext} tone="warning" />
        </div>
        <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><Shield className="h-4 w-4 text-emerald-300" /> Guard ledger</div>
          <div className="mt-3 space-y-2">
            {telegram.ledger.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-white/4 p-3">
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="mt-1 text-xs text-white/45">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle eyebrow="Conversation" title="Recent messages" detail={`Session ${telegram.sessionKey ?? 'unknown'}`} />
          <div className="flex flex-wrap gap-2">
            {telegram.quickCommands.map((command) => (
              <span key={command} className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/65">/{command}</span>
            ))}
          </div>
        </div>
        <ScrollArea className="mt-4 h-[calc(100%-68px)] space-y-3">
          {telegram.messages.map((message) => (
            <div key={message.id} className={`rounded-[22px] border p-4 ${message.kind === 'inbound' ? 'ml-2 bg-emerald-400/8' : 'mr-2 bg-cyan-400/8'}`} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white"><MessageSquare className="h-4 w-4 text-white/55" /> {message.senderLabel}</div>
                <div className="text-xs text-white/45">{message.relative}</div>
              </div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/78">{message.body}</div>
              {(message.taskCards?.length || 0) > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.taskCards?.map((task) => <span key={task.id} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-50">#{task.id} {task.status}</span>)}
                </div>
              ) : null}
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}
