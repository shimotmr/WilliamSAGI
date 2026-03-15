'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Brain, Terminal, FileText, CheckCircle2,
  XCircle, Clock, Cpu, User, ChevronDown, ChevronRight,
  Play, Pause, SkipForward, FastForward, RefreshCw, MessageSquare, Zap, AlertCircle,
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

const agentEmoji: Record<string, string> = {
  blake: '🔨', rex: '🧠', oscar: '📋', warren: '📈', griffin: '🛡️'
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

export default function TaskReplayPage() {
  const params = useParams()
  const taskId = params.id as string
  const [task, setTask] = useState<TaskInfo | null>(null)
  const [events, setEvents] = useState<StreamEvent[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())

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

  const toggleResult = (id: number) => {
    setExpandedResults(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const statusIcon = task?.status === '已完成'
    ? <CheckCircle2 size={16} className="text-green-400" />
    : task?.status === '失敗'
    ? <XCircle size={16} className="text-red-400" />
    : <Clock size={16} className="text-yellow-400 animate-pulse" />

  // Helper to get display text from event
  const getContent = (evt: StreamEvent) => evt.content || ''
  
  const thinkingCount = events.filter(e => e.event_type === 'thinking').length
  const toolCallCount = events.filter(e => e.event_type === 'toolCall').length
  const textCount = events.filter(e => e.event_type === 'text').length

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
  const duration = formatDuration(task.created_at, task.completed_at || task.updated_at)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <Link href="/hub/v4" style={{ color: '#8A8F98', textDecoration: 'none', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={14} /> 返回
        </Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0' }}>
          Task #{task.id}: {task.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: '#8A8F98', flexWrap: 'wrap' }}>
          <span>{agentEmoji[agent] || '🤖'} {agent.charAt(0).toUpperCase() + agent.slice(1)}</span>
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

      {/* Main content: timeline + detail */}
      <div style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Timeline */}
        <div style={{
          width: '320px', flexShrink: 0, overflowY: 'auto',
          borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '0.75rem',
        }}>
          {events.length === 0 ? (
            <div style={{ color: '#8A8F98', fontSize: '0.8125rem', padding: '2rem 0', textAlign: 'center' }}>
              尚無執行流事件
            </div>
          ) : events.map((evt, idx) => {
            const isSelected = selectedIdx === idx
            let icon, color, bgColor, borderColor, label, preview

            const content = evt.content || ''
            switch (evt.event_type) {
              case 'thinking':
                icon = <Brain size={14} />
                color = '#94a3b8'; bgColor = 'rgba(148,163,184,0.06)'; borderColor = '#475569'
                label = '思考'; preview = content.slice(0, 60)
                break
              case 'toolCall':
                icon = <Terminal size={14} />
                color = '#60a5fa'; bgColor = 'rgba(96,165,250,0.06)'; borderColor = '#3b82f6'
                label = evt.tool_name || content || 'tool'; preview = ''
                if (evt.tool_input) {
                  try {
                    const inp = typeof evt.tool_input === 'string' ? JSON.parse(evt.tool_input) : evt.tool_input
                    preview = inp.command?.slice(0, 50) || inp.file_path?.slice(0, 50) || inp.path?.slice(0, 50) || JSON.stringify(inp).slice(0, 50)
                  } catch { preview = '' }
                }
                break
              case 'toolResult': {
                const success = !content.startsWith('Error') && !content.startsWith('Error')
                icon = success ? <CheckCircle2 size={14} /> : <XCircle size={14} />
                color = success ? '#4ade80' : '#f87171'
                bgColor = success ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)'
                borderColor = success ? '#22c55e' : '#ef4444'
                label = success ? '結果' : '錯誤'
                preview = content.slice(0, 50)
                break
              }
              case 'text':
                icon = <FileText size={14} />
                color = '#e2e8f0'; bgColor = 'rgba(226,232,240,0.06)'; borderColor = '#64748b'
                label = '回應'; preview = content.slice(0, 60)
                break
              case 'model_change':
                icon = <Cpu size={14} />
                color = '#a78bfa'; bgColor = 'rgba(167,139,250,0.06)'; borderColor = '#8b5cf6'
                label = '模型'; preview = content
                break
              default:
                icon = <Clock size={14} />
                color = '#8A8F98'; bgColor = 'rgba(138,143,152,0.06)'; borderColor = '#4b5563'
                label = evt.event_type; preview = content.slice(0, 50)
            }

            return (
              <div
                key={evt.id || idx}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  padding: '0.5rem 0.625rem',
                  marginBottom: '0.25rem',
                  borderRadius: '0.5rem',
                  borderLeft: `2px solid ${borderColor}`,
                  background: isSelected ? 'rgba(94,106,210,0.12)' : bgColor,
                  cursor: 'pointer',
                  transition: 'background 150ms',
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
                  <div style={{
                    fontSize: '0.6875rem', color: '#6b7280', marginTop: '0.25rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontStyle: evt.event_type === 'thinking' ? 'italic' : 'normal',
                    fontFamily: evt.event_type === 'toolCall' ? 'monospace' : 'inherit',
                  }}>
                    {preview}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: Detail panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
          {selectedIdx === null ? (
            <div style={{ color: '#6b7280', fontSize: '0.875rem', padding: '3rem', textAlign: 'center' }}>
              ← 點擊左側事件查看詳細內容
            </div>
          ) : (() => {
            const evt = events[selectedIdx]
            if (!evt) return null

            return (
              <div>
                {/* Detail header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#8A8F98' }}>
                  <span style={{ fontWeight: 600, color: '#EDEDEF' }}>
                    {evt.event_type === 'thinking' && <><Brain size={14} style={{display:'inline',verticalAlign:'middle'}} /> Thinking</>}
                    {evt.event_type === 'toolCall' && <><Zap size={14} style={{display:'inline',verticalAlign:'middle'}} /> Tool Call: {evt.tool_name}</>}
                    {evt.event_type === 'toolResult' && (evt.tool_success !== false ? <><CheckCircle2 size={14} style={{display:'inline',verticalAlign:'middle',color:'#4ade80'}} /> Result</> : <><XCircle size={14} style={{display:'inline',verticalAlign:'middle',color:'#f87171'}} /> Error</>)}
                    {evt.event_type === 'text' && <><MessageSquare size={14} style={{display:'inline',verticalAlign:'middle'}} /> Response</>}
                    {evt.event_type === 'model_change' && <><RefreshCw size={14} style={{display:'inline',verticalAlign:'middle'}} /> Model Change</>}
                  </span>
                  {evt.created_at && <span>{formatTime(evt.created_at)}</span>}
                </div>

                {/* Content */}
                {evt.event_type === 'thinking' && (
                  <div style={{
                    background: 'rgba(148,163,184,0.06)', borderRadius: '0.5rem',
                    padding: '1rem', fontStyle: 'italic', color: '#94a3b8',
                    fontSize: '0.8125rem', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                    borderLeft: '2px solid #475569',
                  }}>
                    {evt.content}
                  </div>
                )}

                {evt.event_type === 'toolCall' && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginBottom: '0.5rem', fontWeight: 600 }}>
                      {evt.tool_name || evt.content} — Input:
                    </div>
                    <pre style={{
                      background: 'rgba(96,165,250,0.06)', borderRadius: '0.5rem',
                      padding: '1rem', fontSize: '0.75rem', color: '#93c5fd',
                      overflow: 'auto', maxHeight: '400px', borderLeft: '2px solid #3b82f6',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    }}>
                      {typeof evt.tool_input === 'string'
                        ? evt.tool_input
                        : JSON.stringify(evt.tool_input, null, 2)}
                    </pre>
                  </div>
                )}

                {evt.event_type === 'toolResult' && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#4ade80', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Output:
                    </div>
                    <pre style={{
                      background: 'rgba(74,222,128,0.06)',
                      borderRadius: '0.5rem', padding: '1rem', fontSize: '0.75rem',
                      color: '#86efac',
                      overflow: 'auto', maxHeight: '500px',
                      borderLeft: '2px solid #22c55e',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    }}>
                      {evt.content}
                    </pre>
                  </div>
                )}

                {evt.event_type === 'text' && (
                  <div style={{
                    background: 'rgba(226,232,240,0.04)', borderRadius: '0.5rem',
                    padding: '1rem', fontSize: '0.8125rem', color: '#e2e8f0',
                    lineHeight: 1.7, whiteSpace: 'pre-wrap',
                  }}>
                    {evt.content}
                  </div>
                )}

                {evt.event_type === 'model_change' && (
                  <div style={{
                    background: 'rgba(167,139,250,0.06)', borderRadius: '0.5rem',
                    padding: '1rem', fontSize: '0.8125rem', color: '#c4b5fd',
                  }}>
                    {evt.content}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Bottom: Token bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '1rem', paddingTop: '0.75rem',
        display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.75rem', color: '#6b7280',
      }}>
        <span><Brain size={12} style={{display:'inline',verticalAlign:'middle'}} /> {thinkingCount} thinking</span>
        <span><Zap size={12} style={{display:'inline',verticalAlign:'middle'}} /> {toolCallCount} tool calls</span>
        <span><MessageSquare size={12} style={{display:'inline',verticalAlign:'middle'}} /> {textCount} responses</span>
        <span>📊 {events.length} total events</span>
        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            background: task.status === '已完成' ? '#4ade80' : task.status === '失敗' ? '#f87171' : '#5E6AD2',
            width: task.status === '已完成' || task.status === '失敗' ? '100%' : '60%',
            transition: 'width 500ms',
          }} />
        </div>
      </div>
    </div>
  )
}
