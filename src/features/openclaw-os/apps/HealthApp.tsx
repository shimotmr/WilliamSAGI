'use client'

import { AlertTriangle, HeartPulse, ShieldCheck } from 'lucide-react'
import type { WebOsData } from '@/features/openclaw-os/types'
import { MetricCard, SectionTitle } from '@/features/openclaw-os/components/shared'

export function HealthApp({ data }: { data: WebOsData }) {
  const { telegram, watchtower } = data
  return (
    <div className="grid h-full grid-cols-[0.8fr_1.2fr] gap-4 max-lg:grid-cols-1">
      <div className="space-y-4">
        <SectionTitle eyebrow="Guard rails" title="Health center" detail="guard、gateway、watchtower 變成可掃描的健康中樞。" />
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <MetricCard label="Anomalies" value={data.summary.anomalousEvents24h} tone="warning" />
          <MetricCard label="Completed signals" value={watchtower.completedSignals} tone="positive" />
          <MetricCard label="Dispatch blocked" value={watchtower.dispatchSuppressed + watchtower.startBlocked} tone="warning" />
          <MetricCard label="Guard" value={telegram.guardHealthy ? 'OK' : 'WARN'} tone={telegram.guardHealthy ? 'positive' : 'warning'} />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Telegram guard</div>
          <div className="mt-4 space-y-2 text-sm text-white/68">
            <div>Last guard · {telegram.lastGuardMinutes ?? '未知'} 分鐘</div>
            <div>Gateway heartbeat · {telegram.gatewayLastMinutes ?? '未知'} 分鐘</div>
            <div>Blocked providers · {telegram.blockedProviders.join(', ') || 'none'}</div>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><AlertTriangle className="h-4 w-4 text-amber-300" /> Watchtower</div>
          <div className="mt-4 space-y-2 text-sm text-white/68">
            <div>Dispatch suppressed · {watchtower.dispatchSuppressed}</div>
            <div>Harness failed · {watchtower.harnessFailed}</div>
            <div>Lease handoffs · {watchtower.leaseHandoffs}</div>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><HeartPulse className="h-4 w-4 text-rose-300" /> Findings</div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {(telegram.findings.length ? telegram.findings : [{ reason: 'No active findings', key: 'clean' }]).map((finding) => (
              <div key={finding.key || finding.reason} className="rounded-2xl border border-white/8 bg-white/4 p-3 text-sm text-white/72">{finding.reason || finding.key}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
