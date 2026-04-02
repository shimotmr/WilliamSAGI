// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const AGENTS_DIR = join(process.env.HOME || '/root', '.openclaw/agents')
const ONE_HOUR = 3600000
const ONE_DAY = 86400000

interface DiagnosisIssue {
  type: string
  severity: 'info' | 'warning' | 'critical'
  agent: string
  sessionKey: string
  label: string
  detail: string
  detectedAt: string
  metadata?: Record<string, unknown>
}

interface DiagnosisCategory {
  id: string
  name: string
  icon: string
  color: string
  count: number
  issues: DiagnosisIssue[]
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function loadAllSessions(): Array<{ agent: string; key: string; session: Record<string, any> }> {
  const results: Array<{ agent: string; key: string; session: Record<string, any> }> = []
  if (!existsSync(AGENTS_DIR)) return results

  try {
    const agents = readdirSync(AGENTS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)

    for (const agent of agents) {
      const sessFile = join(AGENTS_DIR, agent, 'sessions', 'sessions.json')
      if (!existsSync(sessFile)) continue
      try {
        const raw = JSON.parse(readFileSync(sessFile, 'utf-8'))
        for (const [key, session] of Object.entries(raw)) {
          results.push({ agent, key, session: session as Record<string, any> })
        }
      } catch {}
    }
  } catch {}

  return results
}

function detectGhostSessions(sessions: Array<{ agent: string; key: string; session: Record<string, any> }>, now: number): DiagnosisIssue[] {
  const issues: DiagnosisIssue[] = []
  const THRESHOLD_MS = 48 * ONE_HOUR

  for (const { agent, key, session } of sessions) {
    const updatedAt = session.updatedAt || session.lastActivityAt || 0
    const age = now - updatedAt
    if (updatedAt > 0 && age > THRESHOLD_MS) {
      const ageHours = Math.round(age / ONE_HOUR)
      const type = key.includes('subagent:') ? 'subagent' : key.includes('cron:') ? 'cron' : 'session'
      const status = session.status || 'unknown'

      if (status !== 'done' && status !== 'failed') {
        issues.push({
          type: 'ghost_session',
          severity: age > 7 * ONE_DAY ? 'critical' : 'warning',
          agent,
          sessionKey: key,
          label: `Ghost ${type}`,
          detail: `${type} session inactive for ${ageHours}h (status: ${status})`,
          detectedAt: new Date(now).toISOString(),
          metadata: { ageHours, status, updatedAt, sessionType: type }
        })
      }
    }
  }
  return issues
}

function detectDuplicateWake(sessions: Array<{ agent: string; key: string; session: Record<string, any> }>, now: number): DiagnosisIssue[] {
  const issues: DiagnosisIssue[] = []
  const THRESHOLD_MS = 10 * 60 * 1000

  const groups: Record<string, Array<{ agent: string; key: string; session: Record<string, any> }>> = {}

  for (const s of sessions) {
    if (s.key.endsWith(':main')) {
      const gk = `${s.agent}:main`
      if (!groups[gk]) groups[gk] = []
      groups[gk].push(s)
    } else if (s.key.includes('cron:') && !s.key.includes(':run:')) {
      const match = s.key.match(/cron:([a-f0-9-]+)/)
      if (match) {
        const gk = `${s.agent}:cron:${match[1]}`
        if (!groups[gk]) groups[gk] = []
        groups[gk].push(s)
      }
    }
  }

  for (const [groupKey, group] of Object.entries(groups)) {
    if (group.length <= 1) continue

    const recentActive = group.filter(s => {
      const updatedAt = s.session.updatedAt || s.session.lastActivityAt || 0
      return (now - updatedAt) < THRESHOLD_MS
    })

    if (recentActive.length > 1) {
      issues.push({
        type: 'duplicate_wake',
        severity: 'warning',
        agent: group[0].agent,
        sessionKey: groupKey,
        label: 'Duplicate Wake',
        detail: `${recentActive.length} sessions woke within 10 min window`,
        detectedAt: new Date(now).toISOString(),
        metadata: {
          concurrentCount: recentActive.length,
          sessionKeys: recentActive.map(s => s.key)
        }
      })
    }
  }
  return issues
}

function detectSchedulerWedge(sessions: Array<{ agent: string; key: string; session: Record<string, any> }>, now: number): DiagnosisIssue[] {
  const issues: DiagnosisIssue[] = []

  for (const { agent, key, session } of sessions) {
    if (!key.includes('cron:')) continue

    const status = session.status
    const startedAt = session.startedAt || 0
    const endedAt = session.endedAt || 0
    const runtimeMs = session.runtimeMs || 0

    if (status === 'running' && startedAt > 0) {
      const runningDuration = now - startedAt
      if (runningDuration > 2 * ONE_HOUR) {
        issues.push({
          type: 'scheduler_wedge',
          severity: runningDuration > 6 * ONE_HOUR ? 'critical' : 'warning',
          agent,
          sessionKey: key,
          label: 'Scheduler Wedge',
          detail: `Cron running for ${Math.round(runningDuration / ONE_HOUR)}h without completing`,
          detectedAt: new Date(now).toISOString(),
          metadata: { runningDurationMs: runningDuration, startedAt, label: session.label }
        })
      }
    }

    if (status === 'failed' && endedAt > 0) {
      const failureAge = now - endedAt
      if (failureAge < ONE_HOUR) {
        issues.push({
          type: 'scheduler_wedge',
          severity: 'info',
          agent,
          sessionKey: key,
          label: 'Recent Cron Failure',
          detail: `Cron job failed: ${session.label || key.split(':').pop()}`,
          detectedAt: new Date(now).toISOString(),
          metadata: { failedAt: endedAt, label: session.label, runtimeMs }
        })
      }
    }
  }
  return issues
}

function detectLeaseConflicts(): DiagnosisIssue[] {
  const issues: DiagnosisIssue[] = []
  const workDataDir = join(process.env.HOME || '/root', 'clawd/work-data')

  if (!existsSync(workDataDir)) return issues

  try {
    const files = readdirSync(workDataDir)
    for (const file of files) {
      if (file.endsWith('.lease') || file.endsWith('.claim') || file.endsWith('.lock')) {
        const filePath = join(workDataDir, file)
        const stat = statSync(filePath)
        const ageMs = Date.now() - stat.mtimeMs
        const ageHours = Math.round(ageMs / ONE_HOUR)

        if (ageHours > 24) {
          issues.push({
            type: 'lease_conflict',
            severity: ageHours > 72 ? 'critical' : 'warning',
            agent: 'system',
            sessionKey: file,
            label: 'Stale Lease/Lock',
            detail: `${file} is ${ageHours}h old — possibly abandoned`,
            detectedAt: new Date().toISOString(),
            metadata: { ageHours, filePath, fileType: file.split('.').pop() }
          })
        }
      }
    }
  } catch {}

  return issues
}

function detectStuckSubagents(sessions: Array<{ agent: string; key: string; session: Record<string, any> }>, now: number): DiagnosisIssue[] {
  const issues: DiagnosisIssue[] = []

  for (const { agent, key, session } of sessions) {
    if (!key.includes('subagent:')) continue
    const status = session.status
    const endedAt = session.endedAt || 0
    const startedAt = session.startedAt || 0

    if (startedAt > 0 && !endedAt && !status && (now - startedAt) > ONE_HOUR) {
      issues.push({
        type: 'ghost_session',
        severity: 'warning',
        agent,
        sessionKey: key,
        label: 'Abandoned Subagent',
        detail: `Subagent started but never completed (label: ${session.label || 'unknown'})`,
        detectedAt: new Date(now).toISOString(),
        metadata: { startedAt, label: session.label, model: session.model }
      })
    }

    if (status === 'failed' && endedAt > 0 && (now - endedAt) < ONE_DAY) {
      issues.push({
        type: 'scheduler_wedge',
        severity: 'info',
        agent,
        sessionKey: key,
        label: 'Failed Subagent',
        detail: `Subagent failed: ${session.label || key.split(':').pop()} (runtime: ${Math.round((session.runtimeMs || 0) / 1000)}s)`,
        detectedAt: new Date(endedAt).toISOString(),
        metadata: { label: session.label, runtimeMs: session.runtimeMs, model: session.model }
      })
    }
  }
  return issues
}

async function loadFromSupabase(): Promise<DiagnosisData | null> {
  try {
    const sb = getSupabase()
    const { data, error } = await sb
      .from('observability_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    return {
      ok: true,
      timestamp: data.created_at,
      summary: data.summary,
      categories: data.categories,
      agents: data.agents || [],
    }
  } catch {
    return null
  }
}

async function saveToSupabase(result: DiagnosisData): Promise<void> {
  try {
    const sb = getSupabase()
    await sb.from('observability_snapshots').insert({
      snapshot_type: 'full',
      summary: result.summary,
      categories: result.categories,
      agents: result.agents,
    })
  } catch {}
}

function runDiagnosis(): DiagnosisData {
  const now = Date.now()
  const allSessions = loadAllSessions()

  const ghostIssues = detectGhostSessions(allSessions, now)
  const duplicateWakeIssues = detectDuplicateWake(allSessions, now)
  const schedulerWedgeIssues = detectSchedulerWedge(allSessions, now)
  const leaseConflictIssues = detectLeaseConflicts()
  const stuckSubagentIssues = detectStuckSubagents(allSessions, now)

  const allWedgeIssues = [...schedulerWedgeIssues, ...stuckSubagentIssues.filter(i => i.type === 'scheduler_wedge')]

  const categories: DiagnosisCategory[] = [
    {
      id: 'ghost_session',
      name: 'Ghost Sessions',
      icon: '👻',
      color: '#a78bfa',
      count: ghostIssues.length,
      issues: ghostIssues.slice(0, 50),
    },
    {
      id: 'duplicate_wake',
      name: 'Duplicate Wake',
      icon: '⚡',
      color: '#f59e0b',
      count: duplicateWakeIssues.length,
      issues: duplicateWakeIssues.slice(0, 50),
    },
    {
      id: 'scheduler_wedge',
      name: 'Scheduler Wedge',
      icon: '🔧',
      color: '#ef4444',
      count: allWedgeIssues.length,
      issues: allWedgeIssues.slice(0, 50),
    },
    {
      id: 'lease_conflict',
      name: 'Lease Conflict',
      icon: '🔒',
      color: '#ec4899',
      count: leaseConflictIssues.length,
      issues: leaseConflictIssues.slice(0, 50),
    },
  ]

  const totalIssues = categories.reduce((sum, c) => sum + c.count, 0)
  const criticalCount = categories.flatMap(c => c.issues).filter(i => i.severity === 'critical').length
  const warningCount = categories.flatMap(c => c.issues).filter(i => i.severity === 'warning').length

  let healthScore = 100
  healthScore -= criticalCount * 20
  healthScore -= warningCount * 5
  healthScore = Math.max(0, healthScore)

  const healthStatus = healthScore >= 90 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical'

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    summary: {
      totalSessions: allSessions.length,
      totalIssues,
      criticalCount,
      warningCount,
      healthScore,
      healthStatus,
    },
    categories,
    agents: [...new Set(allSessions.map(s => s.agent))].sort(),
  }
}

