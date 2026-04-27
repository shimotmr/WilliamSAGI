import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, statSync } from 'fs'
import type {
  EventItem,
  ReportItem,
  TaskItem,
  TelegramMessageItem,
  WebOsData,
} from '@/features/openclaw-os/types'

const TELEGRAM_GUARD_STATE = '/Users/travis/clawd/data/telegram_session_guard_state.json'
const TELEGRAM_GUARD_LOG = '/Users/travis/clawd/logs/telegram_session_guard.log'
const GATEWAY_LAST = '/Users/travis/clawd/data/cron_heartbeats/gateway_health_check.last'
const TELEGRAM_LAST = '/Users/travis/clawd/data/cron_heartbeats/telegram_session_guard.last'
const NOTIFICATION_SETTINGS = '/Users/travis/clawd/data/notification_settings.json'
const MAIN_SESSIONS_INDEX = '/Users/travis/.openclaw/agents/main/sessions/sessions.json'

function safeReadText(path: string) {
  try {
    if (!existsSync(path)) return ''
    return readFileSync(path, 'utf-8')
  } catch {
    return ''
  }
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function safeReadJson(path: string, fallback: any) {
  try {
    if (!existsSync(path)) return fallback
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return fallback
  }
}

function safeReadTail(path: string, maxLines = 20) {
  try {
    if (!existsSync(path)) return []
    const lines = readFileSync(path, 'utf-8').trim().split('\n').filter(Boolean)
    return lines.slice(-maxLines)
  } catch {
    return []
  }
}

function fileAgeMinutes(path: string) {
  try {
    if (!existsSync(path)) return null
    const st = statSync(path)
    return Math.round((Date.now() - st.mtimeMs) / 60000)
  } catch {
    return null
  }
}

function relativeTime(dateString?: string | null) {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '剛剛'
  if (diffMin < 60) return `${diffMin} 分鐘前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小時前`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay} 天前`
}

function eventTone(eventType: string) {
  if (['completed', 'harness_completed', 'started', 'dispatched', 'lease_acquired', 'lease_handoff'].includes(eventType)) {
    return 'positive'
  }
  if (['dispatch_suppressed', 'start_blocked', 'dispatch_blocked', 'harness_failed', 'adjudication_failed'].includes(eventType)) {
    return 'warning'
  }
  return 'neutral'
}

function summarizeEventContent(content: any) {
  if (!content) return ''
  if (typeof content === 'string') return content.slice(0, 240)
  if (typeof content !== 'object') return String(content).slice(0, 240)

  const priorityKeys = [
    'summary',
    'message',
    'reason',
    'error',
    'status',
    'note',
    'result',
    'model',
    'runtime',
    'session_id',
    'dispatch_runtime',
  ]

  const parts = priorityKeys
    .filter((key) => content[key] != null && content[key] !== '')
    .slice(0, 4)
    .map((key) => `${key}=${String(content[key])}`)

  if (parts.length > 0) return parts.join(' · ').slice(0, 240)

  try {
    return JSON.stringify(content).slice(0, 240)
  } catch {
    return ''
  }
}

function extractTextContent(message: any) {
  const content = message?.content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .filter((part: any) => part?.type === 'text')
    .map((part: any) => part?.text || '')
    .join('')
}

function parseTelegramUserPayload(text: string) {
  const infoMatch = text.match(/Conversation info \(untrusted metadata\):\s*```json\s*([\s\S]*?)\s*```/)
  const senderMatch = text.match(/Sender \(untrusted metadata\):\s*```json\s*([\s\S]*?)\s*```/)
  const repliedMatch = text.match(/Replied message \(untrusted, for context\):\s*```json\s*([\s\S]*?)\s*```/)

  let info: any = {}
  let sender: any = {}
  let replied: any = null

  try { if (infoMatch?.[1]) info = JSON.parse(infoMatch[1]) } catch {}
  try { if (senderMatch?.[1]) sender = JSON.parse(senderMatch[1]) } catch {}
  try { if (repliedMatch?.[1]) replied = JSON.parse(repliedMatch[1]) } catch {}

  const body = text
    .replace(/Conversation info \(untrusted metadata\):\s*```json[\s\S]*?```/g, '')
    .replace(/Sender \(untrusted metadata\):\s*```json[\s\S]*?```/g, '')
    .replace(/Replied message \(untrusted, for context\):\s*```json[\s\S]*?```/g, '')
    .trim()

  return { info, sender, replied, body }
}

function inferTelegramCommand(body: string) {
  const firstLine = body.split('\n').find((line) => line.trim())?.trim() || ''
  if (!firstLine) return null

  const commandMap: Array<[RegExp, string]> = [
    [/^(任務|task)\b/i, 'task'],
    [/^(行程|calendar)\b/i, 'calendar'],
    [/^(追蹤|track)\b/i, 'tracking'],
    [/^(參考|reference)\b/i, 'reference'],
    [/^(想法|idea)\b/i, 'idea'],
    [/^(搜尋|search)\b/i, 'search'],
    [/^(狀態|status)\b/i, 'status'],
  ]

  for (const [pattern, label] of commandMap) {
    if (pattern.test(firstLine)) return label
  }
  return null
}

function extractTaskRefs(body: string) {
  return Array.from(new Set((body.match(/#\d+/g) || []).map((item) => item.replace('#', '')))).slice(0, 6)
}

function extractUrls(body: string) {
  return Array.from(new Set(body.match(/https?:\/\/[^\s)]+/g) || [])).slice(0, 4)
}

function summarizeTelegramBody(body: string) {
  return body.replace(/\s+/g, ' ').trim().slice(0, 180)
}

function parseTelegramMessages() {
  const sessionsIndex = safeReadJson(MAIN_SESSIONS_INDEX, {})
  const candidates = Object.entries(sessionsIndex)
    .map(([sessionKey, meta]: any) => ({ sessionKey, ...(meta || {}) }))
    .filter((item: any) => item?.origin?.provider === 'telegram' || String(item?.sessionKey || '').includes('telegram'))
    .sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0))

  const latest = candidates[0]
  if (!latest?.sessionFile || !existsSync(latest.sessionFile)) {
    return {
      sessionKey: null,
      sessionId: null,
      updatedAt: null,
      messages: [],
    }
  }

  const lines = safeReadText(latest.sessionFile).split('\n').filter(Boolean)
  const ledger: TelegramMessageItem[] = []

  for (const line of lines) {
    try {
      const row = JSON.parse(line)
      if (row?.type !== 'message') continue
      const message = row?.message || {}
      const role = message?.role
      const text = extractTextContent(message).trim()
      if (!text) continue

      if (role === 'user' && text.includes('Conversation info (untrusted metadata):')) {
        const parsed = parseTelegramUserPayload(text)
        ledger.push({
          id: parsed.info?.message_id || row.id,
          kind: 'inbound',
          timestamp: row.timestamp,
          relative: relativeTime(row.timestamp),
          senderLabel: parsed.sender?.label || parsed.info?.sender || 'Telegram User',
          senderId: parsed.info?.sender_id || parsed.sender?.id || null,
          body: parsed.body || '(空訊息)',
          replyToId: parsed.info?.reply_to_id || null,
          repliedBody: parsed.replied?.body || null,
          hasReplyContext: Boolean(parsed.info?.has_reply_context),
          commandType: inferTelegramCommand(parsed.body || ''),
          taskRefs: extractTaskRefs(parsed.body || ''),
          urls: extractUrls(parsed.body || ''),
          summary: summarizeTelegramBody(parsed.body || '(空訊息)'),
        })
        continue
      }

      if (role === 'assistant') {
        if (
          text === 'HEARTBEAT_OK' ||
          text.startsWith('System: ') ||
          text.startsWith('[cron:') ||
          text.startsWith('[')
        ) {
          continue
        }
        ledger.push({
          id: row.id,
          kind: 'outbound',
          timestamp: row.timestamp,
          relative: relativeTime(row.timestamp),
          senderLabel: 'Travis Macmini',
          senderId: latest?.origin?.to || latest?.lastTo || null,
          body: text,
          commandType: inferTelegramCommand(text),
          taskRefs: extractTaskRefs(text),
          urls: extractUrls(text),
          summary: summarizeTelegramBody(text),
        })
      }
    } catch {}
  }

  const messages = ledger.slice(-18).reverse()
  const commandHits = messages.reduce((acc: Record<string, number>, item) => {
    if (!item.commandType) return acc
    acc[item.commandType] = (acc[item.commandType] || 0) + 1
    return acc
  }, {})

  return {
    sessionKey: latest.sessionKey,
    sessionId: latest.sessionId,
    updatedAt: latest.updatedAt || null,
    messages,
    stats: {
      inbound: messages.filter((item: any) => item.kind === 'inbound').length,
      outbound: messages.filter((item: any) => item.kind === 'outbound').length,
      replyContext: messages.filter((item: any) => item.hasReplyContext).length,
      commands: commandHits,
    },
  }
}

export const revalidate = 30

export async function GET() {
  const supabase = getSupabase()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  const [
    recentTasksResult,
    recentEventsResult,
    statusCountsResult,
    recentReportsResult,
    agentTasksResult,
    completedTodayResult,
  ] = await Promise.all([
    supabase
      .from('board_tasks')
      .select('id,title,status,priority,assignee,updated_at,created_at,started_at,completed_at,session_id,dispatch_runtime,progress,result')
      .order('updated_at', { ascending: false })
      .limit(16),
    supabase
      .from('task_events')
      .select('id,task_id,event_type,created_at,content')
      .order('created_at', { ascending: false })
      .limit(36),
    supabase
      .from('board_tasks')
      .select('status'),
    supabase
      .from('reports')
      .select('id,title,author,type,created_at,task_id')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('board_tasks')
      .select('assignee,status,updated_at')
      .neq('assignee', '待分配')
      .limit(1500),
    supabase
      .from('board_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', '已完成')
      .gte('completed_at', todayIso),
  ])

  const tasks = (recentTasksResult.data || []) as TaskItem[]
  const recentEvents = recentEventsResult.data || []
  const reports = (recentReportsResult.data || []) as ReportItem[]
  const statusRows = statusCountsResult.data || []
  const agentRows = agentTasksResult.data || []

  const taskMap = new Map(tasks.map((task) => [task.id, task]))
  const statusCounts = statusRows.reduce((acc: Record<string, number>, row: any) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    return acc
  }, {})

  const activeNow = (statusCounts['執行中'] || 0) + (statusCounts['已派發'] || 0)
  const pendingNow = (statusCounts['待執行'] || 0) + (statusCounts['待派發'] || 0)
  const completedToday = completedTodayResult.count || 0
  const anomalies24h = recentEvents.filter((event: any) =>
    ['dispatch_suppressed', 'start_blocked', 'dispatch_blocked', 'harness_failed', 'adjudication_failed'].includes(event.event_type)
  )

  const runningTasks = tasks.filter((task) => ['執行中', '已派發'].includes(task.status)).slice(0, 5)
  const pendingTasks = tasks.filter((task) => ['待執行', '待派發', '待確認', '已分解'].includes(task.status)).slice(0, 5)
  const finishedTasks = tasks.filter((task) => ['已完成', '已失敗', '已取消'].includes(task.status)).slice(0, 5)
  const sessionTasks = tasks.filter((task) => task.session_id).slice(0, 6)

  const agentAliasMap: Record<string, string> = {
    travis: 'Travis',
    main: 'Travis',
    blake: 'Blake',
    coder: 'Blake',
    'coder-b': 'Blake',
    rex: 'Rex',
    researcher: 'Rex',
    oscar: 'Oscar',
    secretary: 'Oscar',
    warren: 'Warren',
    trader: 'Warren',
    griffin: 'Griffin',
    inspector: 'Griffin',
  }

  const agentPalette: Record<string, string> = {
    Travis: '#5E6AD2',
    Blake: '#4ade80',
    Rex: '#f59e0b',
    Oscar: '#60a5fa',
    Warren: '#fbbf24',
    Griffin: '#ef4444',
    Other: '#8A8F98',
  }

  const agentStatsMap = agentRows.reduce((acc: Record<string, any>, row: any) => {
    const raw = String(row.assignee || '').toLowerCase()
    const name = agentAliasMap[raw] || row.assignee || 'Other'
    if (!acc[name]) {
      acc[name] = { name, total: 0, running: 0, pending: 0, completed: 0, color: agentPalette[name] || agentPalette.Other }
    }
    acc[name].total += 1
    if (['執行中', '已派發'].includes(row.status)) acc[name].running += 1
    else if (['待執行', '待派發', '待確認', '已分解'].includes(row.status)) acc[name].pending += 1
    else if (row.status === '已完成') acc[name].completed += 1
    return acc
  }, {})

  const agents = Object.values(agentStatsMap)
    .sort((a: any, b: any) => (b.running + b.pending + b.completed) - (a.running + a.pending + a.completed))
    .slice(0, 6)

  const telegramState = safeReadJson(TELEGRAM_GUARD_STATE, { findings: [], signature: '' })
  const notificationSettings = safeReadJson(NOTIFICATION_SETTINGS, {})
  const telegramTail = safeReadTail(TELEGRAM_GUARD_LOG, 12)
  const telegramMessages = parseTelegramMessages()
  const gatewayLastMinutes = fileAgeMinutes(GATEWAY_LAST)
  const telegramTaskIds = Array.from(
    new Set(
      (telegramMessages.messages || [])
        .flatMap((message: any) => message.taskRefs || [])
        .map((taskId: string) => Number(taskId))
        .filter((taskId: number) => Number.isFinite(taskId))
    )
  )
  const [telegramTaskLinksResult, telegramReportLinksResult] = telegramTaskIds.length > 0
    ? await Promise.all([
        supabase
          .from('board_tasks')
          .select('id,title,status,priority,assignee,updated_at')
          .in('id', telegramTaskIds),
        supabase
          .from('reports')
          .select('id,title,author,type,task_id,created_at')
          .in('task_id', telegramTaskIds)
          .order('created_at', { ascending: false })
          .limit(24),
      ])
    : [{ data: [] }, { data: [] }] as any

  const latestTelegramProbe = [...telegramTail].reverse().find((line) => line.includes('"ok"'))
  const blockedProvidersMatch = latestTelegramProbe?.match(/"blockedProviders"\s*:\s*\[(.*?)\]/)
  const blockedProviders = blockedProvidersMatch?.[1]
    ? blockedProvidersMatch[1].replace(/"/g, '').split(',').map((item) => item.trim()).filter(Boolean)
    : []

  const telegramTaskMap = new Map((telegramTaskLinksResult.data || []).map((task: any) => [String(task.id), task]))
  const telegramReportsByTask = (telegramReportLinksResult.data || []).reduce((acc: Record<string, any[]>, report: any) => {
    const key = String(report.task_id)
    acc[key] = acc[key] || []
    if (acc[key].length < 3) acc[key].push(report)
    return acc
  }, {})

  telegramMessages.messages = (telegramMessages.messages || []).map((message: any) => {
    const taskCards = (message.taskRefs || [])
      .map((taskId: string) => telegramTaskMap.get(String(taskId)))
      .filter(Boolean)
      .map((task: any) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee,
        relative: relativeTime(task.updated_at),
      }))

    const reportCards = (message.taskRefs || [])
      .flatMap((taskId: string) => telegramReportsByTask[String(taskId)] || [])
      .slice(0, 4)
      .map((report: any) => ({
        id: report.id,
        title: report.title,
        author: report.author,
        type: report.type,
        taskId: report.task_id,
        relative: relativeTime(report.created_at),
      }))

    return {
      ...message,
      taskCards,
      reportCards,
    }
  })

  const eventFeed: EventItem[] = recentEvents.slice(0, 18).map((event: any) => ({
    id: event.id,
    taskId: event.task_id,
    title: taskMap.get(event.task_id)?.title || `Task #${event.task_id}`,
    eventType: event.event_type,
    createdAt: event.created_at,
    tone: eventTone(event.event_type),
    relative: relativeTime(event.created_at),
    summary: summarizeEventContent(event.content),
    content: event.content || null,
  }))

  const data: WebOsData = {
    summary: {
      activeNow,
      pendingNow,
      completedToday,
      totalTasks: statusRows.length,
      anomalousEvents24h: anomalies24h.length,
      reportsReady: reports.length,
    },
    lanes: {
      running: runningTasks,
      pending: pendingTasks,
      finished: finishedTasks,
    },
    agents,
    sessions: sessionTasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      assignee: task.assignee,
      sessionId: task.session_id,
      dispatchRuntime: task.dispatch_runtime,
      updatedAt: task.updated_at,
      relative: relativeTime(task.updated_at),
    })),
    telegram: {
      guardHealthy: Array.isArray(telegramState.findings) && telegramState.findings.length === 0,
      findings: telegramState.findings || [],
      blockedProviders,
      lastGuardMinutes: fileAgeMinutes(TELEGRAM_LAST),
      gatewayLastMinutes: fileAgeMinutes(GATEWAY_LAST),
      sessionKey: telegramMessages.sessionKey,
      sessionId: telegramMessages.sessionId,
      messageLastMinutes: telegramMessages.updatedAt ? Math.round((Date.now() - telegramMessages.updatedAt) / 60000) : null,
      quickCommands: ['任務', '行程', '追蹤', '參考', '想法', '搜尋'],
      messages: telegramMessages.messages,
      messageStats: telegramMessages.stats || { inbound: 0, outbound: 0, replyContext: 0, commands: {} },
      ledger: [
        {
          kind: 'guard',
          label: 'Telegram Session Guard',
          detail: Array.isArray(telegramState.findings) && telegramState.findings.length === 0 ? '沒有發現 session 衝突' : `${telegramState.findings?.length || 0} 個待處理 finding`,
          relative: fileAgeMinutes(TELEGRAM_LAST) == null ? '未知' : `${fileAgeMinutes(TELEGRAM_LAST)} 分鐘前`,
          tone: Array.isArray(telegramState.findings) && telegramState.findings.length === 0 ? 'positive' : 'warning',
        },
        {
          kind: 'gateway',
          label: 'Gateway Health Check',
          detail: gatewayLastMinutes == null ? '尚未偵測到 heartbeat' : 'Gateway heartbeat 持續更新中',
          relative: gatewayLastMinutes == null ? '未知' : `${gatewayLastMinutes} 分鐘前`,
          tone: gatewayLastMinutes != null && gatewayLastMinutes < 120 ? 'positive' : 'warning',
        },
        {
          kind: 'commands',
          label: 'Quick Command Surface',
          detail: '可直接從 Telegram 觸發 task / calendar / stock / search / reference / idea',
          relative: '規則常駐',
          tone: 'neutral',
        },
        {
          kind: 'notify',
          label: 'Notification Routing',
          detail: notificationSettings?.telegram ? 'notification_settings.json 已存在 Telegram routing 設定' : '尚未找到 notification_settings Telegram 設定',
          relative: '設定檔',
          tone: notificationSettings?.telegram ? 'neutral' : 'warning',
        },
      ],
    },
    watchtower: {
      dispatchSuppressed: recentEvents.filter((event: any) => event.event_type === 'dispatch_suppressed').length,
      startBlocked: recentEvents.filter((event: any) => event.event_type === 'start_blocked').length,
      harnessFailed: recentEvents.filter((event: any) => event.event_type === 'harness_failed').length,
      leaseHandoffs: recentEvents.filter((event: any) => event.event_type === 'lease_handoff').length,
      completedSignals: recentEvents.filter((event: any) => ['completed', 'harness_completed'].includes(event.event_type)).length,
    },
    eventFeed,
    reports: reports.map((report: any) => ({
      ...report,
      relative: relativeTime(report.created_at),
    })),
  }

  return NextResponse.json(data)
}
