'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  FolderOpen,
  Home,
  Laptop2,
  Loader2,
  Menu,
  MessageSquareText,
  PlugZap,
  RefreshCw,
  Send,
  Server,
  TerminalSquare,
  Unplug,
  X,
  ChevronRight,
  Bot,
} from 'lucide-react'

type CodexSessionSummary = {
  id: string
  title: string
  cwd: string | null
  model: string | null
  provider: string | null
  source: string | null
  originator: string | null
  updatedAt: string
  relativePath: string
  messageCount: number
  preview: string | null
}

type CodexSessionMessage = {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool' | 'event'
  kind: string
  text: string
  timestamp: string
  streaming?: boolean
}

type CodexSessionDetail = CodexSessionSummary & {
  messages: CodexSessionMessage[]
}

type RpcResponse = {
  id?: number
  result?: Record<string, unknown>
  error?: { code?: number; message?: string }
  method?: string
  params?: Record<string, unknown>
}

type RemoteThread = {
  id: string
  statusType: string
  updatedAt?: number | string | null
}

type PendingRequest = {
  resolve: (value: Record<string, unknown>) => void
  reject: (error: Error) => void
}

type CodexRuntimeInfo = {
  mode: 'app-server' | 'sse'
  appServerAvailable: boolean
  appServerListenUrl: string
  diagnostics: string[]
}

const APP_SERVER_URL =
  process.env.NEXT_PUBLIC_CODEX_APP_SERVER_URL?.trim() || 'ws://127.0.0.1:8765'

/* ─── helpers ─── */

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function formatRuntimeTime(value?: number | string | null) {
  if (value == null) return 'unknown'
  const normalized =
    typeof value === 'number'
      ? new Date(value > 10_000_000_000 ? value : value * 1000)
      : new Date(value)
  if (Number.isNaN(normalized.getTime())) return 'unknown'
  return formatTime(normalized.toISOString())
}

function extractTextFragments(value: unknown, depth = 0): string[] {
  if (depth > 6 || value == null) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTextFragments(item, depth + 1)).filter(Boolean)
  }
  if (typeof value !== 'object') return []
  const record = value as Record<string, unknown>
  const preferredKeys = [
    'delta', 'text', 'chunk', 'message', 'summary_text', 'reasoning_text', 'last_agent_message',
  ]
  const preferred = preferredKeys.flatMap((key) => extractTextFragments(record[key], depth + 1))
  if (preferred.length > 0) return preferred
  const fallbackKeys = ['item', 'items', 'content', 'content_items', 'parts', 'fragments', 'turn']
  return fallbackKeys.flatMap((key) => extractTextFragments(record[key], depth + 1)).filter(Boolean)
}

function extractAgentMessageText(item: unknown): string {
  if (!item || typeof item !== 'object') return ''
  const record = item as Record<string, unknown>
  if (record.type === 'agentMessage' && typeof record.text === 'string') return record.text
  return extractTextFragments(item).join('')
}

function extractAssistantTextFromTurn(params?: Record<string, unknown>): string {
  const turn = params?.turn
  if (!turn || typeof turn !== 'object') return ''
  const items = (turn as { items?: unknown[] }).items
  if (!Array.isArray(items)) return ''
  return items.map((item) => extractAgentMessageText(item).trim()).filter(Boolean).join('\n')
}

/** Classify a message for rendering purposes */
type MessageCategory =
  | 'user'
  | 'assistant'
  | 'agent_message'
  | 'function_call'
  | 'custom_tool_call'
  | 'function_call_output'
  | 'custom_tool_call_output'
  | 'reasoning'
  | 'event_task'
  | 'event_token'
  | 'event_generic'
  | 'system'

function classifyMessage(msg: CodexSessionMessage): MessageCategory {
  const { role, kind } = msg

  // Event messages
  if (kind === 'event_msg/token_count' || kind === 'token_count') return 'event_token'
  if (kind === 'event_msg/task_started' || kind === 'task_started') return 'event_task'
  if (kind === 'event_msg/task_complete' || kind === 'task_complete') return 'event_task'
  if (kind === 'event_msg/agent_message' || kind === 'agent_message') return 'agent_message'

  // Reasoning — encrypted, hide
  if (kind === 'response_item/reasoning' || kind === 'reasoning') return 'reasoning'

  // Tool calls
  if (kind === 'response_item/function_call' || kind === 'function_call') return 'function_call'
  if (kind === 'response_item/custom_tool_call' || kind === 'custom_tool_call') return 'custom_tool_call'

  // Tool outputs
  if (kind === 'response_item/function_call_output' || kind === 'function_call_output') return 'function_call_output'
  if (kind === 'response_item/custom_tool_call_output' || kind === 'custom_tool_call_output') return 'custom_tool_call_output'

  // Generic event role
  if (role === 'event') return 'event_generic'
  if (role === 'system') return 'system'

  // Standard messages
  if (role === 'user') return 'user'
  if (role === 'assistant') return 'assistant'

  return 'event_generic'
}