export async function GET() {
  try {
    // Try local filesystem first (works when running on the same host)
    const canReadLocal = existsSync(AGENTS_DIR)

    if (canReadLocal) {
      const result = runDiagnosis()
      // Save snapshot to Supabase for remote access
      await saveToSupabase(result)
      return NextResponse.json(result)
    }

    // Fallback: load from Supabase snapshot
    const snapshot = await loadFromSupabase()
    if (snapshot) {
      return NextResponse.json(snapshot)
    }

    // No data available
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      summary: { totalSessions: 0, totalIssues: 0, criticalCount: 0, warningCount: 0, healthScore: 100, healthStatus: 'healthy' },
      categories: [
        { id: 'ghost_session', name: 'Ghost Sessions', icon: '👻', color: '#a78bfa', count: 0, issues: [] },
        { id: 'duplicate_wake', name: 'Duplicate Wake', icon: '⚡', color: '#f59e0b', count: 0, issues: [] },
        { id: 'scheduler_wedge', name: 'Scheduler Wedge', icon: '🔧', color: '#ef4444', count: 0, issues: [] },
        { id: 'lease_conflict', name: 'Lease Conflict', icon: '🔒', color: '#ec4899', count: 0, issues: [] },
      ],
      agents: [],
      _meta: { note: 'No local session data and no Supabase snapshot available' },
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Diagnosis failed',
      timestamp: new Date().toISOString(),
      summary: { totalSessions: 0, totalIssues: 0, criticalCount: 0, warningCount: 0, healthScore: 0, healthStatus: 'error' },
      categories: [],
    }, { status: 500 })
  }
}
