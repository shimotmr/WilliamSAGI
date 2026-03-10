'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  fullWidth?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        {
          'bg-[var(--primary)] text-white hover:brightness-110': variant === 'primary',
          'bg-[var(--secondary)] text-[var(--foreground)] hover:opacity-90': variant === 'secondary',
          'bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]': variant === 'ghost',
          'w-full': fullWidth,
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
