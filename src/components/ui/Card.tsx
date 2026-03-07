import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function Card({ children, className, ...props }: Props) {
  return (
    <div
      className={clsx(
        'rounded-2xl border p-6 shadow-sm',
        'bg-[var(--card)] text-[var(--card-foreground)] border-[var(--border)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
