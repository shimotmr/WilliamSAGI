export type Tone = 'positive' | 'warning' | 'neutral'

export type TaskItem = {
  id: number
  title: string
  status: string
  priority: string
  assignee: string
  updated_at?: string
  created_at?: string
  completed_at?: string
  session_id?: string | null
  dispatch_runtime?: string | null
  progress?: number | null
  result?: string | null
}

export type AgentItem = {
  name: string
  total: number
  running: number
  pending: number
  completed: number
  color: string
}

export type SessionItem = {
  id: number
  title: string
  status: string
  assignee: string
  sessionId: string
  dispatchRuntime: string
  updatedAt: string
  relative: string
}

export type EventItem = {
  id?: number
  taskId: number
  title: string
  eventType: string
  createdAt: string
  tone: Tone
  relative: string
  summary?: string
  content?: unknown
}

export type ReportItem = {
  id: number
  title: string
  author: string
  type: string
  task_id?: number
  created_at: string
  relative: string
}

export type TelegramLedgerItem = {
  kind: string
  label: string
  detail: string
  relative: string
  tone: Tone
}

export type TelegramTaskCard = {
  id: number
  title: string
  status: string
  priority?: string
  assignee?: string
  relative: string
}

export type TelegramReportCard = {
  id: number
  title: string
  author: string
  type: string
  taskId?: number
  relative: string
}

export type TelegramMessageItem = {
  id: string
  kind: 'inbound' | 'outbound'
  timestamp: string
  relative: string
  senderLabel: string
  senderId?: string | null
  body: string
  summary?: string
  commandType?: string | null
  taskRefs?: string[]
  urls?: string[]
  replyToId?: string | null
  repliedBody?: string | null
  hasReplyContext?: boolean
  taskCards?: TelegramTaskCard[]
  reportCards?: TelegramReportCard[]
}

export type TelegramPanel = {
  guardHealthy: boolean
  findings: Array<{ reason?: string; key?: string }>
  blockedProviders: string[]
  lastGuardMinutes: number | null
  gatewayLastMinutes: number | null
  sessionKey?: string | null
  sessionId?: string | null
  messageLastMinutes?: number | null
  quickCommands: string[]
  messages: TelegramMessageItem[]
  messageStats: {
    inbound: number
    outbound: number
    replyContext: number
    commands: Record<string, number>
  }
  ledger: TelegramLedgerItem[]
}

export type WatchtowerPanel = {
  dispatchSuppressed: number
  startBlocked: number
  harnessFailed: number
  leaseHandoffs: number
  completedSignals: number
}

export type WebOsData = {
  summary: {
    activeNow: number
    pendingNow: number
    completedToday: number
    totalTasks: number
    anomalousEvents24h: number
    reportsReady: number
  }
  lanes: {
    running: TaskItem[]
    pending: TaskItem[]
    finished: TaskItem[]
  }
  agents: AgentItem[]
  sessions: SessionItem[]
  telegram: TelegramPanel
  watchtower: WatchtowerPanel
  eventFeed: EventItem[]
  reports: ReportItem[]
}

export type TaskEventDetail = {
  id?: number
  event_type: string
  content?: unknown
  created_at: string
}

export type TaskStepDetail = {
  id: number
  step_number: number
  description: string
  status: string
  created_at?: string
}

export type TaskReportDetail = {
  id: number
  title: string
  author: string
  type: string
  md_url?: string
  file_path?: string
  created_at: string
}

export type TaskDetail = {
  task: TaskItem & Record<string, unknown>
  events: TaskEventDetail[]
  steps: TaskStepDetail[]
  reports: TaskReportDetail[]
}

export const openClawOsTones = {
  bg: '#07131b',
  accent: '#5eead4',
  green: '#34d399',
  amber: '#f59e0b',
  red: '#fb7185',
  blue: '#38bdf8',
  text: '#ecf8ff',
  muted: '#8da6b3',
  border: 'rgba(255,255,255,0.09)',
} as const

export type OsAppId = 'tasks' | 'telegram' | 'reports' | 'events' | 'sessions' | 'agents' | 'health'

export type WindowFrame = {
  x: number
  y: number
  width: number
  height: number
}

export type WindowState = {
  id: OsAppId
  title: string
  tone: string
  iconKey: string
  frame: WindowFrame
  minWidth?: number
  minHeight?: number
  minimized?: boolean
  maximized?: boolean
  zIndex: number
}
