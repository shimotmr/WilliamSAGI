'use client'

import React, { useState, useEffect } from 'react'

const T = {
  bg: '#050506',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHov: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.10)',
  borderSub: 'rgba(255,255,255,0.06)',
  fg: '#EDEDEF',
  fgMuted: '#8A8F98',
  fgSubtle: '#6B7280',
  accent: '#5E6AD2',
  accentGlow: 'rgba(94,106,210,0.2)',
  green: '#34D399',
  amber: '#FBBF24',
  red: '#EF4444',
  purple: '#A78BFA',
  font: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
}

const card: React.CSSProperties = {
  background: T.surface,
  backdropFilter: 'blur(24px)',
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  padding: 20,
}

interface Report {
  id: string
  title: string
  author: string
  type: string
  created_at: string
  content?: string
}

const FILTER_TABS = ['全部', '分析', '研究', '技術', '決策'] as const
type FilterTab = (typeof FILTER_TABS)[number]

const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
  '分析報告': { color: '#5E6AD2', icon: 'bar-chart', label: '分析' },
  '分析': { color: '#5E6AD2', icon: 'bar-chart', label: '分析' },
  '研究報告': { color: '#60A5FA', icon: 'search', label: '研究' },
  '研究': { color: '#60A5FA', icon: 'search', label: '研究' },
  '技術文檔': { color: '#34D399', icon: 'code', label: '技術' },
  '技術': { color: '#34D399', icon: 'code', label: '技術' },
  '決策建議': { color: '#FBBF24', icon: 'branch', label: '決策' },
  '決策': { color: '#FBBF24', icon: 'branch', label: '決策' },
  '審查報告': { color: '#A78BFA', icon: 'shield', label: '審查' },
  '審查': { color: '#A78BFA', icon: 'shield', label: '審查' },
  '操作手冊': { color: '#8A8F98', icon: 'book', label: '操作' },
  '操作': { color: '#8A8F98', icon: 'book', label: '操作' },
}

function getTypeConfig(type: string) {
  return typeConfig[type] || { color: T.fgSubtle, icon: 'file', label: type || '—' }
}

