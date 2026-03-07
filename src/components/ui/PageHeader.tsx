'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  rightSlot?: ReactNode
}

export default function PageHeader({
  title,
  description,
  backHref,
  backLabel = '返回',
  rightSlot,
}: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {backHref ? (
          <Link
            href={backHref}
            className="mb-3 inline-flex text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            ← {backLabel}
          </Link>
        ) : null}

        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">{description}</p>
        ) : null}
      </div>

      {rightSlot ? <div>{rightSlot}</div> : null}
    </div>
  )
}
