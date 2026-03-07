'use client'

import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={clsx(
        'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors',
        'bg-[var(--card)] text-[var(--foreground)]',
        'border-[var(--border)] placeholder:text-[var(--foreground-muted)]',
        'focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--primary-glow)]',
        className
      )}
      {...props}
    />
  )
}