/** Render inline markdown: **bold**, `code`, \n → <br/> */
function renderInlineMarkdown(text: string) {
  const parts: React.ReactNode[] = []
  // Split by code first, then bold
  const codeRegex = /`([^`]+)`/g
  const boldRegex = /\*\*([^*]+)\*\*/g
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

  // Simple approach: use dangerouslySetInnerHTML with sanitised content
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(linkRegex, '<a href="$2" target="_blank" rel="noopener" class="text-cyan-300 underline hover:text-cyan-200">$1</a>')
    .replace(boldRegex, '<strong>$1</strong>')
    .replace(codeRegex, '<code class="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] text-cyan-200 font-mono break-all">$1</code>')
    .replace(/\n/g, '<br/>')

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

/** Get command name & truncated args from tool call text */
function parseToolCall(text: string): { name: string; args: string } {
  const lines = text.split('\n')
  const firstLine = lines[0] || ''
  // Try to extract name from first line (often "name: xxx" or just the function name)
  const nameMatch = firstLine.match(/name:\s*(\S+)/i) || firstLine.match(/^(\S+)/)
  const name = nameMatch ? nameMatch[1] : 'tool'
  const args = text.length > 120 ? text.slice(0, 120) + '…' : text
  return { name, args }
}

/* ─── Collapsible panel ─── */

function CollapsiblePanel({
  defaultOpen = false,
  summary,
  children,
  accent = 'amber',
}: {
  defaultOpen?: boolean
  summary: React.ReactNode
  children: React.ReactNode
  accent?: 'amber' | 'emerald'
}) {
  const [open, setOpen] = useState(defaultOpen)
  const accentBorder = accent === 'amber' ? 'border-amber-400/20' : 'border-emerald-400/20'
  const accentBg = accent === 'amber' ? 'bg-amber-400/5' : 'bg-emerald-400/5'
  const accentText = accent === 'amber' ? 'text-amber-200' : 'text-emerald-200'
  const chevronCls = open ? 'rotate-90' : ''

  return (
    <div className={`rounded-2xl border ${accentBorder} ${accentBg} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-mono ${accentText} hover:bg-white/[0.03] transition`}
      >
        <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${chevronCls}`} />
        <span className="truncate">{summary}</span>
      </button>
      {open && (
        <div className="border-t border-white/5 px-4 py-3 text-sm font-mono leading-5">
          {children}
        </div>
      )}
    </div>
  )
}

/* ─── Individual message renderer ─── */

