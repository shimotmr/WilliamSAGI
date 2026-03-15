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

function getEventMeta(evt: StreamEvent) {
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
  return { icon, color, borderColor, label, preview }
}

function EventDetailPanel({ evt }: { evt: StreamEvent }) {
  if (!evt) return null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#8A8F98' }}>
        <span style={{ fontWeight: 600, color: '#EDEDEF' }}>
          {evt.event_type === 'thinking' && <><Brain size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> 思考</>}
          {evt.event_type === 'toolCall' && <><Zap size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Tool: {evt.tool_name}</>}
          {evt.event_type === 'toolResult' && (evt.tool_success !== false
            ? <><CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#4ade80' }} /> 執行結果</>
            : <><XCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#f87171' }} /> 錯誤</>)}
          {evt.event_type === 'text' && <><MessageSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> 回應</>}
          {evt.event_type === 'model_change' && <><RefreshCw size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> 模型切換</>}
        </span>
        {evt.created_at && <span>{formatTime(evt.created_at)}</span>}
      </div>

      {evt.event_type === 'thinking' && (
        <div style={{ background: 'rgba(148,163,184,0.06)', borderRadius: '0.5rem', padding: '1rem', fontStyle: 'italic', color: '#94a3b8', fontSize: '0.8125rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', borderLeft: '2px solid #475569' }}>
          {evt.content}
        </div>
      )}
      {evt.event_type === 'toolCall' && (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginBottom: '0.5rem', fontWeight: 600 }}>{evt.tool_name} — Input:</div>
          <pre style={{ background: 'rgba(96,165,250,0.06)', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.75rem', color: '#93c5fd', overflow: 'auto', maxHeight: '400px', borderLeft: '2px solid #3b82f6', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {typeof evt.tool_input === 'string' ? evt.tool_input : JSON.stringify(evt.tool_input, null, 2)}
          </pre>
        </div>
      )}
      {evt.event_type === 'toolResult' && (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#4ade80', marginBottom: '0.5rem', fontWeight: 600 }}>Output:</div>
          <pre style={{ background: 'rgba(74,222,128,0.06)', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.75rem', color: '#86efac', overflow: 'auto', maxHeight: '500px', borderLeft: '2px solid #22c55e', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {evt.content}
          </pre>
        </div>
      )}
      {evt.event_type === 'text' && (
        <div style={{ background: 'rgba(226,232,240,0.04)', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.8125rem', color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {evt.content}
        </div>
      )}
      {evt.event_type === 'model_change' && (
        <div style={{ background: 'rgba(167,139,250,0.06)', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.8125rem', color: '#c4b5fd' }}>
          {evt.content}
        </div>
      )}
    </div>
  )
}

export default function TaskReplayPage() {
  const params = useParams()
  const taskId = params.id as string
  const [task, setTask] = useState<TaskInfo | null>(null)
  const [events, setEvents] = useState<StreamEvent[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
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

  const toggleExpand = (idx: number) => {
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

  const header = (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem', marginBottom: '1rem' }}>
      <Link href="/hub/v4" style={{ color: '#8A8F98', textDecoration: 'none', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
        <ArrowLeft size={14} /> 返回
      </Link>
      <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0.25rem 0', lineHeight: 1.3 }}>
        Task #{task.id}: {task.title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#8A8F98', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AgentIcon size={13} />{agent.charAt(0).toUpperCase() + agent.slice(1)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Cpu size={12} /> {agentModel[agent] || 'unknown'}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>{statusIcon} {task.status}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {duration}</span>
      </div>
    </div>
  )

  const statsBar = (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.75rem', paddingTop: '0.625rem', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.6875rem', color: '#6b7280', flexWrap: 'wrap' }}>
      <span><Brain size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {thinkingCount} thinking</span>
      <span><Zap size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {toolCallCount} tool calls</span>
      <span><MessageSquare size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {textCount} responses</span>
      <span><BarChart3 size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {events.length} total</span>
      <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', minWidth: 40 }}>
        <div style={{ height: '100%', borderRadius: '2px', background: task.status === '已完成' ? '#4ade80' : task.status === '失敗' ? '#f87171' : '#5E6AD2', width: task.status === '已完成' || task.status === '失敗' ? '100%' : '60%' }} />
      </div>
    </div>
  )

  // Shared timeline row component
  const timelineRows = events.map((evt, idx) => {
    const { icon, color, borderColor, label, preview } = getEventMeta(evt)
    return { evt, idx, icon, color, borderColor, label, preview }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {header}

      {/* Desktop: side-by-side */}
      <div className="desktop-layout" style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', gap: '1rem' }}>
        {/* Left timeline */}
        <div style={{ width: '320px', flexShrink: 0, overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '0.75rem' }}>
          {events.length === 0 ? (
            <div style={{ color: '#8A8F98', fontSize: '0.8125rem', padding: '2rem 0', textAlign: 'center' }}>尚無執行流事件</div>
          ) : timelineRows.map(({ evt, idx, icon, color, borderColor, label, preview }) => (
            <div
              key={evt.id || idx}
              onClick={() => setSelectedIdx(idx)}
              style={{
                padding: '0.5rem 0.625rem', marginBottom: '0.25rem', borderRadius: '0.5rem',
                borderLeft: `2px solid ${borderColor}`,
                background: selectedIdx === idx ? 'rgba(94,106,210,0.12)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color }}>
                {icon}
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '0.6875rem' }}>
                  {evt.created_at ? formatTime(evt.created_at) : ''}
                </span>
              </div>
              {preview && (
                <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: evt.event_type === 'thinking' ? 'italic' : 'normal', fontFamily: evt.event_type === 'toolCall' ? 'monospace' : 'inherit' }}>
                  {preview}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
          {selectedIdx === null ? (
            <div style={{ color: '#6b7280', fontSize: '0.875rem', padding: '3rem', textAlign: 'center' }}>← 點擊左側事件查看詳細內容</div>
          ) : (
            <EventDetailPanel evt={events[selectedIdx]} />
          )}
        </div>
      </div>

      {/* Mobile: accordion */}
      <div className="mobile-layout" style={{ flex: 1, overflowY: 'auto', display: 'none' }}>
        {events.length === 0 ? (
          <div style={{ color: '#8A8F98', fontSize: '0.875rem', padding: '3rem', textAlign: 'center' }}>尚無執行流事件</div>
        ) : timelineRows.map(({ evt, idx, icon, color, borderColor, label, preview }) => {
          const isOpen = expanded.has(idx)
          return (
            <div key={evt.id || idx} style={{ marginBottom: '0.375rem', borderRadius: '0.5rem', borderLeft: `2px solid ${borderColor}`, background: isOpen ? 'rgba(94,106,210,0.08)' : 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
              {/* Header row */}
              <div onClick={() => toggleExpand(idx)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.625rem', cursor: 'pointer' }}>
                <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{label}</span>
                {preview && !isOpen && (
                  <span style={{ flex: 1, fontSize: '0.6875rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: evt.event_type === 'thinking' ? 'italic' : 'normal', fontFamily: evt.event_type === 'toolCall' ? 'monospace' : 'inherit' }}>
                    {preview}
                  </span>
                )}
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                  {evt.created_at && <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>{formatTime(evt.created_at)}</span>}
                  <span style={{ color: '#6b7280' }}>{isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
                </span>
              </div>
              {/* Expanded content */}
              {isOpen && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '0.75rem' }}>
                  <EventDetailPanel evt={evt} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {statsBar}

      <style>{`
        @media (max-width: 640px) {
          .desktop-layout { display: none !important; }
          .mobile-layout { display: block !important; }
        }
      `}</style>
    </div>
  )
}
