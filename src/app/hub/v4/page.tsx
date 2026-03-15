'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity, CheckCircle2, XCircle, Clock, Bot, Zap,
  TrendingUp, RefreshCw, AlertTriangle, Unlock,
  Hammer, Brain, FileText, BarChart3, Shield, Play,
} from 'lucide-react'

interface AgentStat {
  name: string
  completed: number
  failed: number
  total: number
  active: { id: number; title: string; updated_at: string; created_at: string } | null
}

interface RecentTask {
  id: number
  title: string
  assignee: string
  status: string
  completed_at: string
  updated_at: string
  result: string
}

const agentEmoji: Record<string, string> = {
  blake: '🔨', rex: '🧠', oscar: '📋', warren: '📈', griffin: '🛡️'
}

const agentRole: Record<string, string> = {
  blake: 'Builder', rex: 'Thinker', oscar: 'Operator', warren: 'Trader', griffin: 'Guardian'
}

const agentModel: Record<string, string> = {
  blake: 'gpt-5.4', rex: 'grok420', oscar: 'qwen3', warren: 'MiniMax-M2.5', griffin: 'qwen3'
}

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s 前`
  if (diff < 3600) return `${Math.floor(diff / 60)}m 前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h 前`
  return `${Math.floor(diff / 86400)}d 前`
}

function elapsed(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h${Math.floor((diff % 3600) / 60)}m`
}

function statusIcon(status: string) {
  switch (status) {
    case '已完成': return <CheckCircle2 size={14} style={{ color: '#4ade80' }} />
    case '失敗': return <XCircle size={14} style={{ color: '#f87171' }} />
    case '執行中': return <Play size={14} style={{ color: '#60a5fa' }} />
    default: return <Clock size={14} style={{ color: '#8A8F98' }} />
  }
}

export default function V4LiveFeed() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v4/status')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error('Failed to fetch status', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 30000)
    return () => clearInterval(iv)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#8A8F98' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #5E6AD2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p>載入系統狀態...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const stats = data?.stats || {}
  const agentStats: AgentStat[] = data?.agentStats || []
  const recentTasks: RecentTask[] = data?.recentTasks || []
  const activeTasks = data?.activeTasks || []

  const healthScore = Math.min(100, Math.max(0,
    (stats.successRate || 0) * 0.6 +
    (stats.running > 0 ? 20 : 0) +
    (stats.failed < 3 ? 20 : 10)
  ))
  const healthColor = healthScore >= 70 ? '#4ade80' : healthScore >= 40 ? '#facc15' : '#f87171'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.125rem, 4vw, 1.5rem)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={24} style={{ color: '#5E6AD2' }} />
            V4 System Center
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>
            AI Agent 即時監控 · {new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <span style={{ color: '#8A8F98' }}>系統健康:</span>
            <span style={{ fontWeight: 700, color: healthColor }}>{Math.round(healthScore)}%</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
          </div>
          <button
            onClick={() => { setRefreshing(true); fetchData() }}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0.375rem', cursor: 'pointer', color: '#8A8F98' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="v4-grid">
        <style>{`@media (min-width: 768px) { .v4-grid { grid-template-columns: 240px 1fr !important; } }`}</style>
        {/* Left column: stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Weekly stats */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
            <h3 style={{ fontSize: '0.6875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>本週統計</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8A8F98' }}>任務</span>
                <span style={{ fontWeight: 600 }}>{stats.total || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4ade80' }}>完成</span>
                <span style={{ fontWeight: 600, color: '#4ade80' }}>{stats.completed || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#f87171' }}>失敗</span>
                <span style={{ fontWeight: 600, color: '#f87171' }}>{stats.failed || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#60a5fa' }}>執行中</span>
                <span style={{ fontWeight: 600, color: '#60a5fa' }}>{stats.running || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#facc15' }}>待執行</span>
                <span style={{ fontWeight: 600, color: '#facc15' }}>{stats.pending || 0}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8A8F98' }}>成功率</span>
                <span style={{ fontWeight: 700, color: stats.successRate >= 70 ? '#4ade80' : '#facc15' }}>{stats.successRate || 0}%</span>
              </div>
            </div>
            {/* Success rate bar */}
            <div style={{ marginTop: '0.5rem', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${stats.successRate || 0}%`, background: stats.successRate >= 70 ? '#4ade80' : '#facc15', borderRadius: 2, transition: 'width 500ms' }} />
            </div>
          </div>
        </div>

        {/* Right column: agents + events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Agent Activity */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
            <h3 style={{ fontSize: '0.6875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>Agent 活動</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {agentStats.map(agent => (
                <div key={agent.name} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 0.75rem', borderRadius: 8,
                  background: agent.active ? 'rgba(94,106,210,0.08)' : 'transparent',
                  border: agent.active ? '1px solid rgba(94,106,210,0.15)' : '1px solid transparent',
                }}>
                  <span style={{ fontSize: '1.25rem' }}>{agentEmoji[agent.name] || '🤖'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                        {agent.name.charAt(0).toUpperCase() + agent.name.slice(1)}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#6b7280' }}>{agentModel[agent.name]}</span>
                    </div>
                    {agent.active ? (
                      <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '0.125rem' }}>
                        #{agent.active.id} {agent.active.title?.slice(0, 40)}
                        <span style={{ color: '#8A8F98', marginLeft: '0.5rem' }}>
                          {elapsed(agent.active.created_at)} ⏳
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.125rem' }}>💤 閒置</div>
                    )}
                  </div>
                  {agent.active && (
                    <Link href={`/hub/v4/task/${agent.active.id}`} style={{
                      fontSize: '0.6875rem', color: '#5E6AD2', textDecoration: 'none',
                      padding: '0.25rem 0.5rem', borderRadius: 4,
                      background: 'rgba(94,106,210,0.12)',
                    }}>
                      Replay →
                    </Link>
                  )}
                  {!agent.active && (
                    <span style={{ fontSize: '0.6875rem', color: '#4b5563' }}>
                      {agent.completed}/{agent.total}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Event Stream */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.6875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>事件流</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '0.6875rem', color: '#6b7280' }}>即時</span>
              </div>
              <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '400px', overflowY: 'auto' }}>
              {recentTasks.length === 0 ? (
                <div style={{ color: '#4b5563', fontSize: '0.8125rem', padding: '1rem', textAlign: 'center' }}>
                  本週尚無任務紀錄
                </div>
              ) : recentTasks.map(task => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                  padding: '0.5rem 0.625rem', borderRadius: 6,
                  background: 'rgba(255,255,255,0.01)',
                  borderLeft: `2px solid ${task.status === '已完成' ? '#22c55e' : task.status === '失敗' ? '#ef4444' : task.status === '執行中' ? '#3b82f6' : '#374151'}`,
                }}>
                  <span style={{ fontSize: '0.6875rem', color: '#6b7280', whiteSpace: 'nowrap', marginTop: '0.125rem' }}>
                    {timeAgo(task.updated_at)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
                      {statusIcon(task.status)}
                      <span style={{ fontWeight: 500 }}>#{task.id}</span>
                      <span style={{ color: '#8A8F98', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.title?.slice(0, 50)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#4b5563', marginTop: '0.125rem' }}>
                      {agentEmoji[task.assignee] || ''} {task.assignee}
                    </div>
                  </div>
                  <Link href={`/hub/v4/task/${task.id}`} style={{
                    fontSize: '0.6875rem', color: '#5E6AD2', textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}>
                    Replay →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
