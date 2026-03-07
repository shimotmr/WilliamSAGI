'use client'

import type { PortalMenuItemLite } from '../types'
import {
  PORTAL_GROUPS,
  PORTAL_GROUP_LABELS,
  PORTAL_STATUS_BADGE,
  icons,
} from '../services/menu'
import ModuleCard from '@/components/ui/ModuleCard'

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

function badgeTone(status?: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'ready') return 'success'
  if (status === 'soon') return 'warning'
  return 'default'
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
                return (
                  <ModuleCard
                    key={item.id}
                    href={item.href}
                    title={item.title}
                    desc={item.desc}
                    icon={icons[item.icon as keyof typeof icons]}
                    gradient={getCardGradient(item.id, mode)}
                    badgeLabel={badge?.label}
                    badgeTone={badgeTone(item.status)}
                    disabled={item.status === 'soon'}
                  />
                )
              })}
            </div>
          </section>
        )
      })}
    </>
  )
}
