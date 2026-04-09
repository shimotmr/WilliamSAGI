'use client'

import { FileText, Sparkles } from 'lucide-react'
import type { WebOsData } from '@/features/openclaw-os/types'
import { MetricCard, SectionTitle } from '@/features/openclaw-os/components/shared'

export function ReportsApp({ data }: { data: WebOsData }) {
  return (
    <div className="grid h-full grid-cols-[0.68fr_1.32fr] gap-4 max-lg:grid-cols-1">
      <div className="space-y-4">
        <SectionTitle eyebrow="Archive" title="Report vault" detail="把最新報告做成可掃描的文件桌面。" />
        <MetricCard label="Ready" value={data.summary.reportsReady} tone="warning" />
        <MetricCard label="Completed today" value={data.summary.completedToday} tone="positive" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.reports.map((report) => (
          <div key={report.id} className="group rounded-[26px] border border-white/8 bg-white/4 p-5 transition hover:-translate-y-1 hover:border-amber-200/25 hover:bg-amber-300/8">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-amber-300/12 p-3 text-amber-200"><FileText className="h-5 w-5" /></div>
              <Sparkles className="h-4 w-4 text-white/30 transition group-hover:rotate-12 group-hover:text-amber-200" />
            </div>
            <div className="mt-6 text-lg font-semibold text-white">{report.title}</div>
            <div className="mt-2 text-sm text-white/55">{report.author} · {report.type}</div>
            <div className="mt-8 text-xs uppercase tracking-[0.24em] text-white/35">{report.relative}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
