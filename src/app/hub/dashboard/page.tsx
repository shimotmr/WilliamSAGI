'use client'

import React, { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import Link from 'next/link'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const STYLE = {
  bg: '#0a0e1a', card: '#101620', border: '#1c2432', muted: '#0f1621',
  text: '#e3e8ef', textMuted: '#7f8b99', textSubtle: '#6b7684',
  font: 'Inter, "Noto Sans TC", sans-serif',
}

const ACCENTS: Record<string, { color: string; bg: string; border: string }> = {
  red:    { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)' },
  blue:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)' },
  amber:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)' },
  green:  { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)' },
  purple: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)' },
  indigo: { color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)' },
}

const AGENT_ACCENT = ['blue','green','purple','amber','red','indigo']

// Inline SVG icons
const Icons = {
  Task: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="3" y="6" width="18" height="16" rx="2"/><path d="M9 12h6M9 16h4"/></svg>,
  Zap: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Check: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Trend: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Server: (c: string) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  Chart: (c: string) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Bot: (c: string) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V5"/><circle cx="12" cy="4" r="1"/><path d="M8 15h.01M16 15h.01M12 17h.01"/></svg>,
  Dot: (c: string) => <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0, marginTop: 6 }} />,
}

class EB extends React.Component<{children: React.ReactNode}, {err: boolean}> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  render() { return this.state.err ? <div style={{ color: STYLE.textMuted, fontSize: 12, padding: 8 }}>載入中…</div> : this.props.children }
}

type Agent = { name: string; role: string; total: number; completed: number; successRate: number; isActive: boolean }
type Task = { title: string; assignee: string; updatedAt?: string; completedAt?: string }
type Data = { statusCounts: Record<string,number>; totalTasks: number; weekCompleted: number; completionRate: number; agents: Agent[]; recentCompleted: Task[]; runningTasks: Task[]; tokenTrend: {date:string;tokens:number}[] }

function card(accent?: keyof typeof ACCENTS) {
  const a = accent ? ACCENTS[accent] : null
  return { background: a ? a.bg : STYLE.card, border: `1px solid ${a ? a.border : STYLE.border}`, borderRadius: 14, padding: 20 }
}

