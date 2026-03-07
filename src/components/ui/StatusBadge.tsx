interface Props {
  label: string
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const toneMap = {
  default: 'bg-[var(--muted)] text-[var(--foreground-muted)]',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

export default function StatusBadge({ label, tone = 'default' }: Props) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${toneMap[tone]}`}>
      {label}
    </span>
  )
}
