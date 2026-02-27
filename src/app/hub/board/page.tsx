'use client'

import { AlertTriangle, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

type Task = {
  id: number
  board: 'agent' | 'william'
  priority: string
  title: string
  description: string | null
  result: string | null
  assignee: string
  status: string
  created_at: string
  updated_at: string
  completed_at: string | null
  acceptance_criteria: string | null
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | null
  next_run_at: string | null
}

// SVG Icon Components
function IconRobot({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="12" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <circle cx="15" cy="10" r="1.5" />
      <line x1="9" y1="16" x2="9" y2="20" />
      <line x1="15" y1="16" x2="15" y2="20" />
      <line x1="6" y1="20" x2="18" y2="20" />
      <line x1="12" y1="4" x2="12" y2="1" />
      <circle cx="12" cy="1" r="0.5" fill={color} />
    </svg>
  )
}

function IconUser({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconHistory({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconCheck({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconFlag({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function IconCircle({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function IconSquare({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )
}

function IconRepeat({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 1 4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="m7 23-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

function IconClock({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

const priorityMap: Record<string, { icon: (c: string) => React.ReactNode; color: string; label: string }> = {
  '🔴': { icon: (c) => <IconFlag color={c} />, color: '#ef4444', label: '緊急' },
  '🟡': { icon: (c) => <IconCircle color={c} />, color: '#f59e0b', label: '短期' },
  '🔵': { icon: (c) => <IconCircle color={c} />, color: '#3b82f6', label: '中期' },
  '⚪': { icon: (c) => <IconSquare color={c} />, color: '#6b7280', label: '長期' },
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  '待執行': { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af', dot: '#6b7280' },
  '執行中': { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', dot: '#3b82f6' },
  '已完成': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', dot: '#10b981' },
  '已關閉': { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af', dot: '#6b7280' },
  '完成': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', dot: '#10b981' },
  '✅完成': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', dot: '#10b981' },
  '等待': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', dot: '#f59e0b' },
  '⏸️等待': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', dot: '#f59e0b' },
  '中期目標': { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', dot: '#a855f7' },
  '待需求觸發': { bg: 'rgba(75, 85, 99, 0.15)', text: '#9ca3af', dot: '#6b7280' },
  '待規劃': { bg: 'rgba(75, 85, 99, 0.15)', text: '#9ca3af', dot: '#6b7280' },
  '長期目標': { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', dot: '#a855f7' },
}

function formatDate(d: string) {
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatDateFull(d: string) {
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

function formatNextRunDate(dateStr: string | null) {
  if (!dateStr) return '未設定'
  
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  
  if (diffDays <= 0) return `今天 ${timeStr}`
  if (diffDays === 1) return `明天 ${timeStr}`
  if (diffDays <= 7) return `${diffDays}天後 ${timeStr}`
  
  return `${date.getMonth() + 1}/${date.getDate()} ${timeStr}`
}

const recurrenceLabels: Record<string, string> = {
  'daily': '每日',
  'weekly': '每週',
  'monthly': '每月',
  'none': '無'
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function RecurringTaskCard({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false)
  const statusStyle = statusColors[task.status] || statusColors['待執行']
  const p = priorityMap[task.priority] || priorityMap['⚪']
  const hasDesc = !!task.description?.trim()
  const hasResult = !!task.result?.trim()
  const hasCriteria = !!task.acceptance_criteria?.trim()
  const expandable = hasDesc || hasResult || hasCriteria
  
  const isOverdue = task.next_run_at && new Date(task.next_run_at) < new Date()
  const recurrenceType = task.recurrence_type || 'none'

  return (
    <div
      className={`group rounded-xl border p-4 transition-all duration-200 ${expandable ? 'cursor-pointer' : ''}`}
      style={{
        borderColor: isOverdue ? 'rgba(239, 68, 68, 0.45)' : expanded ? 'rgba(55, 65, 81, 0.7)' : 'rgba(139, 92, 246, 0.5)',
        background: isOverdue ? 'rgba(239, 68, 68, 0.06)' : expanded ? 'rgba(17, 24, 39, 0.5)' : 'rgba(139, 92, 246, 0.1)',
      }}
      onClick={() => expandable && setExpanded(!expanded)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)'
        e.currentTarget.style.backgroundColor = 'rgba(17, 24, 39, 0.4)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        if (!expanded) {
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
          e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)'
        }
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {p.icon(p.color)}
          <span className="text-[10px] font-medium" style={{ color: p.color }}>{p.label}</span>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{ background: statusStyle.bg, color: statusStyle.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
          <span>{task.status}</span>
        </div>
      </div>

      <div className="flex items-start gap-1.5 mb-3">
        {expandable && (
          <span className="mt-0.5 flex-shrink-0 text-gray-600">
            <IconChevron open={expanded} />
          </span>
        )}
        <h3 className="text-sm font-medium leading-snug text-gray-200">
          <span className="text-gray-600 font-mono text-xs mr-1.5">#{task.id}</span>
          {task.title}
        </h3>
      </div>

      {/* 週期性資訊 */}
      <div className="mb-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-violet-400">
            <IconRepeat color="#a78bfa" />
            <span className="font-medium">{recurrenceLabels[recurrenceType]}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-cyan-400">
          <IconClock color="#67e8f9" />
          <span className={`font-medium ${isOverdue ? 'text-red-400' : ''}`}>
            {formatNextRunDate(task.next_run_at)}
          </span>
        </div>
      </div>

      {/* Expandable description + result */}
      {expandable && expanded && (
        <div className="mb-3 ml-5 pl-3 border-l-2 border-gray-700/50 space-y-2">
          {hasDesc && (
            <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          )}
          {hasCriteria && (
            <div className="pt-1.5 border-t border-gray-700/30">
              <span className="text-[10px] font-medium text-cyan-500/70 uppercase tracking-wider">驗收標準</span>
              <ul className="mt-1.5 space-y-1">
                {task.acceptance_criteria!.split('\n').filter(l => l.trim()).map((line, i) => {
                  const text = line.replace(/^[-*•]\s*/, '').replace(/^\[[ x]?\]\s*/i, '')
                  const checked = /^\[x\]/i.test(line.trim())
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center ${checked ? 'border-emerald-500/50 bg-emerald-500/20' : 'border-gray-600'}`}>
                        {checked && <IconCheck color="#34d399" />}
                      </span>
                      <span className={checked ? 'line-through text-gray-500' : ''}>{text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {hasResult && (
            <div className="pt-1.5 border-t border-gray-700/30">
              <span className="text-[10px] font-medium text-emerald-500/70 uppercase tracking-wider">完成回報</span>
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap mt-1">
                {task.result}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{task.assignee}</span>
          {isOverdue && <span className="text-red-400 font-medium">逾期</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600" title={formatDateFull(task.created_at)}>{formatDate(task.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task, isHistory }: { task: Task; isHistory?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const statusStyle = statusColors[task.status] || statusColors['待執行']
  const p = priorityMap[task.priority] || priorityMap['⚪']
  const hasDesc = !!task.description?.trim()
  const hasResult = !!task.result?.trim()
  const hasCriteria = !!task.acceptance_criteria?.trim()
  const expandable = hasDesc || hasResult || hasCriteria
  const isStale = task.status === '待執行' && (Date.now() - new Date(task.created_at).getTime()) > 7 * 86400000

  return (
    <div
      className={`group rounded-xl border p-4 transition-all duration-200 ${isHistory ? 'opacity-70' : ''} ${expandable ? 'cursor-pointer' : ''}`}
      style={{
        borderColor: isStale ? 'rgba(239, 68, 68, 0.45)' : expanded ? 'rgba(55, 65, 81, 0.7)' : 'rgba(31, 41, 55, 0.5)',
        background: isStale ? 'rgba(239, 68, 68, 0.06)' : expanded ? 'rgba(17, 24, 39, 0.5)' : 'rgba(17, 24, 39, 0.3)',
      }}
      onClick={() => expandable && setExpanded(!expanded)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(55, 65, 81, 0.6)'
        e.currentTarget.style.backgroundColor = 'rgba(17, 24, 39, 0.4)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        if (!expanded) {
          e.currentTarget.style.borderColor = 'rgba(31, 41, 55, 0.5)'
          e.currentTarget.style.backgroundColor = 'rgba(17, 24, 39, 0.3)'
        }
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {p.icon(p.color)}
          <span className="text-[10px] font-medium" style={{ color: p.color }}>{p.label}</span>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{ background: statusStyle.bg, color: statusStyle.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
          <span>{task.status}</span>
        </div>
      </div>

      <div className="flex items-start gap-1.5 mb-2">
        {expandable && (
          <span className="mt-0.5 flex-shrink-0 text-gray-600">
            <IconChevron open={expanded} />
          </span>
        )}
        <h3
          className={`text-sm font-medium leading-snug ${
            isHistory && task.status === '已完成' 
              ? 'line-through text-gray-500' 
              : isHistory 
                ? 'text-gray-400' 
                : 'text-gray-200'
          }`}
          title={hasDesc ? task.description! : undefined}
        >
          <span className="text-gray-600 font-mono text-xs mr-1.5">#{task.id}</span>
          {task.title}
        </h3>
      </div>

      {/* Expandable description + result */}
      {expandable && expanded && (
        <div className="mb-3 ml-5 pl-3 border-l-2 border-gray-700/50 space-y-2">
          {hasDesc && (
            <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          )}
          {hasCriteria && (
            <div className="pt-1.5 border-t border-gray-700/30">
              <span className="text-[10px] font-medium text-cyan-500/70 uppercase tracking-wider">驗收標準</span>
              <ul className="mt-1.5 space-y-1">
                {task.acceptance_criteria!.split('\n').filter(l => l.trim()).map((line, i) => {
                  const text = line.replace(/^[-*•]\s*/, '').replace(/^\[[ x]?\]\s*/i, '')
                  const checked = /^\[x\]/i.test(line.trim())
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center ${checked ? 'border-emerald-500/50 bg-emerald-500/20' : 'border-gray-600'}`}>
                        {checked && <IconCheck color="#34d399" />}
                      </span>
                      <span className={checked ? 'line-through text-gray-500' : ''}>{text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {hasResult && (
            <div className="pt-1.5 border-t border-gray-700/30">
              <span className="text-[10px] font-medium text-emerald-500/70 uppercase tracking-wider">完成回報</span>
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap mt-1">
                {task.result}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{task.assignee}</span>
          {isStale && <AlertTriangle size={12} className="text-red-400 ml-1" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600" title={formatDateFull(task.created_at)}>{formatDate(task.created_at)}</span>
          {isHistory && task.completed_at && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-500/70">
              <IconCheck color="#10b981" />
              <span>{formatDate(task.completed_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BoardColumn({
  title,
  icon,
  tasks,
  accentColor,
  isHistory,
}: {
  title: string
  icon: React.ReactNode
  tasks: Task[]
  accentColor: string
  isHistory?: boolean
}) {
  return (
    <div
      className="flex-1 min-w-0 rounded-xl border p-4 sm:p-5"
      style={{
        borderColor: `${accentColor}33`,
        background: `${accentColor}0D`,
      }}
    >
      <div
        className="flex items-center gap-2 mb-4 pb-3 border-b"
        style={{ borderColor: `${accentColor}33` }}
      >
        <div className="flex-shrink-0">{icon}</div>
        <h2 className="text-base font-semibold text-gray-200">{title}</h2>
        <span className="ml-auto text-xs text-gray-600 font-medium">{tasks.length}</span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-8">
            {isHistory ? '尚無歷史任務' : '無任務'}
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} isHistory={isHistory} />)
        )}
      </div>
    </div>
  )
}

export default function BoardPage() {
  const [activeTasks, setActiveTasks] = useState<Task[]>([])
  const [plannedTasks, setPlannedTasks] = useState<Task[]>([])
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([])
  const [recurringTasks, setRecurringTasks] = useState<Task[]>([])
  const [doneTasks, setDoneTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'planned' | 'backlog' | 'recurring' | 'done'>('active')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc') // 預設降序（新的在上）

  // 排序函數
  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/board?category=active').then((r) => r.json()),
      fetch('/api/board?category=planned').then((r) => r.json()),
      fetch('/api/board?category=backlog').then((r) => r.json()),
      fetch('/api/board?category=recurring').then((r) => r.json()),
      fetch('/api/board?category=done').then((r) => r.json()),
    ])
      .then(([active, planned, backlog, recurring, done]) => {
        if (Array.isArray(active)) setActiveTasks(active)
        if (Array.isArray(planned)) setPlannedTasks(planned)
        if (Array.isArray(backlog)) setBacklogTasks(backlog)
        if (Array.isArray(recurring)) setRecurringTasks(recurring)
        if (Array.isArray(done)) setDoneTasks(done)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 py-12 sm:py-20">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white hover:scale-105 transition-transform"
              >
                W
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Task Board</h1>
                <p className="text-foreground-muted text-xs sm:text-sm">任務看板</p>
              </div>
            </div>
            <Link href="/" className="text-xs sm:text-sm text-foreground-muted hover:text-foreground transition-colors">
              ← Back to Hub
            </Link>
          </div>

          {/* Tabs and Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit border border-border">
              <button
                onClick={() => setTab('active')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === 'active'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-foreground-muted hover:text-foreground border border-transparent'
                }`}
              >
                待辦 ({activeTasks.length})
              </button>
              <button
                onClick={() => setTab('planned')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === 'planned'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-foreground-muted hover:text-foreground border border-transparent'
                }`}
              >
                規劃中 ({plannedTasks.length})
              </button>
              <button
                onClick={() => setTab('backlog')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === 'backlog'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-foreground-muted hover:text-foreground border border-transparent'
                }`}
              >
                長期 ({backlogTasks.length})
              </button>
              <button
                onClick={() => setTab('recurring')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === 'recurring'
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'text-foreground-muted hover:text-foreground border border-transparent'
                }`}
              >
                週期性 ({recurringTasks.length})
              </button>
              <button
                onClick={() => setTab('done')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === 'done'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-foreground-muted hover:text-foreground border border-transparent'
                }`}
              >
                歷史 ({doneTasks.length})
              </button>
            </div>
            {/* Sort button */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 bg-muted border border-border text-foreground-muted hover:bg-accent flex items-center gap-1.5 w-fit"
              title={`排序：${sortOrder === 'desc' ? '新到舊' : '舊到新'}`}
            >
              <ArrowUpDown size={12} />
              {sortOrder === 'desc' ? '新→舊' : '舊→新'}
            </button>
          </div>
        </header>

        {/* Board */}
        {loading ? (
          <div className="text-center text-foreground-muted py-20">Loading...</div>
        ) : (() => {
          const currentTasks = tab === 'active' ? activeTasks
                             : tab === 'planned' ? plannedTasks
                             : tab === 'backlog' ? backlogTasks
                             : tab === 'recurring' ? recurringTasks
                             : doneTasks

          if (tab === 'recurring') {
            // 週期性任務使用特殊排序（按 next_run_at 排序）
            const sortedRecurringTasks = [...recurringTasks].sort((a, b) => {
              const dateA = a.next_run_at ? new Date(a.next_run_at).getTime() : Infinity
              const dateB = b.next_run_at ? new Date(b.next_run_at).getTime() : Infinity
              return dateA - dateB
            })
            
            const agentRecurring = sortedRecurringTasks.filter((t) => t.board === 'agent')
            const williamRecurring = sortedRecurringTasks.filter((t) => t.board === 'william')

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  className="flex-1 min-w-0 rounded-xl border p-4 sm:p-5"
                  style={{
                    borderColor: '#8b5cf633',
                    background: '#8b5cf60D',
                  }}
                >
                  <div
                    className="flex items-center gap-2 mb-4 pb-3 border-b"
                    style={{ borderColor: '#8b5cf633' }}
                  >
                    <div className="flex-shrink-0"><IconRobot color="#3b82f6" /></div>
                    <h2 className="text-base font-semibold text-gray-200">Travis 看板</h2>
                    <span className="ml-auto text-xs text-gray-600 font-medium">{agentRecurring.length}</span>
                  </div>
                  <div className="space-y-3">
                    {agentRecurring.length === 0 ? (
                      <div className="text-center text-gray-600 text-sm py-8">無週期性任務</div>
                    ) : (
                      agentRecurring.map((task) => <RecurringTaskCard key={task.id} task={task} />)
                    )}
                  </div>
                </div>

                <div
                  className="flex-1 min-w-0 rounded-xl border p-4 sm:p-5"
                  style={{
                    borderColor: '#8b5cf633',
                    background: '#8b5cf60D',
                  }}
                >
                  <div
                    className="flex items-center gap-2 mb-4 pb-3 border-b"
                    style={{ borderColor: '#8b5cf633' }}
                  >
                    <div className="flex-shrink-0"><IconUser color="#f59e0b" /></div>
                    <h2 className="text-base font-semibold text-gray-200">William 看板</h2>
                    <span className="ml-auto text-xs text-gray-600 font-medium">{williamRecurring.length}</span>
                  </div>
                  <div className="space-y-3">
                    {williamRecurring.length === 0 ? (
                      <div className="text-center text-gray-600 text-sm py-8">無週期性任務</div>
                    ) : (
                      williamRecurring.map((task) => <RecurringTaskCard key={task.id} task={task} />)
                    )}
                  </div>
                </div>
              </div>
            )
          }

          const sortedTasks = sortTasks(currentTasks)
          const agentTasks = sortedTasks.filter((t) => t.board === 'agent')
          const williamTasks = sortedTasks.filter((t) => t.board === 'william')

          if (tab === 'done') {
            return (
              <BoardColumn
                title="歷史任務"
                icon={<IconHistory color="#10b981" />}
                tasks={sortedTasks}
                accentColor="#10b981"
                isHistory
              />
            )
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BoardColumn
                title="Travis 看板"
                icon={<IconRobot color="#3b82f6" />}
                tasks={agentTasks}
                accentColor="#3b82f6"
              />
              <BoardColumn
                title="William 看板"
                icon={<IconUser color="#f59e0b" />}
                tasks={williamTasks}
                accentColor="#f59e0b"
              />
            </div>
          )
        })()}

        {/* Footer */}
<footer className="mt-14 text-center text-foreground-subtle text-xs tracking-wide">
          William Hub v2 — Board
        </footer>
      </div>
    </main>
  )
}
