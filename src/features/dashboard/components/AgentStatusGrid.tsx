'use client'

import Card from '@/components/ui/Card'
import type { DashboardAgent } from '../types'

interface Props {
  agents: DashboardAgent[]
}

export default function AgentStatusGrid({ agents }: Props) {
  if (!agents.length) return null

  return (
    <Card className="rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">
            Agent 狀態
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">
            {agents.filter((a) => a.isActive).length} / {agents.length} 活躍
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent, index) => {
          const accent = agent.color || ['#5E6AD2', '#4ade80', '#fbbf24', '#f87171'][index % 4]

          return (
            <div
              key={agent.name}
              className="rounded-xl border p-4"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--card)',
              }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--foreground)]">
                    {agent.name}
                  </div>
                  <div className="truncate text-xs text-[var(--foreground-muted)]">
                    {agent.role}
                  </div>
                </div>

                <span
                  className="mt-1 inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: agent.isActive ? '#4ade80' : '#94a3b8',
                  }}
                />
              </div>

              <div className="mb-2 flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span>完成 {agent.completed}</span>
                <span>{agent.successRate}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${agent.successRate}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
