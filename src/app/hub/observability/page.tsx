'use client'

import { useState, useCallback } from 'react'
import { useSmartPolling } from '../../hooks/useSmartPolling'
import SectionCard from '@/components/ui/SectionCard'
import PageHeader from '@/components/ui/PageHeader'
import { Activity, Ghost, Zap, Wrench, Lock, RefreshCw, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight, Clock } from 'lucide-react'

type DiagnosisIssue = {
  type: string
  severity: 'info' | 'warning' | 'critical'
  agent: string
  sessionKey: string
  label: string
  detail: string
  detectedAt: string
  metadata?: Record<string, unknown>
}

type DiagnosisCategory = {
  id: string
  name: string
  icon: string
  color: string
  count: number
  issues: DiagnosisIssue[]
}

type DiagnosisSummary = {
  totalSessions: number
  totalIssues: number
  criticalCount: number
  warningCount: number
  healthScore: number
  healthStatus: 'healthy' | 'warning' | 'critical' | 'error'
}

type DiagnosisData = {
  ok: boolean
  timestamp: string
  summary: DiagnosisSummary
  categories: DiagnosisCategory[]
  agents: string[]
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Critical' },
    warning: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Warning' },
    info: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Info' },
  }
  const c = config[severity] || config.info
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function HealthScoreGauge({ score, status }: { score: number; status: string }) {
  const color = status === 'healthy' ? '#4ade80' : status === 'warning' ? '#facc15' : '#ef4444'
  const label = status === 'healthy' ? 'Healthy' : status === 'warning' ? 'Degraded' : 'Critical'
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const offset = circumference - progress

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={radius} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
        />
        <text x="48" y="44" textAnchor="middle" fill={color} fontSize="20" fontWeight="700" fontFamily="system-ui">
          {score}
        </text>
        <text x="48" y="60" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="system-ui">
          / 100
        </text>
      </svg>
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  )
}

function CategoryCard({ category, isExpanded, onToggle }: { category: DiagnosisCategory; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-colors text-left"
      >
        <span className="text-2xl">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">{category.name}</span>
            {category.count > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                }}
              >
                {category.count}
              </span>
            )}
          </div>
          {category.count === 0 && (
            <span className="text-xs text-[var(--foreground-muted)]">No issues detected</span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-[var(--foreground-muted)]" />
        ) : (
          <ChevronRight size={16} className="text-[var(--foreground-muted)]" />
        )}
      </button>
      
      {isExpanded && category.issues.length > 0 && (
        <div className="border-t border-white/[0.04]">
          {category.issues.map((issue, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02]"
            >
              <SeverityBadge severity={issue.severity} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-[var(--foreground)]">{issue.label}</span>
                  <span className="text-xs text-[var(--foreground-muted)] bg-white/[0.05] px-1.5 py-0.5 rounded">
                    {issue.agent}
                  </span>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">{issue.detail}</p>
                {issue.metadata && (
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[var(--foreground-muted)]">
                    {Object.entries(issue.metadata).slice(0, 4).map(([k, v]) => (
                      <span key={k} className="bg-white/[0.03] px-1.5 py-0.5 rounded">
                        {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[var(--foreground-muted)] whitespace-nowrap flex items-center gap-1">
                <Clock size={10} />
                {new Date(issue.detectedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ObservabilityDiagnosisPage() {
  const [data, setData] = useState<DiagnosisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/observability-diagnosis')
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setError('')
      
      // Auto-expand categories with issues
      if (json.categories) {
        const withIssues = json.categories.filter((c: DiagnosisCategory) => c.count > 0).map((c: DiagnosisCategory) => c.id)
        setExpandedCategories(new Set(withIssues))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  useSmartPolling(fetchData, 60000, [fetchData])

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
          <RefreshCw size={16} className="animate-spin" />
          Running diagnosis...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <PageHeader title="Observability Diagnosis" description="系統健康診斷" backHref="/hub" backLabel="Hub" />
        <SectionCard title="載入失敗">
          <div className="text-sm text-red-400">{error || '無法載入診斷資料'}</div>
        </SectionCard>
      </div>
    )
  }

  const { summary, categories } = data
  const statusIcon = summary.healthStatus === 'healthy' 
    ? <CheckCircle2 size={16} className="text-green-400" />
    : summary.healthStatus === 'warning'
    ? <AlertTriangle size={16} className="text-amber-400" />
    : <XCircle size={16} className="text-red-400" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Observability Diagnosis"
        description="OpenClaw 系統健康診斷 · Session & Task 異常偵測"
        backHref="/hub"
        backLabel="Hub"
        rightSlot={
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <span className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
              {statusIcon}
              更新時間 {lastUpdated}
            </span>
          </div>
        }
      />

      {/* Summary Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <SectionCard title="Health Score" className="flex items-center justify-center">
          <HealthScoreGauge score={summary.healthScore} status={summary.healthStatus} />
        </SectionCard>

        <SectionCard title="Diagnosis Summary" subtitle={`掃描 ${summary.totalSessions} sessions · ${data.agents?.length || 0} agents`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-center">
              <div className="text-2xl font-bold text-[var(--foreground)]">{summary.totalIssues}</div>
              <div className="text-xs text-[var(--foreground-muted)] mt-1">Total Issues</div>
            </div>
            <div className="rounded-lg bg-red-500/[0.06] border border-red-500/10 p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{summary.criticalCount}</div>
              <div className="text-xs text-red-300/60 mt-1">Critical</div>
            </div>
            <div className="rounded-lg bg-amber-500/[0.06] border border-amber-500/10 p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{summary.warningCount}</div>
              <div className="text-xs text-amber-300/60 mt-1">Warning</div>
            </div>
            <div className="rounded-lg bg-green-500/[0.06] border border-green-500/10 p-3 text-center">
              <div className="text-2xl font-bold text-green-400">
                {summary.totalSessions - summary.totalIssues}
              </div>
              <div className="text-xs text-green-300/60 mt-1">Clean Sessions</div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Category Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--foreground-muted)] px-1">Issue Categories</h2>
        {categories.map(category => (
          <CategoryCard
            key={category.id}
            category={category}
            isExpanded={expandedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
          />
        ))}
      </div>

      {/* Agent Summary */}
      {data.agents && data.agents.length > 0 && (
        <SectionCard title="Monitored Agents" subtitle="掃描範圍">
          <div className="flex flex-wrap gap-2">
            {data.agents.map(agent => (
              <span
                key={agent}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[var(--foreground)]"
              >
                <Activity size={12} className="text-[var(--foreground-muted)]" />
                {agent}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Raw Diagnosis Info */}
      <SectionCard title="Diagnosis Info">
        <div className="font-mono text-xs text-[var(--foreground-muted)] space-y-1">
          <div>Endpoint: <span className="text-[var(--foreground)]">/api/observability-diagnosis</span></div>
          <div>Scan Time: <span className="text-[var(--foreground)]">{data.timestamp}</span></div>
          <div>Detectors: <span className="text-[var(--foreground)]">ghost_session, duplicate_wake, scheduler_wedge, lease_conflict</span></div>
          <div>Data Source: <span className="text-[var(--foreground)]">~/.openclaw/agents/*/sessions/sessions.json</span></div>
        </div>
      </SectionCard>
    </div>
  )
}
