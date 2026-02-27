'use client'

import { Cpu, Database, HardDrive, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'

type SystemStatus = {
  tokenUsage: {
    current: number
    limit: number
    percentage: number
    weeklyQuotaUsed: boolean
  }
  sessions: {
    active: number
    total: number
    mainAgent: number
    subAgents: number
  }
  storage: {
    openclaw: string
    diskUsage: number
    available: string
  }
  system: {
    uptime: string
    lastRestart: string
    status: 'healthy' | 'warning' | 'error'
  }
  timestamp: string
  error?: string
}

function formatNumber(num: number): string {
  return num.toLocaleString()
}

function getStatusColor(status: 'healthy' | 'warning' | 'error'): string {
  switch (status) {
    case 'healthy': return '#4ade80'
    case 'warning': return '#facc15'
    case 'error': return '#ef4444'
  }
}

function getStatusIcon(status: 'healthy' | 'warning' | 'error') {
  switch (status) {
    case 'healthy': return <CheckCircle2 size={16} />
    case 'warning': return <AlertTriangle size={16} />
    case 'error': return <AlertTriangle size={16} />
  }
}

export default function SystemMonitor() {
  const [data, setData] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system-status')
      const json = await res.json()
      
      if (json.error) {
        setError(true)
      } else {
        setData(json)
        setError(false)
      }
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle size={18} />
          <span className="text-sm">系統狀態載入失敗</span>
        </div>
      </div>
    )
  }

  const statusColor = getStatusColor(data.system.status)
  const statusIcon = getStatusIcon(data.system.status)

  const cards = [
    {
      icon: <Database size={18} />,
      label: 'Session 健康',
      value: data.sessions.active.toString(),
      subValue: `總計 ${data.sessions.total} 個 Sessions`,
      detail: `Main: ${data.sessions.mainAgent} · Sub: ${data.sessions.subAgents}`,
      color: '#10b981',
      progress: null,
    },
    {
      icon: <HardDrive size={18} />,
      label: '存儲空間',
      value: data.storage.openclaw,
      subValue: `磁碟使用 ${data.storage.diskUsage}%`,
      detail: `可用 ${data.storage.available}`,
      color: data.storage.diskUsage > 80 ? '#ef4444' : data.storage.diskUsage > 60 ? '#facc15' : '#a855f7',
      warning: data.storage.diskUsage > 80 ? '磁碟空間不足' : null,
      progress: data.storage.diskUsage,
    },
    {
      icon: <Clock size={18} />,
      label: '系統運行時間',
      value: data.system.uptime,
      subValue: `上次重啟：${data.system.lastRestart}`,
      color: '#06b6d4',
      progress: null,
    },
  ]

  return (
    <section className="mb-8">
      {/* Header with status indicator */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
          <Cpu size={14} /> OpenClaw 系統狀態
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ background: statusColor }}
            />
            {data.system.status === 'healthy' && (
              <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-40" style={{ background: statusColor }} />
            )}
          </div>
          <span className="text-xs" style={{ color: statusColor }}>
            {data.system.status === 'healthy' ? '正常' : data.system.status === 'warning' ? '警告' : '異常'}
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className="group rounded-xl border p-3 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
            style={{
              borderColor: `${card.color}30`,
              background: `linear-gradient(135deg, ${card.color}08 0%, ${card.color}03 100%)`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${card.color}18`, color: card.color }}>
                {card.icon}
              </div>
              {card.warning && (
                <div className="flex items-center gap-1 text-red-400">
                  <AlertTriangle size={14} />
                </div>
              )}
            </div>

            {/* Label */}
            <div className="text-[10px] text-foreground-subtle uppercase tracking-wider mb-1">
              {card.label}
            </div>

            {/* Value */}
            <div className="text-xl font-bold mb-0.5" style={{ color: card.color }}>
              {card.value}
            </div>

            {/* Sub-value */}
            <div className="text-xs text-foreground-muted mb-1">
              {card.subValue}
            </div>

            {/* Detail */}
            {card.detail && (
              <div className="text-[10px] text-foreground-subtle">
                {card.detail}
              </div>
            )}

            {/* Warning message */}
            {card.warning && (
              <div className="mt-2 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
                <div className="text-[10px] text-red-400">{card.warning}</div>
              </div>
            )}

            {/* Progress bar */}
            {card.progress !== null && (
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(card.progress, 100)}%`, 
                    background: `linear-gradient(90deg, ${card.color}, ${card.color}99)` 
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-3 text-right">
        <span className="text-[10px] text-foreground-subtle">
          每 15 秒自動更新 · 最後更新：{new Date(data.timestamp).toLocaleTimeString('zh-TW')}
        </span>
      </div>
    </section>
  )
}
