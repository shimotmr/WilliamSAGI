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

interface Task {
  id: string
  title: string
  status: string
  assignee: string
  priority: string
  updated_at: string
}

const TABS = ['全部', '執行中', '待派發', '待執行', '已完成'] as const
type Tab = (typeof TABS)[number]

const priorityMap: Record<string, { color: string; label: string }> = {
  P0: { color: T.red, label: 'P0' },
  P1: { color: T.amber, label: 'P1' },
  P2: { color: T.accent, label: 'P2' },
  P3: { color: T.fgSubtle, label: 'P3' },
}

const statusColors: Record<string, string> = {
  '執行中': T.amber,
  '待派發': T.accent,
  '待執行': T.fgSubtle,
  '已完成': T.green,
}

function getInitials(name: string) {
  return name ? name.slice(0, 1).toUpperCase() : '?'
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} 分鐘前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} 小時前`
  const days = Math.floor(hrs / 24)
  return `${days} 天前`
}

export default function Board2Page() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('全部')
  const [search, setSearch] = useState('')
  const [hovRow, setHovRow] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const url = tab === '全部' ? '/api/hub/tasks?limit=50' : `/api/hub/tasks?limit=50&status=${encodeURIComponent(tab)}`
    fetch(url)
      .then(r => r.json())
      .then(d => { setTasks(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setError('無法載入任務資料'); setLoading(false) })
  }, [tab])

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.assignee.toLowerCase().includes(search.toLowerCase())
  )

  const counts = {
    '執行中': tasks.filter(t => t.status === '執行中').length,
    '待派發': tasks.filter(t => t.status === '待派發').length,
    '已完成': tasks.filter(t => t.status === '已完成').length,
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: T.font, color: T.fg, background: T.bg, position: 'relative', overflow: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>

      {/* Background layers */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top, #0a0a0f 0%, #050506 50%, #020203 100%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, opacity: 0.015, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.03em', background: 'linear-gradient(to bottom,#EDEDEF,rgba(237,237,239,0.8))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              任務看板
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([['執行中', T.amber], ['待派發', T.accent], ['已完成', T.green]] as const).map(([label, color]) => (
              <span key={label} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}30`, fontVariantNumeric: 'tabular-nums' }}>
                {label} {counts[label]}
              </span>
            ))}
          </div>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: `1px solid ${T.borderSub}`, overflow: 'hidden' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '7px 14px', fontSize: 13, fontWeight: tab === t ? 500 : 400,
                color: tab === t ? T.fg : T.fgMuted, background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: T.font, transition: 'all 0.2s',
              }}>
                {t}
              </button>
            ))}
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜尋任務..."
            style={{
              marginLeft: 'auto', padding: '7px 14px', fontSize: 13, borderRadius: 10,
              border: `1px solid ${T.borderSub}`, background: 'rgba(255,255,255,0.04)',
              color: T.fg, outline: 'none', fontFamily: T.font, width: 200,
            }}
          />
        </div>

        {/* Content */}
        <div style={card}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 48, borderRadius: 10, background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite' }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 40, color: T.red, fontSize: 14 }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: T.fgMuted, fontSize: 14 }}>
              {search ? '沒有符合搜尋的任務' : '目前沒有任務'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtered.map(t => {
                const p = priorityMap[t.priority] || { color: T.fgSubtle, label: t.priority || '—' }
                const sc = statusColors[t.status] || T.fgSubtle
                const isHov = hovRow === t.id
                return (
                  <div
                    key={t.id}
                    onMouseEnter={() => setHovRow(t.id)}
                    onMouseLeave={() => setHovRow(null)}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: 10,
                      background: isHov ? T.surfaceHov : 'transparent', transition: 'background 0.15s', cursor: 'pointer', gap: 12,
                    }}
                  >
                    {/* Left: priority + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, background: `${p.color}20`, color: p.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                        fontFamily: T.mono,
                      }}>
                        {p.label}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    </div>

                    {/* Middle: assignee + status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, color: '#050506',
                      }}>
                        {getInitials(t.assignee)}
                      </div>
                      <span style={{
                        fontSize: 12, padding: '2px 10px', borderRadius: 20, background: `${sc}18`, color: sc,
                        border: `1px solid ${sc}30`, whiteSpace: 'nowrap',
                      }}>
                        {t.status}
                      </span>
                    </div>

                    {/* Right: time + expand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: T.fgMuted, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {timeAgo(t.updated_at)}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.fgSubtle} strokeWidth="1.5" strokeLinecap="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(138,143,152,0.35)', fontSize: 11, paddingTop: 24, letterSpacing: '0.02em' }}>
          SAGI Hub · 任務看板 · © 2026
        </p>
      </div>
    </div>
  )
}
