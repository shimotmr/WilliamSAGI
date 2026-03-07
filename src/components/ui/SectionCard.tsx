import type { ReactNode } from 'react'
import Card from './Card'

interface Props {
  title: string
  subtitle?: string
  rightSlot?: ReactNode
  children: ReactNode
  className?: string
}

export default function SectionCard({
  title,
  subtitle,
  rightSlot,
  children,
  className = '',
}: Props) {
  return (
    <Card className={`rounded-2xl p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-[var(--foreground-muted)]">{subtitle}</div>
          ) : null}
        </div>

        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>

      {children}
    </Card>
  )
}
