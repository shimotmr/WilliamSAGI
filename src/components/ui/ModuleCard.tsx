'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import StatusBadge from './StatusBadge'

interface Props {
  href: string
  title: string
  desc: string
  icon: ReactNode
  gradient: string
  badgeLabel?: string
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  disabled?: boolean
}

export default function ModuleCard({
  href,
  title,
  desc,
  icon,
  gradient,
  badgeLabel,
  badgeTone = 'default',
  disabled = false,
}: Props) {
  return (
    <Link
      href={disabled ? '#' : href}
      className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl md:p-5 ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
      style={{ background: gradient }}
      onClick={disabled ? (e) => e.preventDefault() : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-white/10" />

      {badgeLabel ? (
        <div className="absolute right-3 top-3">
          <StatusBadge label={badgeLabel} tone={badgeTone} />
        </div>
      ) : null}

      <div className="mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm md:h-12 md:w-12">
          <span className="[&>*]:h-6 [&>*]:w-6 [&>*]:text-white">{icon}</span>
        </div>
      </div>

      <div className="text-white">
        <h3 className="mb-1 text-base font-bold md:text-lg">{title}</h3>
        <p className="line-clamp-2 text-xs text-white/80 md:text-sm">{desc}</p>
      </div>

      <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </Link>
  )
}