export default function DashboardPage() {
  const [data, setData] = useState<Data | null>(null)
  const [, setErr] = useState(false)
  const [ts, setTs] = useState('')

  useEffect(() => {
    fetch('/api/hub/dashboard')
      .then(r => r.json())
      .then(d => { if (d && !d.error) { setData(d); setTs(new Date().toLocaleTimeString('zh-TW')) } })
      .catch(() => setErr(true))
    const t = setInterval(() => {
      fetch('/api/hub/dashboard').then(r => r.json()).then(d => { if (d && !d.error) { setData(d); setTs(new Date().toLocaleTimeString('zh-TW')) } }).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const stats = data ? [
    { label: '待執行', value: data.statusCounts['待執行'] ?? 0, sub: `共 ${data.totalTasks} 個任務`, accent: 'blue', icon: Icons.Task },
    { label: '執行中', value: data.statusCounts['執行中'] ?? 0, sub: 'Agent 作業中', accent: 'amber', icon: Icons.Zap },
    { label: '已完成', value: data.statusCounts['已完成'] ?? 0, sub: `本週 ${data.weekCompleted}`, accent: 'green', icon: Icons.Check },
    { label: '完成率', value: `${data.completionRate}%`, sub: '歷史總覽', accent: 'purple', icon: Icons.Trend },
  ] : []

  return (
    <div style={{ minHeight: '100vh', background: STYLE.bg, fontFamily: STYLE.font, color: STYLE.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+TC:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <Link href="/hub" style={{ color: STYLE.textMuted, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Hub
            </Link>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Clawd Dashboard</div>
            <div style={{ color: STYLE.textMuted, fontSize: 13, marginTop: 4 }}>系統即時監控中心 · 每 30 秒自動更新</div>
          </div>
          {ts && <div style={{ ...card(), padding: '8px 14px', fontSize: 12, color: STYLE.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {ts}
          </div>}
        </div>

        {!data ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: STYLE.textMuted, fontSize: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', marginRight: 8 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            載入中…
          </div>
        ) : <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {stats.map(s => {
              const a = ACCENTS[s.accent as keyof typeof ACCENTS]
              return (
                <div key={s.label} style={{ ...card(s.accent as keyof typeof ACCENTS), display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'default' }}>
                  <div style={{ padding: 10, background: a.bg, border: `1px solid ${a.border}`, borderRadius: 10 }}>
                    {s.icon(a.color)}
                  </div>
                  <div>
                    <div style={{ color: STYLE.textMuted, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: STYLE.text, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ color: STYLE.textSubtle, fontSize: 11, marginTop: 4 }}>{s.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Row 2: System + Chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 14, marginBottom: 20 }}>
            {/* System status */}
            <div style={card()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {Icons.Server(ACCENTS.purple.color)}
                <span style={{ fontWeight: 600, fontSize: 13 }}>OpenClaw 系統狀態</span>
                <div style={{ marginLeft: 'auto', background: ACCENTS.green.bg, border: `1px solid ${ACCENTS.green.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, color: ACCENTS.green.color }}>● 正常</div>
              </div>
              <EB>
                {[
                  { label: '待執行任務', value: `${data.statusCounts['待執行'] ?? 0} 個` },
                  { label: '執行中任務', value: `${data.statusCounts['執行中'] ?? 0} 個` },
                  { label: '本週完成', value: `${data.weekCompleted} 個` },
                  { label: 'Agent 總數', value: `${data.agents.length} 個` },
                ].map((r, i) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? `1px solid ${STYLE.border}` : 'none' }}>
                    <span style={{ color: STYLE.textMuted, fontSize: 13 }}>{r.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{r.value}</span>
                  </div>
                ))}
              </EB>
            </div>

            {/* Token trend */}
            <div style={card()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {Icons.Chart(ACCENTS.indigo.color)}
                <span style={{ fontWeight: 600, fontSize: 13 }}>Token 消耗趨勢（近 7 天）</span>
              </div>
              <EB>
                {data.tokenTrend.length > 0 ? (
                  <Line
                    data={{
                      labels: data.tokenTrend.map(d => d.date.slice(5)),
                      datasets: [{ label: 'Tokens', data: data.tokenTrend.map(d => d.tokens), borderColor: ACCENTS.indigo.color, backgroundColor: ACCENTS.indigo.bg, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: ACCENTS.indigo.color }]
                    }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: STYLE.border }, ticks: { color: STYLE.textMuted, font: { size: 10 } } }, y: { grid: { color: STYLE.border }, ticks: { color: STYLE.textMuted, font: { size: 10 } } } } }}
                    height={160}
                  />
                ) : (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: STYLE.textMuted, fontSize: 13 }}>尚無資料</div>
                )}
              </EB>
            </div>
          </div>

          {/* Agents */}
          {data.agents.length > 0 && (
            <div style={{ ...card(), marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {Icons.Bot(ACCENTS.blue.color)}
                <span style={{ fontWeight: 600, fontSize: 13 }}>Agent 狀態總覽</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {data.agents.slice(0, 9).map((ag, i) => {
                  const ak = AGENT_ACCENT[i % AGENT_ACCENT.length] as keyof typeof ACCENTS
                  const a = ACCENTS[ak]
                  return (
                    <div key={ag.name} style={{ background: a.bg, border: `1px solid ${a.border}`, borderRadius: 10, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>{ag.name.slice(0,1).toUpperCase()}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ag.name}</div>
                          <div style={{ color: STYLE.textMuted, fontSize: 11 }}>{ag.role || ag.name}</div>
                        </div>
                        {ag.isActive && <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: ACCENTS.green.color, flexShrink: 0 }} />}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: STYLE.textMuted, marginBottom: 6 }}>
                        <span>完成 {ag.completed}</span>
                        <span>{ag.successRate}%</span>
                      </div>
                      <div style={{ height: 4, background: STYLE.border, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${ag.successRate}%`, background: a.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tasks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            {/* Running */}
            <div style={card()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                {Icons.Zap(ACCENTS.amber.color)}
                <span style={{ fontWeight: 600, fontSize: 13 }}>執行中任務</span>
                <div style={{ marginLeft: 'auto', background: ACCENTS.amber.bg, border: `1px solid ${ACCENTS.amber.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, color: ACCENTS.amber.color }}>{data.runningTasks.length}</div>
              </div>
              {data.runningTasks.length === 0
                ? <div style={{ textAlign: 'center', color: STYLE.textMuted, fontSize: 13, padding: '20px 0' }}>目前無執行中任務</div>
                : data.runningTasks.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < data.runningTasks.length - 1 ? `1px solid ${STYLE.border}` : 'none' }}>
                    {Icons.Dot(ACCENTS.amber.color)}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <div style={{ color: STYLE.textMuted, fontSize: 11, marginTop: 2 }}>{t.assignee}</div>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Recent */}
            <div style={card()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                {Icons.Check(ACCENTS.green.color)}
                <span style={{ fontWeight: 600, fontSize: 13 }}>最近完成任務</span>
              </div>
              {data.recentCompleted.length === 0
                ? <div style={{ textAlign: 'center', color: STYLE.textMuted, fontSize: 13, padding: '20px 0' }}>尚無完成紀錄</div>
                : data.recentCompleted.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < data.recentCompleted.length - 1 ? `1px solid ${STYLE.border}` : 'none' }}>
                    {Icons.Dot(ACCENTS.green.color)}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <div style={{ color: STYLE.textMuted, fontSize: 11, marginTop: 2 }}>
                        {t.assignee} · {t.completedAt ? new Date(t.completedAt).toLocaleDateString('zh-TW') : ''}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          <div style={{ textAlign: 'center', color: STYLE.textSubtle, fontSize: 12, paddingBottom: 16 }}>
            William Hub — Clawd Dashboard · © 2026
          </div>
        </>}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } } @media(max-width:768px){.sg-stats{grid-template-columns:repeat(2,1fr)!important}.sg-row2,.sg-tasks{grid-template-columns:1fr!important}.sg-agents{grid-template-columns:repeat(2,1fr)!important}}`}</style>
      </div>
    </div>
  )
}
