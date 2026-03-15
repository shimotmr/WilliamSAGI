'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Brain, Terminal, FileText, CheckCircle2,
  XCircle, Clock, Cpu, ChevronDown, ChevronUp,
  RefreshCw, MessageSquare, Zap, BarChart3, Hammer, Shield,
} from 'lucide-react'

interface StreamEvent {
  id: number
  event_type: string
  created_at: string
  content?: string
  tool_name?: string
  tool_input?: any
  tool_success?: boolean
  token_count?: number
  elapsed_ms?: number
}

interface TaskInfo {
  id: number
  title: string
  assignee: string
  status: string
  priority: string
  created_at: string
  completed_at: string
  updated_at: string
  result: string
  description: string
}

const agentIconMap: Record<string, any> = {
  blake: Hammer, rex: Brain, oscar: FileText, warren: BarChart3, griffin: Shield
}
const agentModel: Record<string, string> = {
  blake: 'gpt-5.4', rex: 'grok420', oscar: 'qwen3', warren: 'MiniMax-M2.5', griffin: 'qwen3'
}

function formatDuration(start: string, end?: string) {
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const diff = Math.floor((e - s) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m${diff % 60}s`
  return `${Math.floor(diff / 3600)}h${Math.floor((diff % 3600) / 60)}m`
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function EventContent({ evt }: { evt: StreamEvent }) {
  if (evt.event_type === 'thinking') {
    return (
      <div style={{
        background: 'rgba(148,163,184,0.06)', borderRadius: '0 0 0.5rem 0.5rem',
        padding: '0.75rem 1rem', fontStyle: 'italic', color: '#94a3b8',
        fontSize: '0.8125rem', lineHeight: 1.7, whiteSpace: 'pre-wrap',
        borderLeft: '2px solid #475569', borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        {evt.content}
      </div>
    )
  }
  if (evt.event_type === 'toolCall') {
    return (
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: '0.6875rem', color: '#60a5fa', padding: '0.5rem 1rem 0.25rem', fontWeight: 600 }}>
          {evt.tool_name} — Input:
        </div>
        <pre style={{
          background: 'rgba(96,165,250,0.06)', borderRadius: '0 0 0.5rem 0.5rem',
          padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#93c5fd',
          overflow: 'auto', maxHeight: '300px', margin: 0,
          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>
          {typeof evt.tool_input === 'string' ? evt.tool_input : JSON.stringify(evt.tool_input, null, 2)}
        </pre>
      </div>
    )
  }
  if (evt.event_type === 'toolResult') {
    return (
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: '0.6875rem', color: '#4ade80', padding: '0.5rem 1rem 0.25rem', fontWeight: 600 }}>Output:</div>
        <pre style={{
          background: 'rgba(74,222,128,0.06)', borderRadius: '0 0 0.5rem 0.5rem',
          padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#86efac',
          overflow: 'auto', maxHeight: '300px', margin: 0,
          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>
          {evt.content}
        </pre>
      </div>
    )
  }
  if (evt.event_type === 'text') {
    return (
      <div style={{
        background: 'rgba(226,232,240,0.04)', borderRadius: '0 0 0.5rem 0.5rem',
        padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#e2e8f0',
        lineHeight: 1.7, whiteSpace: 'pre-wrap',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        {evt.content}
      </div>
    )
  }
  if (evt.event_type === 'model_change') {
    return (
      <div style={{
        background: 'rgba(167,139,250,0.06)', borderRadius: '0 0 0.5rem 0.5rem',
        padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#c4b5fd',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        {evt.content}
      </div>
    )
  }
  return (
    <div style={{
      padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#8A8F98',
      borderTop: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'pre-wrap',
    }}>
      {evt.content}
    </div>
  )
}

function EventCard({ evt, expanded, onToggle }: {
  evt: StreamEvent
  expanded: boolean
  onToggle: () => void
}) {
  const content = evt.content || ''
  let icon, color, borderColor, label, preview

  switch (evt.event_type) {
    case 'thinking':
      icon = <Brain size={13} />; color = '#94a3b8'; borderColor = '#475569'
      label = '思考'; preview = content.slice(0, 80)
      break
    case 'toolCall':
      icon = <Zap size={13} />; color = '#60a5fa'; borderColor = '#3b82f6'
      label = evt.tool_name || 'tool'
      preview = (() => {
        if (!evt.tool_input) return ''
        try {
          const inp = typeof evt.tool_input === 'string' ? JSON.parse(evt.tool_input) : evt.tool_input
          return inp.command?.slice(0, 80) || inp.file_path?.slice(0, 80) || inp.path?.slice(0, 80) || JSON.stringify(inp).slice(0, 80)
        } catch { return '' }
      })()
      break
    case 'toolResult': {
      const ok = !content.startsWith('Error')
      icon = ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />
      color = ok ? '#4ade80' : '#f87171'; borderColor = ok ? '#22c55e' : '#ef4444'
      label = ok ? '結果' : '錯誤'; preview = content.slice(0, 80)
      break
    }
    case 'text':
      icon = <MessageSquare size={13} />; color = '#e2e8f0'; borderColor = '#64748b'
      label = '回應'; preview = content.slice(0, 80)
      break
    case 'model_change':
      icon = <RefreshCw size={13} />; color = '#a78bfa'; borderColor = '#8b5cf6'
      label = '模型'; preview = content
      break
    default:
      icon = <FileText size={13} />; color = '#8A8F98'; borderColor = '#4b5563'
      label = evt.event_type; preview = content.slice(0, 80)
  }

  return (
    <div style={{
      marginBottom: '0.375rem',
      borderRadius: '0.5rem',
      borderLeft: `2px solid ${borderColor}`,
      background: expanded ? 'rgba(94,106,210,0.08)' : 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
    }}>
      {/* Card header — always visible, click to toggle */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.625rem', cursor: 'pointer',
        }}
      >
        <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{label}</span>
        {preview && !expanded && (
          <span style={{
            flex: 1, fontSize: '0.6875rem', color: '#6b7280',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontStyle: evt.event_type === 'thinking' ? 'italic' : 'normal',
            fontFamily: evt.event_type === 'toolCall' ? 'monospace' : 'inherit',
          }}>
            {preview}
          </span>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {evt.created_at && (
            <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>{formatTime(evt.created_at)}</span>
          )}
          <span style={{ color: '#6b7280' }}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>
        </span>
      </div>

      {/* Expandable content */}
      {expanded && <EventContent evt={evt} />}
    </div>
  )
}

export default function TaskReplayPage() {
  const params = useParams()
  const taskId = params.id as string
  const [task, setTask] = useState<TaskInfo | null>(null)
  const [events, setEvents] = useState<StreamEvent[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v4/task/${taskId}`)
      .then(r => r.json())
      .then(data => {
        setTask(data.task)
        setEvents(data.events || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [taskId])

  const toggle = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#8A8F98' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #5E6AD2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p>載入任務回放...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!task) {
    return <div style={{ color: '#8A8F98', padding: '2rem', textAlign: 'center' }}>找不到任務 #{taskId}</div>
  }

  const agent = task.assignee || 'blake'
  const AgentIcon = agentIconMap[agent] || Cpu
  const duration = formatDuration(task.created_at, task.completed_at || task.updated_at)
  const statusIcon = task.status === '已完成'
    ? <CheckCircle2 size={14} style={{ color: '#4ade80' }} />
    : task.status === '失敗'
      ? <XCircle size={14} style={{ color: '#f87171' }} />
      : <Clock size={14} style={{ color: '#facc15' }} />

  const thinkingCount = events.filter(e => e.event_type === 'thinking').length
  const toolCallCount = events.filter(e => e.event_type === 'toolCall').length
  const textCount = events.filter(e => e.event_type === 'text').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <Link href="/hub/v4" style={{ color: '#8A8F98', textDecoration: 'none', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={14} /> 返回
        </Link>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0.25rem 0', lineHeight: 1.3 }}>
          Task #{task.id}: {task.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#8A8F98', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <AgentIcon size={13} />{agent.charAt(0).toUpperCase() + agent.slice(1)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Cpu size={12} /> {agentModel[agent] || 'unknown'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {statusIcon} {task.status}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> {duration}
          </span>
        </div>
      </div>

      {/* Event list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {events.length === 0 ? (
          <div style={{ color: '#8A8F98', fontSize: '0.875rem', padding: '3rem', textAlign: 'center' }}>
            尚無執行流事件
          </div>
        ) : events.map((evt, idx) => (
          <EventCard
            key={evt.id || idx}
            evt={evt}
            expanded={expanded.has(idx)}
            onToggle={() => toggle(idx)}
          />
        ))}
      </div>

      {/* Bottom stats */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.75rem', paddingTop: '0.625rem',
        display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.6875rem', color: '#6b7280', flexWrap: 'wrap',
      }}>
        <span><Brain size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {thinkingCount} thinking</span>
        <span><Zap size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {toolCallCount} tool calls</span>
        <span><MessageSquare size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {textCount} responses</span>
        <span><BarChart3 size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {events.length} total</span>
        <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', minWidth: 40 }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            background: task.status === '已完成' ? '#4ade80' : task.status === '失敗' ? '#f87171' : '#5E6AD2',
            width: task.status === '已完成' || task.status === '失敗' ? '100%' : '60%',
          }} />
        </div>
      </div>
    </div>
  )
}
