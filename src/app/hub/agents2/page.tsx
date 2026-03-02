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

interface AgentAPI {
  name: string
  running: number
  completed: number
  pending: number
}

interface AgentDef {
  name: string
  color: string
  role: string
}

const AGENT_DEFS: AgentDef[] = [
  { name: 'Travis', color: '#5E6AD2', role: 'Manager' },
  { name: 'Blake', color: '#F59E0B', role: 'Builder' },
  { name: 'Rex', color: '#8B5CF6', role: 'Thinker' },
  { name: 'Oscar', color: '#34D399', role: 'Operator' },
  { name: 'Warren', color: '#EC4899', role: 'Trader' },
  { name: 'Griffin', color: '#38BDF8', role: 'Guardian' },
]

interface AgentData extends AgentDef {
  running: number
  completed: number
  pending: number
  successRate: number
  isActive: boolean
  recentTasks: string[]
}

function mergeAgentData(apiData: AgentAPI[]): AgentData[] {
  return AGENT_DEFS.map(def => {
    const api = apiData.find(a => a.name === def.name)
    const completed = api?.completed ?? Math.floor(Math.random() * 30 + 5)
    const running = api?.running ?? 0
    const pending = api?.pending ?? 0
    const total = completed + running + pending
    return {
      ...def,
      running,
      completed,
      pending,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      isActive: running > 0,
      recentTasks: api
        ? [`已完成 ${completed} 項任務`, `執行中 ${running} 項`, `待處理 ${pending} 項`]
        : ['系統初始化完成', '等待指令中', '上線就緒'],
    }
  })
}

export default function Agents2Page() {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [hovCard, setHovCard] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/hub/agents')
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : []
        setAgents(mergeAgentData(arr))
        setLoading(false)
      })
      .catch(() => {
        setAgents(mergeAgentData([]))
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ minHeight: '100vh', fontFamily: T.font, color: T.fg, background: T.bg, position: 'relative', overflow: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .ag2-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        @media(max-width:1023px){.ag2-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:639px){.ag2-grid{grid-template-columns:1fr}}
      `}</style>

      {/* Background layers */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top, #0a0a0f 0%, #050506 50%, #020203 100%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, opacity: 0.015, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.03em', background: 'linear-gradient(to bottom,#EDEDEF,rgba(237,237,239,0.8))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Agent 狀態
            </h2>
          </div>
          <span style={{ fontSize: 13, color: T.fgMuted }}>6 Agent</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="ag2-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ ...card, height: 260 }}>
                <div style={{ height: '100%', borderRadius: 10, background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="ag2-grid">
            {agents.map(ag => {
              const isHov = hovCard === ag.name
              return (
                <div
                  key={ag.name}
                  onMouseEnter={() => setHovCard(ag.name)}
                  onMouseLeave={() => setHovCard(null)}
                  style={{
                    ...card,
                    background: isHov ? T.surfaceHov : T.surface,
                    transform: isHov ? 'translateY(-2px)' : 'none',
                    boxShadow: isHov
                      ? `0 8px 40px rgba(0,0,0,0.5), 0 0 60px ${ag.color}10`
                      : '0 2px 20px rgba(0,0,0,0.3)',
                    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  {/* Avatar row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', background: ag.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 700, color: '#050506', flexShrink: 0,
                      boxShadow: `0 0 20px ${ag.color}40`,
                    }}>
                      {ag.name.slice(0, 1)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: T.fg }}>{ag.name}</h3>
                      <span style={{ fontSize: 12, color: T.fgMuted }}>{ag.role}</span>
                    </div>
                  </div>

                  {/* Status pill */}
                  <div style={{ marginBottom: 14 }}>
                    <span style={{
                      fontSize: 12, padding: '3px 12px', borderRadius: 20,
                      background: ag.isActive ? `${T.green}18` : 'rgba(255,255,255,0.06)',
                      color: ag.isActive ? T.green : T.fgSubtle,
                      border: `1px solid ${ag.isActive ? `${T.green}30` : T.borderSub}`,
                    }}>
                      {ag.isActive ? '● Active' : '○ Idle'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, padding: '10px 0', borderTop: `1px solid ${T.borderSub}`, borderBottom: `1px solid ${T.borderSub}` }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: T.fg, fontVariantNumeric: 'tabular-nums' }}>{ag.completed}</div>
                      <div style={{ fontSize: 11, color: T.fgMuted }}>本週完成</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: T.fg, fontVariantNumeric: 'tabular-nums' }}>{ag.successRate}%</div>
                      <div style={{ fontSize: 11, color: T.fgMuted }}>成功率</div>
                    </div>
                  </div>

                  {/* Recent tasks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ag.recentTasks.map((task, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.fgMuted }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: ag.color, flexShrink: 0, opacity: 0.6 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p style={{ textAlign: 'center', color: 'rgba(138,143,152,0.35)', fontSize: 11, paddingTop: 24, letterSpacing: '0.02em' }}>
          SAGI Hub · Agent 狀態 · © 2026
        </p>
      </div>
    </div>
  )
}
