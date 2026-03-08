'use client'
// 🔒 AUDIT: 2026-03-08 | score=100/100 | full-audit

import Card from '@/components/ui/Card'
import type { ModelUsageStats } from '../types'
import { Cpu } from 'lucide-react'

interface Props {
  modelUsage: ModelUsageStats[]
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10a37f',
  anthropic: '#d97757',
  google: '#4285f4',
  xai: '#000000',
  minimax: '#0066ff',
  moonshot: '#000000',
  default: '#8A8F98',
}

function getProviderColor(provider: string): string {
  if (!provider) return PROVIDER_COLORS.default
  const key = provider.toLowerCase()
  return PROVIDER_COLORS[key] || PROVIDER_COLORS.default
}

export default function ModelUsageCard({ modelUsage }: Props) {
  const totalTokens = modelUsage.reduce((sum, m) => sum + m.tokens, 0)
  const totalCost = modelUsage.reduce((sum, m) => sum + m.cost, 0)

  return (
    <Card className="rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <Cpu size={16} className="text-blue-400" />
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">
            模型使用統計
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">
            近 7 天 · 共 {totalTokens.toLocaleString()} tokens · ${totalCost.toFixed(2)}
          </div>
        </div>
      </div>

      {modelUsage.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-[var(--foreground-muted)]">
          尚無資料
        </div>
      ) : (
        <div className="space-y-2">
          {modelUsage.slice(0, 6).map((model, idx) => {
            const percent = totalTokens > 0 ? (model.tokens / totalTokens) * 100 : 0
            const color = getProviderColor(model.provider)
            return (
              <div key={model.name} className="group">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[var(--foreground)] font-medium truncate max-w-[140px]" title={model.name}>
                      {model.name}
                    </span>
                    <span className="text-[var(--foreground-muted)] text-[10px]">
                      ({model.count})
                    </span>
                  </div>
                  <div className="text-[var(--foreground-muted)]">
                    {model.tokens.toLocaleString()} · <span className="text-emerald-400">${model.cost.toFixed(2)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