function MessageBubble({ message }: { message: CodexSessionMessage }) {
  const category = classifyMessage(message)

  // --- Hidden ---
  if (category === 'reasoning') return null
  if (category === 'event_token') return null

  // --- User: right-aligned iMessage bubble ---
  if (category === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-cyan-500/15 px-4 py-3 text-sm leading-6 text-cyan-50 break-words [font-family:var(--font-sans)]">
          {renderInlineMarkdown(message.text)}
        </div>
      </div>
    )
  }

  // --- Assistant / Agent: left-aligned, full-width, markdown ---
  if (category === 'assistant' || category === 'agent_message') {
    const isAgent = category === 'agent_message'
    return (
      <div className="w-full">
        {isAgent && (
          <span className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-violet-300">
            <Bot className="h-3 w-3" /> agent
          </span>
        )}
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 px-4 py-3 text-sm leading-6 text-emerald-50 break-words [font-family:var(--font-sans)]">
          {renderInlineMarkdown(message.text || (message.streaming ? '...' : ''))}
          {message.streaming && (
            <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-emerald-300/60" />
          )}
        </div>
      </div>
    )
  }

  // --- System ---
  if (category === 'system') {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-2.5 text-xs text-zinc-400 [font-family:var(--font-sans)]">
        {message.text}
      </div>
    )
  }

  // --- Tool Call (function_call / custom_tool_call) ---
  if (category === 'function_call' || category === 'custom_tool_call') {
    const { name, args } = parseToolCall(message.text)
    return (
      <CollapsiblePanel
        summary={
          <span className="text-amber-200">
            <span className="text-amber-400">$</span> {name} <span className="text-amber-200/50">{args.slice(name.length).trim().slice(0, 80)}</span>
          </span>
        }
      >
        <pre className="whitespace-pre-wrap break-words text-amber-100/80 text-xs">
          {message.text}
        </pre>
      </CollapsiblePanel>
    )
  }

  // --- Tool Output (function_call_output / custom_tool_call_output) ---
  if (category === 'function_call_output' || category === 'custom_tool_call_output') {
    const lines = message.text.split('\n')
    const preview = lines.slice(0, 2).join('\n')
    const hasMore = lines.length > 2
    return (
      <CollapsiblePanel
        accent="emerald"
        defaultOpen={!hasMore}
        summary={
          <span className="text-emerald-200">
            <span className="text-emerald-400">▶</span> output
            {hasMore && <span className="ml-2 text-emerald-300/50">({lines.length} 行)</span>}
          </span>
        }
      >
        <div className="max-h-[300px] overflow-y-auto rounded-xl bg-black/60 p-3">
          <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-green-300/90 font-mono">
            {message.text}
          </pre>
        </div>
      </CollapsiblePanel>
    )
  }

  // --- Event: task started/complete ---
  if (category === 'event_task') {
    const isComplete = message.kind.includes('complete')
    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${
            isComplete
              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
              : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'
          }`}
        >
          {isComplete ? '✓ task complete' : '● task started'}
        </span>
        {message.text && (
          <span className="text-[10px] text-zinc-500 truncate max-w-[60%]">{message.text}</span>
        )}
      </div>
    )
  }

  // --- Generic event: minimal ---
  if (category === 'event_generic') {
    return (
      <div className="text-[10px] text-zinc-600 leading-4">
        {message.text}
      </div>
    )
  }

  // Fallback
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
      <pre className="whitespace-pre-wrap break-words text-xs">{message.text}</pre>
    </div>
  )
}

/* ─── Main page ─── */

export default function CodexPage() {
  const [sessions, setSessions] = useState<CodexSessionSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CodexSessionDetail | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [connectionState, setConnectionState] = useState<
    'disconnected' | 'connecting' | 'connected' | 'ready' | 'error'
  >('disconnected')
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [remoteThreads, setRemoteThreads] = useState<Record<string, RemoteThread>>({})
  const [attachedThreadId, setAttachedThreadId] = useState<string | null>(null)
  const [resuming, setResuming] = useState(false)
  const [sending, setSending] = useState(false)
  const [composer, setComposer] = useState('')
  const [liveMessages, setLiveMessages] = useState<CodexSessionMessage[]>([])
  const [runtimeInfo, setRuntimeInfo] = useState<CodexRuntimeInfo | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [homeBtnPos, setHomeBtnPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 16, y: 16 }
    try {
      const saved = localStorage.getItem('codex-home-btn-pos')
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return { x: 16, y: 16 }
  })
  const homeBtnDragging = useRef(false)
  const homeBtnStart = useRef({ x: 0, y: 0 })
  const homeBtnOffset = useRef({ x: 0, y: 0 })

  const socketRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<EventSource | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const attachedThreadIdRef = useRef<string | null>(null)
  const activeTurnIdRef = useRef<string | null>(null)
  const pendingRequestsRef = useRef<Map<number, PendingRequest>>(new Map())
  const requestIdRef = useRef(0)
  const connectPromiseRef = useRef<Promise<void> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  async function loadSessions() {
    setLoadingList(true)
    setError(null)
    try {
      const response = await fetch('/api/codex/sessions', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || '無法載入 sessions')
      setSessions(payload.sessions || [])
      setSelectedId((current) => current || payload.sessions?.[0]?.id || null)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : '無法載入 sessions')
    } finally {
      setLoadingList(false)
    }
  }

  async function loadDetail(id: string, options?: { clearLive?: boolean }) {
    setLoadingDetail(true)
    setError(null)
    try {
      const response = await fetch(`/api/codex/sessions/${encodeURIComponent(id)}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || '無法載入 session')
      setDetail(payload)
      if (options?.clearLive) setLiveMessages([])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : '無法載入 session')
    } finally {
      setLoadingDetail(false)
    }
  }

  function replaceRemoteThreads(threads: unknown) {
    if (!Array.isArray(threads)) return
    const nextThreads = threads.reduce<Record<string, RemoteThread>>((accumulator, item) => {
      if (!item || typeof item !== 'object') return accumulator
      const record = item as Record<string, unknown>
      const id = typeof record.id === 'string' ? record.id : null
      if (!id) return accumulator
      const status = record.status as { type?: string } | undefined
      accumulator[id] = {
        id,
        statusType: status?.type || 'unknown',
        updatedAt: typeof record.updatedAt === 'number' || typeof record.updatedAt === 'string' ? record.updatedAt : null,
      }
      return accumulator
    }, {})
    setRemoteThreads(nextThreads)
  }

  function mergeRemoteThread(thread: unknown) {
    if (!thread || typeof thread !== 'object') return
    const record = thread as Record<string, unknown>
    const id = typeof record.id === 'string' ? record.id : null
    if (!id) return
    const status = record.status as { type?: string } | undefined
    setRemoteThreads((current) => ({
      ...current,
      [id]: {
        ...(current[id] || { id }),
        id,
        statusType: status?.type || current[id]?.statusType || 'unknown',
        updatedAt: typeof record.updatedAt === 'number' || typeof record.updatedAt === 'string' ? record.updatedAt : current[id]?.updatedAt ?? null,
      },
    }))
  }

  function upsertLiveAssistant(chunk: string, turnId?: string | null) {
    if (!chunk) return
    const assistantId = `assistant:${turnId || activeTurnIdRef.current || 'pending'}`
    setLiveMessages((current) => {
      const nextMessages = [...current]
      const index = nextMessages.findIndex((message) => message.id.startsWith('assistant:'))
      if (index >= 0) {
        nextMessages[index] = { ...nextMessages[index], id: assistantId, text: `${nextMessages[index].text}${chunk}`, streaming: true }
        return nextMessages
      }
      return [...nextMessages, { id: assistantId, role: 'assistant', kind: 'stream', text: chunk, timestamp: new Date().toISOString(), streaming: true }]
    })
  }

  function finalizeLiveAssistant(text: string, turnId?: string | null) {
    const normalized = text.trim()
    if (!normalized) return
    const assistantId = `assistant:${turnId || activeTurnIdRef.current || 'pending'}`
    setLiveMessages((current) => {
      const nextMessages = [...current]
      const index = nextMessages.findIndex((message) => message.id.startsWith('assistant:'))
      if (index >= 0) {
        nextMessages[index] = { ...nextMessages[index], id: assistantId, text: normalized, streaming: false }
        return nextMessages
      }
      return [...nextMessages, { id: assistantId, role: 'assistant', kind: 'final', text: normalized, timestamp: new Date().toISOString() }]
    })
  }

  function handleSocketMessage(event: MessageEvent<string>) {
    let payload: RpcResponse
    try { payload = JSON.parse(event.data) as RpcResponse } catch { return }

    if (typeof payload.id === 'number') {
      const pending = pendingRequestsRef.current.get(payload.id)
      if (pending) {
        pendingRequestsRef.current.delete(payload.id)
        if (payload.error?.message) pending.reject(new Error(payload.error.message))
        else pending.resolve(payload.result || {})
      }
      return
    }

    if (!payload.method) return

    if (payload.method === 'thread/started') { mergeRemoteThread(payload.params?.thread); return }
    if (payload.method === 'thread/status/changed') {
      const threadId = typeof payload.params?.threadId === 'string' ? payload.params.threadId : null
      const statusType = payload.params?.status && typeof payload.params.status === 'object' ? ((payload.params.status as { type?: string }).type ?? 'unknown') : 'unknown'
      if (!threadId) return
      setRemoteThreads((current) => ({ ...current, [threadId]: { ...(current[threadId] || { id: threadId }), id: threadId, statusType } }))
      return
    }

    if (payload.method === 'turn/started') {
      const threadId = typeof payload.params?.threadId === 'string' ? payload.params.threadId : null
      const turnId = payload.params?.turn && typeof payload.params.turn === 'object' ? ((payload.params.turn as { id?: string }).id ?? null) : null
      if (!threadId || threadId !== attachedThreadIdRef.current) return
      activeTurnIdRef.current = turnId
      setSending(true)
      return
    }

    if (payload.method.includes('agentMessage') && payload.method.includes('delta') && typeof payload.params?.threadId === 'string' && payload.params.threadId === attachedThreadIdRef.current) {
      const turnId = typeof payload.params.turnId === 'string' ? payload.params.turnId : activeTurnIdRef.current
      upsertLiveAssistant(extractTextFragments(payload.params).join(''), turnId)
      return
    }

    if (payload.method === 'item/completed') {
      const threadId = typeof payload.params?.threadId === 'string' ? payload.params.threadId : null
      if (!threadId || threadId !== attachedThreadIdRef.current) return
      const completedText = extractAgentMessageText(payload.params?.item).trim()
      if (completedText) finalizeLiveAssistant(completedText)
      return
    }

    if (payload.method === 'turn/completed') {
      const threadId = typeof payload.params?.threadId === 'string' ? payload.params.threadId : null
      if (!threadId || threadId !== attachedThreadIdRef.current) return
      const finalText = extractAssistantTextFromTurn(payload.params)
      if (finalText) finalizeLiveAssistant(finalText, activeTurnIdRef.current)
      activeTurnIdRef.current = null
      setSending(false)
      const currentSelectedId = selectedIdRef.current
      if (currentSelectedId) void loadDetail(currentSelectedId, { clearLive: true })
    }
  }

  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId, attachedThreadId])
  useEffect(() => { attachedThreadIdRef.current = attachedThreadId }, [attachedThreadId])

  async function loadRuntimeInfo() {
    try {
      const response = await fetch('/api/codex/runtime', { cache: 'no-store' })
      const payload = (await response.json()) as CodexRuntimeInfo
      setRuntimeInfo(payload)
    } catch {
      setRuntimeInfo({ mode: 'sse', appServerAvailable: false, appServerListenUrl: APP_SERVER_URL, diagnostics: ['runtime probe 失敗，預設走 SSE fallback。'] })
    }
  }

  useEffect(() => { loadSessions(); void loadRuntimeInfo() }, [])

  useEffect(() => {
    if (!selectedId) return
    setLiveMessages([]); setSending(false); activeTurnIdRef.current = null
    if (attachedThreadIdRef.current !== selectedId) { setAttachedThreadId(null); streamRef.current?.close(); streamRef.current = null }
    void loadDetail(selectedId)
  }, [selectedId])

  useEffect(() => { return () => { socketRef.current?.close(); streamRef.current?.close() } }, [])

  function sendRpc(method: string, params: Record<string, unknown>, socketOverride?: WebSocket) {
    const socket = socketOverride || socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return Promise.reject(new Error('WebSocket 尚未連線'))
    const id = ++requestIdRef.current
    const message = { jsonrpc: '2.0', id, method, params }
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      pendingRequestsRef.current.set(id, { resolve, reject })
      socket.send(JSON.stringify(message))
    })
  }

  async function refreshRemoteThreads() {
    const result = await sendRpc('thread/list', {})
    replaceRemoteThreads(result.data)
  }

  function subscribeToSessionStream(sessionId: string) {
    streamRef.current?.close()
    const source = new EventSource(`/api/codex/sessions/${encodeURIComponent(sessionId)}/stream`)
    streamRef.current = source
    source.addEventListener('snapshot', (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as { messages?: CodexSessionMessage[] }
      setLiveMessages(payload.messages || [])
    })
    source.addEventListener('delta', (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as { messages?: CodexSessionMessage[] }
      if (!payload.messages?.length) return
      setLiveMessages(payload.messages); setSending(false)
      const currentSelectedId = selectedIdRef.current
      if (currentSelectedId) void loadDetail(currentSelectedId)
    })
    source.addEventListener('error', () => { setConnectionError('SSE 連線中斷，請重新 Resume。'); setConnectionState('error') })
  }

  async function connectToAppServer() {
    if (runtimeInfo?.mode === 'sse') { setConnectionState('ready'); setConnectionError(null); return }
    if (socketRef.current?.readyState === WebSocket.OPEN) { await refreshRemoteThreads(); setConnectionState('ready'); return }
    if (connectPromiseRef.current) { await connectPromiseRef.current; return }

    setConnectionState('connecting'); setConnectionError(null)
    const socket = new WebSocket(APP_SERVER_URL)
    socketRef.current = socket
    connectPromiseRef.current = new Promise<void>((resolve, reject) => {
      socket.onmessage = handleSocketMessage
      socket.onerror = () => { setConnectionState('error'); setConnectionError(`無法連到 ${APP_SERVER_URL}`); connectPromiseRef.current = null; reject(new Error(`無法連到 ${APP_SERVER_URL}`)) }
      socket.onclose = () => { socketRef.current = null; setConnectionState('disconnected'); pendingRequestsRef.current.forEach((p) => p.reject(new Error('WebSocket 已關閉'))); pendingRequestsRef.current.clear(); if (connectPromiseRef.current) connectPromiseRef.current = null }
      socket.onopen = async () => {
        setConnectionState('connected')
        try {
          await sendRpc('initialize', { protocolVersion: 2, clientInfo: { name: 'codex-web', version: 'phase-2' }, capabilities: { experimentalApi: true } }, socket)
          await refreshRemoteThreads()
          setConnectionState('ready'); connectPromiseRef.current = null; resolve()
        } catch (socketError) {
          setConnectionState('error'); setConnectionError(socketError instanceof Error ? socketError.message : '初始化 Codex app-server 失敗'); connectPromiseRef.current = null
          reject(socketError instanceof Error ? socketError : new Error('初始化 Codex app-server 失敗'))
        }
      }
    })
    await connectPromiseRef.current
  }

  function disconnectFromAppServer() {
    socketRef.current?.close(); socketRef.current = null; streamRef.current?.close(); streamRef.current = null
    connectPromiseRef.current = null; setConnectionState('disconnected'); setAttachedThreadId(null); setSending(false); activeTurnIdRef.current = null
  }

  async function resumeSelectedSession() {
    if (!selectedId) return
    if (connectionState === 'disconnected' || connectionState === 'error') await connectToAppServer()
    setResuming(true); setConnectionError(null)
    try {
      if (runtimeInfo?.mode === 'sse') {
        subscribeToSessionStream(selectedId); setAttachedThreadId(selectedId)
        setRemoteThreads((current) => ({ ...current, [selectedId]: { id: selectedId, statusType: 'tailing', updatedAt: new Date().toISOString() } }))
        return
      }
      await sendRpc('thread/resume', { threadId: selectedId }); setAttachedThreadId(selectedId); await refreshRemoteThreads()
    } catch (resumeError) {
      setConnectionError(resumeError instanceof Error ? resumeError.message : '接手 session 失敗')
    } finally { setResuming(false) }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prompt = composer.trim()
    if (!prompt) return
    if (!selectedId) { setConnectionError('目前沒有可接手的 session'); return }
    if (attachedThreadId !== selectedId) await resumeSelectedSession()
    if (attachedThreadIdRef.current !== selectedId) { setConnectionError('尚未附著到選定的 session'); return }

    setComposer(''); setSending(true); setConnectionError(null)
    setLiveMessages([
      { id: `user:${Date.now()}`, role: 'user', kind: 'live-user', text: prompt, timestamp: new Date().toISOString() },
      { id: 'assistant:pending', role: 'assistant', kind: 'stream', text: '', timestamp: new Date().toISOString(), streaming: true },
    ])

    try {
      if (runtimeInfo?.mode === 'sse') {
        const response = await fetch(`/api/codex/sessions/${encodeURIComponent(selectedId)}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || '送出失敗')
        return
      }
      const result = await sendRpc('turn/start', { threadId: selectedId, input: [{ type: 'text', text: prompt }] })
      const turn = result.turn as { id?: string } | undefined
      if (turn?.id) activeTurnIdRef.current = turn.id
    } catch (turnError) {
      setSending(false); setConnectionError(turnError instanceof Error ? turnError.message : '送出訊息失敗')
      setLiveMessages((current) =>
        current.map((message) =>
          message.id.startsWith('assistant:') ? { ...message, text: turnError instanceof Error ? turnError.message : '送出失敗', streaming: false } : message
        )
      )
    }
  }

  const filteredSessions = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return sessions
    return sessions.filter((session) =>
      [session.title, session.cwd, session.preview, session.model, session.provider].filter(Boolean).some((value) => value!.toLowerCase().includes(keyword))
    )
  }, [query, sessions])

  const selectedRemoteThread = selectedId ? remoteThreads[selectedId] : null

  const displayedMessages = useMemo(() => {
    const persisted = detail?.messages ?? []
    if (liveMessages.length === 0) return persisted
    return [...persisted, ...liveMessages]
  }, [detail?.messages, liveMessages])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTo({ top: el.scrollHeight })
  }, [displayedMessages])

  const attachedToSelected = Boolean(selectedId && attachedThreadId === selectedId)
  const connectLabel =
    connectionState === 'ready' ? 'Connected'
      : connectionState === 'connecting' ? 'Connecting'
        : connectionState === 'error' ? 'Reconnect'
          : 'Connect'

  return (
    <div className="min-h-screen bg-[#05070b] text-zinc-100 [font-family:var(--font-mono)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        {/* Mobile header with hamburger */}
        <div className="flex h-12 items-center border-b border-white/10 bg-[#080b10] px-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:border-cyan-300/30 hover:text-cyan-200"
            aria-label={sidebarOpen ? '收起側邊欄' : '展開側邊欄'}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <span className="ml-3 text-sm font-semibold text-white">Codex Sessions</span>
        </div>

        <aside
          className={`${sidebarOpen ? 'block' : 'hidden'} w-full border-b border-white/10 bg-[#080b10] lg:block lg:h-screen lg:w-[360px] lg:border-b-0 lg:border-r`}
        >
          <div className="sticky top-0 border-b border-white/10 bg-[#080b10]/95 px-4 py-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">codex remote</div>
                <h1 className="mt-1 text-lg font-semibold text-white">Sessions</h1>
              </div>
              <button
                onClick={loadSessions}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-cyan-300/30 hover:text-cyan-200"
                aria-label="重新整理"
              >
                <RefreshCw className={`h-4 w-4 ${loadingList ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-400 focus-within:border-cyan-300/40">
              <TerminalSquare className="h-4 w-4" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋 session / cwd / model" className="w-full bg-transparent outline-none placeholder:text-zinc-600" />
            </label>
          </div>

          <div className="max-h-[calc(100vh-105px)] overflow-y-auto p-3 lg:max-h-[calc(100vh-105px)] max-h-[60vh]">
            {loadingList ? (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" /> 載入 session 清單
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-zinc-500">找不到符合條件的 session。</div>
            ) : (
              <div className="space-y-2">
                {filteredSessions.map((session) => {
                  const active = session.id === selectedId
                  const remote = remoteThreads[session.id]
                  return (
                    <button
                      key={session.id}
                      onClick={() => {
                        setSelectedId(session.id)
                        if (window.innerWidth < 1024) setSidebarOpen(false)
                      }}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        active ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]' : 'border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-white">{session.title}</div>
                          <div className="mt-1 truncate text-[11px] text-zinc-500">{session.cwd || session.relativePath}</div>
                        </div>
                        <div className="shrink-0 text-[11px] text-zinc-500">{formatTime(session.updatedAt)}</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                        <span className="rounded-full border border-white/10 px-2 py-1">{session.provider || 'unknown'}</span>
                        <span className="rounded-full border border-white/10 px-2 py-1">{session.model || 'auto'}</span>
                        <span className="rounded-full border border-white/10 px-2 py-1">{session.messageCount} msgs</span>
                        {remote ? <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-200">{remote.statusType}</span> : null}
                      </div>
                      {session.preview ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-400">{session.preview}</p> : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-h-[60vh] flex-1 flex-col relative pb-14 lg:pb-0">
          <div className="border-b border-white/10 bg-[#0a0e14] px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">conversation viewer</div>
                <h2 className="mt-1 text-xl font-semibold text-white">{detail?.title || '選一個 session'}</h2>
              </div>
              <div className="flex flex-col gap-3 xl:items-end">
                <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
                  {detail?.cwd ? (<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><FolderOpen className="h-3.5 w-3.5" /> {detail.cwd}</span>) : null}
                  {detail?.source ? (<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><Laptop2 className="h-3.5 w-3.5" /> {detail.source}</span>) : null}
                  {detail?.originator ? (<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><Server className="h-3.5 w-3.5" /> {detail.originator}</span>) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-zinc-400">
                    {runtimeInfo?.mode === 'sse' ? 'SSE fallback / JSONL tail' : APP_SERVER_URL}
                  </span>
                  <button onClick={() => connectionState === 'ready' ? refreshRemoteThreads() : connectToAppServer()} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-cyan-300/30 hover:text-cyan-200">
                    <PlugZap className="h-4 w-4" /> {connectLabel}
                  </button>
                  <button onClick={resumeSelectedSession} disabled={!selectedId || connectionState === 'connecting' || resuming} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100 transition hover:border-cyan-300/40 hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-50">
                    {resuming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
                    {attachedToSelected ? 'Attached' : 'Resume'}
                  </button>
                  <button onClick={disconnectFromAppServer} disabled={connectionState === 'disconnected'} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50">
                    <Unplug className="h-4 w-4" /> Disconnect
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">連線狀態：<span className="text-white">{connectionState}</span><span className="ml-2 text-zinc-500">({runtimeInfo?.mode || 'probing'})</span></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">Session 狀態：<span className="text-white"> {selectedRemoteThread?.statusType || 'not-connected'}</span></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">Remote 更新：<span className="text-white"> {formatRuntimeTime(selectedRemoteThread?.updatedAt)}</span></div>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            onScroll={() => {
              const el = messagesContainerRef.current
              if (!el) return
              const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
              setShowScrollBtn(!atBottom)
            }}
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6"
          >
            {error ? (<div className="rounded-3xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>) : null}
            {connectionError ? (<div className="mb-4 rounded-3xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{connectionError}</div>) : null}
            {runtimeInfo?.diagnostics?.length ? (
              <div className="mb-4 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
                <div className="mb-1 text-xs uppercase tracking-[0.24em] text-cyan-200/70">runtime probe</div>
                <ul className="space-y-1 text-sm text-cyan-100/90">{runtimeInfo.diagnostics.map((item) => (<li key={item}>• {item}</li>))}</ul>
              </div>
            ) : null}

            {loadingDetail ? (
              <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" /> 載入對話中
              </div>
            ) : detail ? (
              <div className="space-y-3 pb-4">
                {displayedMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center text-sm text-zinc-500">
                <MessageSquareText className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
                左邊挑一個 session，右邊就會把 JSONL 對話攤開給你看。
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#080b10] px-3 py-2 sm:px-6 sm:py-3 lg:static lg:z-auto">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <textarea
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                rows={1}
                placeholder={attachedToSelected ? '輸入訊息...' : '先 Resume 再傳訊'}
                className="min-h-[36px] max-h-[72px] flex-1 resize-none rounded-[18px] border border-white/10 bg-black/30 px-3 py-2 text-sm leading-5 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/40"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any) } }}
              />
              <button type="button" onClick={resumeSelectedSession} disabled={!selectedId || connectionState === 'connecting' || resuming} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-50">
                {resuming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Server className="h-3.5 w-3.5" />}
                {attachedToSelected ? '已接' : 'Resume'}
              </button>
              <button type="submit" disabled={!composer.trim() || !selectedId || connectionState === 'connecting' || connectionState === 'disconnected' || sending} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 text-xs font-medium text-emerald-100 transition hover:border-emerald-300/40 hover:text-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Floating scroll-to-bottom */}
      {showScrollBtn && (
        <button
          onClick={() => { const el = messagesContainerRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) }}
          className="fixed bottom-16 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#0c1018]/90 text-zinc-300 shadow-lg backdrop-blur transition hover:border-cyan-300/40 hover:text-cyan-200 lg:bottom-6"
          aria-label="捲動到底部"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}

      {/* Draggable floating home button */}
      <div
        className="fixed z-50"
        style={{ bottom: homeBtnPos.y, right: homeBtnPos.x }}
      >
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/70 text-zinc-300 backdrop-blur transition hover:border-cyan-300/40 hover:text-cyan-200 touch-none select-none"
          onPointerDown={(e) => {
            homeBtnDragging.current = true
            homeBtnStart.current = { x: e.clientX, y: e.clientY }
            homeBtnOffset.current = { ...homeBtnPos }
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (!homeBtnDragging.current) return
            const dx = homeBtnStart.current.x - e.clientX
            const dy = homeBtnStart.current.y - e.clientY
            setHomeBtnPos({
              x: Math.max(8, Math.min(window.innerWidth - 60, homeBtnOffset.current.x + dx)),
              y: Math.max(8, Math.min(window.innerHeight - 60, homeBtnOffset.current.y + dy)),
            })
          }}
          onPointerUp={(e) => {
            const moved = Math.abs(e.clientX - homeBtnStart.current.x) + Math.abs(e.clientY - homeBtnStart.current.y)
            homeBtnDragging.current = false
            ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
            if (moved > 6) {
              e.preventDefault()
              e.stopPropagation()
              try { localStorage.setItem('codex-home-btn-pos', JSON.stringify(homeBtnPos)) } catch { /* ignore */ }
            }
          }}
          onClick={(e) => {
            if (homeBtnDragging.current) { e.preventDefault(); return }
            try { localStorage.setItem('codex-home-btn-pos', JSON.stringify(homeBtnPos)) } catch { /* ignore */ }
          }}
        >
          <Home className="h-5 w-5" />
        </Link>
      </div>
    </div>
  )
}
