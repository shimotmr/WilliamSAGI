'use client'

import type { ReactNode } from 'react'
import { openClawOsTones, type Tone } from '@/features/openclaw-os/types'

export function GlassPanel({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-[20px] border shadow-2xl backdrop-blur-xl ${className}`}
      style={{
        borderColor: openClawOsTones.border,
        background: 'linear-gradient(180deg, rgba(8,18,27,0.84), rgba(7,19,27,0.68))',
        boxShadow: '0 24px 90px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: string }) {
  return (
    <div className="space-y-1">
      {eyebrow ? <div className="text-[10px] uppercase tracking-[0.32em] text-white/45">{eyebrow}</div> : null}
      <div className="text-lg font-semibold text-slate-50">{title}</div>
      {detail ? <div className="text-sm text-[color:var(--muted)]">{detail}</div> : null}
    </div>
  )
}

export function MetricCard({ label, value, tone = 'neutral' }: { label: string; value: ReactNode; tone?: Tone }) {
  const color = tone === 'positive' ? openClawOsTones.green : tone === 'warning' ? openClawOsTones.amber : openClawOsTones.accent
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${color}2f`, background: `linear-gradient(180deg, ${color}18 0%, rgba(255,255,255,0.02) 100%)` }}>
      <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight" style={{ color }}>{value}</div>
    </div>
  )
}

export function StatusDot({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
}

export function ScrollArea({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`overflow-auto pr-1 [scrollbar-color:rgba(255,255,255,0.18)_transparent] ${className}`}>{children}</div>
}
