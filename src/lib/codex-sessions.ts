import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

export type CodexSessionSummary = {
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

export type CodexSessionMessage = {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool' | 'event'
  kind: string
  text: string
  timestamp: string
}

export type CodexSessionDetail = CodexSessionSummary & {
  messages: CodexSessionMessage[]
}

type SessionMetaPayload = {
  id?: string
  cwd?: string
  source?: string
  originator?: string
  model_provider?: string
  model?: string
  cli_version?: string
}

type ParsedSession = {
  meta: SessionMetaPayload
  messages: CodexSessionMessage[]
  updatedAt: string
  preview: string | null
}

const CODEX_HOME = path.join(os.homedir(), '.codex')
const SESSIONS_DIR = path.join(CODEX_HOME, 'sessions')

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        return walkFiles(fullPath)
      }
      if (entry.isFile() && fullPath.endsWith('.jsonl')) {
        return [fullPath]
      }
      return []
    }),
  )

  return nested.flat()
}

function extractText(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractText(item)).filter(Boolean)
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const record = value as Record<string, unknown>
  const directKeys = ['text', 'message', 'summary', 'content', 'reason']
  const chunks = directKeys.flatMap((key) => extractText(record[key]))

  if (Array.isArray(record.content)) {
    chunks.push(...record.content.flatMap((item) => extractText(item)))
  }

  return chunks.filter(Boolean)
}

function normalizeRole(type: string, payload: Record<string, unknown>): CodexSessionMessage['role'] {
  const payloadRole = payload.role
  if (payloadRole === 'user' || payloadRole === 'assistant' || payloadRole === 'system' || payloadRole === 'tool') {
    return payloadRole
  }

  if (type === 'response_item' && payload.type === 'message') {
    const role = payload.role
    if (role === 'user' || role === 'assistant' || role === 'system' || role === 'tool') {
      return role
    }
  }

  if (type.includes('tool')) return 'tool'
  if (type.includes('event')) return 'event'
  return 'system'
}

function parseJsonLine(line: string, index: number): { type: string; payload: Record<string, unknown>; timestamp: string; id: string } | null {
  try {
    const parsed = JSON.parse(line) as { type?: string; payload?: Record<string, unknown>; timestamp?: string }
    if (!parsed || typeof parsed !== 'object' || !parsed.type) {
      return null
    }

    return {
      type: parsed.type,
      payload: parsed.payload && typeof parsed.payload === 'object' ? parsed.payload : {},
      timestamp: parsed.timestamp || new Date(0).toISOString(),
      id: `${parsed.timestamp || 'line'}-${index}`,
    }
  } catch {
    return null
  }
}

async function parseSessionFile(filePath: string): Promise<ParsedSession | null> {
  const raw = await fs.readFile(filePath, 'utf8')
  const lines = raw.split('\n').filter(Boolean)

  let meta: SessionMetaPayload = {}
  const messages: CodexSessionMessage[] = []
  let updatedAt = new Date(0).toISOString()

  lines.forEach((line, index) => {
    const parsed = parseJsonLine(line, index)
    if (!parsed) return

    updatedAt = parsed.timestamp > updatedAt ? parsed.timestamp : updatedAt

    if (parsed.type === 'session_meta') {
      meta = parsed.payload as SessionMetaPayload
      return
    }

    const text = extractText(parsed.payload).join('\n').trim()
    if (!text) return

    messages.push({
      id: parsed.id,
      role: normalizeRole(parsed.type, parsed.payload),
      kind: parsed.type,
      text,
      timestamp: parsed.timestamp,
    })
  })

  if (!meta.id && messages.length === 0) {
    return null
  }

  return {
    meta,
    messages,
    updatedAt,
    preview: messages.find((message) => message.role === 'user' || message.role === 'assistant')?.text.slice(0, 180) || null,
  }
}

function summarizeSession(filePath: string, parsed: ParsedSession): CodexSessionSummary {
  const relativePath = path.relative(SESSIONS_DIR, filePath)
  const titleSource = parsed.meta.cwd || relativePath
  const title = path.basename(titleSource)

  return {
    id: parsed.meta.id || relativePath,
    title,
    cwd: parsed.meta.cwd || null,
    model: parsed.meta.model || null,
    provider: parsed.meta.model_provider || null,
    source: parsed.meta.source || null,
    originator: parsed.meta.originator || null,
    updatedAt: parsed.updatedAt,
    relativePath,
    messageCount: parsed.messages.length,
    preview: parsed.preview,
  }
}

export async function listCodexSessions(): Promise<CodexSessionSummary[]> {
  const files = await walkFiles(SESSIONS_DIR)
  const parsed = await Promise.all(
    files.map(async (filePath) => {
      const session = await parseSessionFile(filePath)
      return session ? summarizeSession(filePath, session) : null
    }),
  )

  return parsed
    .filter((item): item is CodexSessionSummary => Boolean(item))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getCodexSession(id: string): Promise<CodexSessionDetail | null> {
  const files = await walkFiles(SESSIONS_DIR)

  for (const filePath of files) {
    const parsed = await parseSessionFile(filePath)
    if (!parsed) continue

    const summary = summarizeSession(filePath, parsed)
    if (summary.id !== id && summary.relativePath !== id) continue

    return {
      ...summary,
      messages: parsed.messages,
    }
  }

  return null
}