function TypeIcon({ type }: { type: string }) {
  const { color, icon } = getTypeConfig(type)
  const iconMap: Record<string, React.ReactNode> = {
    'bar-chart': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    'search': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    'code': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    'branch': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
    'shield': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    'book': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    'file': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
  }
  return (
    <div style={{
      width: 52, height: 52, borderRadius: 14, background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      border: `1px solid ${color}25`,
    }}>
      {iconMap[icon] || iconMap['file']}
    </div>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function wordCount(content?: string) {
  if (!content) return '—'
  return `${content.length.toLocaleString()} 字`
}

function matchesFilter(type: string, filter: FilterTab): boolean {
  if (filter === '全部') return true
  const cfg = getTypeConfig(type)
  return cfg.label === filter || type.includes(filter)
}

export default function Reports2Page() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterTab>('全部')
  const [search, setSearch] = useState('')
  const [hovCard, setHovCard] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/hub/reports?limit=50')
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : (d?.reports || d?.data || [])
        setReports(arr)
        setLoading(false)
      })
      .catch(() => { setError('無法載入報告資料'); setLoading(false) })
  }, [])

  const filtered = reports.filter(r => {
    if (!matchesFilter(r.type, filter)) return false
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.author.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh', fontFamily: T.font, color: T.fg, background: T.bg, position: 'relative', overflow: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .rp2-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        @media(max-width:1023px){.rp2-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:639px){.rp2-grid{grid-template-columns:1fr}}
      `}</style>

      {/* Background layers */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top, #0a0a0f 0%, #050506 50%, #020203 100%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, opacity: 0.015, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.03em', background: 'linear-gradient(to bottom,#EDEDEF,rgba(237,237,239,0.8))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              報告庫
            </h2>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: T.fgMuted, border: `1px solid ${T.borderSub}`, fontVariantNumeric: 'tabular-nums' }}>
              {reports.length} 份
            </span>
          </div>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: `1px solid ${T.borderSub}`, overflow: 'hidden' }}>
            {FILTER_TABS.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{
                padding: '7px 14px', fontSize: 13, fontWeight: filter === t ? 500 : 400,
                color: filter === t ? T.fg : T.fgMuted, background: filter === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: T.font, transition: 'all 0.2s',
              }}>
                {t}
              </button>
            ))}
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜尋報告..."
            style={{
              marginLeft: 'auto', padding: '7px 14px', fontSize: 13, borderRadius: 10,
              border: `1px solid ${T.borderSub}`, background: 'rgba(255,255,255,0.04)',
              color: T.fg, outline: 'none', fontFamily: T.font, width: 200,
            }}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="rp2-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ ...card, height: 140 }}>
                <div style={{ height: '100%', borderRadius: 10, background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite' }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60, color: T.red, fontSize: 14 }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: T.fgMuted, fontSize: 14 }}>
            {search ? '沒有符合搜尋的報告' : '目前沒有報告'}
          </div>
        ) : (
          <div className="rp2-grid">
            {filtered.map(r => {
              const cfg = getTypeConfig(r.type)
              const isHov = hovCard === r.id
              return (
                <div
                  key={r.id}
                  onMouseEnter={() => setHovCard(r.id)}
                  onMouseLeave={() => setHovCard(null)}
                  style={{
                    ...card,
                    height: 140,
                    display: 'flex',
                    gap: 14,
                    background: isHov ? T.surfaceHov : T.surface,
                    transform: isHov ? 'translateY(-2px)' : 'none',
                    boxShadow: isHov
                      ? `0 8px 40px rgba(0,0,0,0.5), 0 0 60px ${cfg.color}10`
                      : '0 2px 20px rgba(0,0,0,0.3)',
                    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  {/* Left icon chip */}
                  <TypeIcon type={r.type} />

                  {/* Right content */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
                    {/* Title */}
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: T.fg, cursor: 'pointer',
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                      lineHeight: 1.4,
                    }}>
                      {r.title}
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.fgMuted }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span>{r.author || '—'}</span>
                      <span style={{ margin: '0 2px' }}>·</span>
                      <span>{formatDate(r.created_at)}</span>
                      <span style={{ margin: '0 2px' }}>·</span>
                      <span>{wordCount(r.content)}</span>
                    </div>

                    {/* Action row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ActionBtn label="👁 閱讀" bg="rgba(94,106,210,0.15)" color={T.accent} wide />
                      <ActionBtn label="G" bg="rgba(66,133,244,0.15)" color="#4285F4" borderColor="#4285F4" />
                      <ActionBtn label="PDF" bg="rgba(239,68,68,0.15)" color="#EF4444" borderColor="#EF4444" small />
                      <ActionBtn label="W" bg="rgba(37,99,235,0.15)" color="#2563EB" borderColor="#2563EB" />
                      <ActionBtn label="⬇" bg="rgba(255,255,255,0.04)" color={T.fgMuted} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p style={{ textAlign: 'center', color: 'rgba(138,143,152,0.35)', fontSize: 11, paddingTop: 24, letterSpacing: '0.02em' }}>
          SAGI Hub · 報告庫 · © 2026
        </p>
      </div>
    </div>
  )
}

function ActionBtn({ label, bg, color, borderColor, wide, small }: {
  label: string; bg: string; color: string; borderColor?: string; wide?: boolean; small?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: wide ? 'auto' : 28, height: 28, minWidth: wide ? undefined : 28,
        padding: wide ? '0 10px' : 0,
        borderRadius: 6, background: bg, color,
        border: borderColor ? `1px solid ${borderColor}40` : `1px solid rgba(255,255,255,0.06)`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: small ? 9 : 12, fontWeight: 600, fontFamily: '"Inter", system-ui, sans-serif',
        opacity: hov ? 1 : 0.85, transition: 'opacity 0.15s',
      }}
    >
      {label}
    </button>
  )
}
