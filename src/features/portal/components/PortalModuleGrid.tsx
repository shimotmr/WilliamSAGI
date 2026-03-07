'use client'

import Link from 'next/link'
import type { PortalMenuItemLite } from '../types'
import {
  PORTAL_GROUPS,
  PORTAL_GROUP_LABELS,
  PORTAL_STATUS_BADGE,
  icons,
} from '../services/menu'

const cardGradients: Record<string, { light: string; dark?: string }> = {
  performance: { light: 'linear-gradient(135deg, #ff6b6b, #ee5a24)' },
  products: { light: 'linear-gradient(135deg, #4ecdc4, #44bd32)' },
  quotations: { light: 'linear-gradient(135deg, #45b7d1, #3742fa)' },
  transcripts: { light: 'linear-gradient(135deg, #9c88ff, #7209b7)' },
  marketing: { light: 'linear-gradient(135deg, #feca57, #ff9ff3)' },
  knowledge: { light: 'linear-gradient(135deg, #a855f7, #ec4899)' },
  samples: { light: 'linear-gradient(135deg, #f59e0b, #eab308)' },
  agents: { light: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' },
  admin: { light: 'linear-gradient(135deg, #64748b, #475569)', dark: 'linear-gradient(135deg, #475569, #334155)' },
}

function getCardGradient(id: string, mode: 'light' | 'dark') {
  const gradient = cardGradients[id]
  if (!gradient) return 'linear-gradient(135deg, #64748b, #475569)'
  if (mode === 'dark' && gradient.dark) return gradient.dark
  return gradient.light
}

interface Props {
  items: PortalMenuItemLite[]
  mode?: 'light' | 'dark'
}

export default function PortalModuleGrid({ items, mode = 'light' }: Props) {
  return (
    <>
      {PORTAL_GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.group === group)
        if (!groupItems.length) return null

        const { label, desc } = PORTAL_GROUP_LABELS[group]

        return (
          <section key={group} className="mb-6 md:mb-8">
            <div className="mb-4">
              <h2 className="mb-1 text-lg font-bold md:text-xl" style={{ color: 'var(--foreground)' }}>
                {label}
              </h2>
              <span className="text-xs md:text-sm" style={{ color: 'var(--foreground-muted)' }}>
                {desc}
              </span>
            </div>

            <div
              className={`grid gap-3 md:gap-4 ${
                group === 'system'
                  ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}
            >
              {groupItems.map((item) => {
                const badge = PORTAL_STATUS_BADGE[item.status as keyof typeof PORTAL_STATUS_BADGE]
                const isSoon = item.status === 'soon'

                return (
                  <Link
                    key={item.id}
                    href={isSoon ? '#' : item.href}
                    className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl md:p-5 ${
                      isSoon ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    }`}
                    style={{ background: getCardGradient(item.id, mode) }}
                    onClick={isSoon ? (e) => e.preventDefault() : undefined}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-white/10" />

                    {badge?.label ? (
                      <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    ) : null}

                    <div className="mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm md:h-12 md:w-12">
                        <span className="[&>*]:h-6 [&>*]:w-6 [&>*]:text-white">
                          {icons[item.icon as keyof typeof icons]}
                        </span>
                      </div>
                    </div>

                    <div className="text-white">
                      <h3 className="mb-1 text-base font-bold md:text-lg">{item.title}</h3>
                      <p className="line-clamp-2 text-xs text-white/80 md:text-sm">{item.desc}</p>
                    </div>

                    <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </>
  )
}
