'use client'

interface Props {
  greeting: string
  displayName: string
}

export default function PortalHero({ greeting, displayName }: Props) {
  return (
    <section className="mb-6 md:mb-8">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl" style={{ color: 'var(--foreground)' }}>
        {greeting}
        {displayName ? (
          <span className="font-normal" style={{ color: 'var(--primary)' }}>
            ，{displayName}
          </span>
        ) : null}
        {' '}🌿
      </h1>

      <p className="text-sm md:text-base" style={{ color: 'var(--foreground-muted)' }}>
        統整營業相關工具與報表，歡迎使用各項服務
      </p>
    </section>
  )
}
