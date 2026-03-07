interface Props {
  title: string
  description?: string
}

export default function EmptyState({ title, description }: Props) {
  return (
    <div className="py-8 text-center">
      <div className="text-sm font-medium text-[var(--foreground-muted)]">{title}</div>
      {description ? (
        <div className="mt-1 text-xs text-[var(--foreground-muted)]">{description}</div>
      ) : null}
    </div>
  )
}
