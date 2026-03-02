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

interface TodayData {
  completedTasks: number
  runningTasks: number
  tokenUsage: number
  approvals: number
}

const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

function getTodayStr() {
  const d = new Date()
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 ${WEEKDAYS[d.getDay()]}`
}

const SCHEDULES = [
  { time: '09:00', title: '晨會 — 每日站立會議', color: T.accent },
  { time: '10:30', title: 'Agent 系統部署檢查', color: T.green },
  { time: '14:00', title: '投資組合週報審閱', color: T.amber },
  { time: '16:00', title: '技術架構討論會', color: T.purple },
]

const ACTIVITIES = [
  { time: '08:45', text: 'Travis 啟動每日排程掃描' },
  { time: '09:02', text: 'Blake 完成 LineBot 訓練模組更新' },
  { time: '09:15', text: 'Rex 產出市場分析報告 #247' },
  { time: '09:30', text: 'Oscar 執行資料庫備份作業' },
  { time: '10:00', text: 'Warren 下單 TSLA Put 對沖' },
  { time: '10:20', text: 'Griffin 完成安全掃描 — 0 異常' },
  { time: '11:05', text: 'Travis 核准 Blake 部署請求' },
  { time: '11:30', text: 'Rex 更新 RAG 知識庫索引' },
  { time: '12:00', text: 'Oscar 完成磁碟健康檢查' },
  { time: '13:15', text: 'Warren 調整加密貨幣曝險比例' },
]

export default function Today2Page() {
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hub/today-summary')
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) {
          setData({
            completedTasks: d.completedTasks ?? d.completed ?? 0,
            runningTasks: d.runningTasks ?? d.running ?? 0,
            tokenUsage: d.tokenUsage ?? d.tokens ?? 0,
            approvals: d.approvals ?? 0,
          })
        }
        setLoading(false)
      })
      .catch(() => { setLoading(false) })
  }, [])

  const stats = data || { completedTasks: 12, runningTasks: 3, tokenUsage: 847200, approvals: 5 }

  const statRows = [
    { icon: '✓', label: '已完成任務', value: `${stats.completedTasks} 筆`, color: T.green },
    { icon: '⚡', label: '執行中', value: `${stats.runningTasks} 筆`, color: T.amber },
    { icon: '◎', label: '今日 Token 用量', value: stats.tokenUsage.toLocaleString(), color: T.accent },
    { icon: '✎', label: '已處理簽核', value: `${stats.approvals} 筆`, color: T.purple },
  ]

  return (
    <div style={{ minHeight: '100vh', fontFamily: T.font, color: T.fg, background: T.bg, position: 'relative', overflow: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .td2-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
        @media(max-width:1023px){.td2-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:639px){.td2-grid{grid-template-columns:1fr}}
      `}</style>

      {/* Background layers */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top, #0a0a0f 0%, #050506 50%, #020203 100%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, opacity: 0.015, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.03em', background: 'linear-gradient(to bottom,#EDEDEF,rgba(237,237,239,0.8))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            今日摘要
          </h2>
          <span style={{ fontSize: 14, color: T.fgMuted }}>{getTodayStr()}</span>
        </div>

        {/* Three-column grid */}
        <div className="td2-grid">

          {/* Left: Weather + Schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Weather card */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 36 }}>☀️</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.fg }}>台北</div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: T.fg, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>26°C</div>
                  <div style={{ fontSize: 12, color: T.fgMuted }}>晴天，微風</div>
                </div>
              </div>
            </div>

            {/* Schedule card */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.fg, marginBottom: 14 }}>今日行程</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SCHEDULES.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < SCHEDULES.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                    <span style={{ fontSize: 12, color: T.fgMuted, fontFamily: T.mono, fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginTop: 1 }}>{s.time}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: T.fg }}>{s.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle: Work summary stats */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.fg, marginBottom: 18 }}>今日工作摘要</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {statRows.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 0', borderBottom: i < statRows.length - 1 ? `1px solid ${T.borderSub}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: `${r.color}18`, color: r.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                      border: `1px solid ${r.color}25`,
                    }}>
                      {r.icon}
                    </div>
                    <span style={{ fontSize: 13, color: T.fgMuted }}>{r.label}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: T.fg, fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Activity feed */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.fg, marginBottom: 14 }}>最近活動</div>
            <div style={{ position: 'relative', paddingLeft: 16 }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: 1, background: T.borderSub }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ACTIVITIES.map((a, i) => (
                  <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {/* Dot */}
                    <div style={{
                      position: 'absolute', left: -14, top: 5, width: 7, height: 7, borderRadius: '50%',
                      background: i === 0 ? T.accent : T.fgSubtle, border: `2px solid ${T.bg}`,
                      boxShadow: i === 0 ? `0 0 6px ${T.accentGlow}` : 'none',
                    }} />
                    <span style={{ fontSize: 11, color: T.fgMuted, fontFamily: T.mono, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{a.time}</span>
                    <span style={{ fontSize: 12, color: T.fgMuted, lineHeight: 1.4 }}>{a.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        <p style={{ textAlign: 'center', color: 'rgba(138,143,152,0.35)', fontSize: 11, paddingTop: 24, letterSpacing: '0.02em' }}>
          SAGI Hub · 今日摘要 · © 2026
        </p>
      </div>
    </div>
  )
}
