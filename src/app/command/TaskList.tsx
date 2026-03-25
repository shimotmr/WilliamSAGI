"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useSupabaseRealtime } from './useSupabaseRealtime'

interface Task {
  id: number
  title: string
  status: string
  priority: string
  assignee: string
  created_at: string
  updated_at: string
  completed_at: string | null
  description: string | null
  dispatch_prompt: string | null
  dispatch_model: string | null
  result: string | null
  retry_count: number
  last_failure_reason: string | null
  tags: string | null
  execution_type: string | null
}

const STATUS_OPTIONS = ['全部', '待執行', '執行中', '已完成', '已失敗', '待驗收', '已擱置']
const PRIORITY_OPTIONS = ['全部', 'P0', 'P1', 'P2', 'P3']

const STATUS_COLORS: Record<string, string> = {
  '待執行': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  '執行中': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  '已完成': 'bg-green-500/10 text-green-400 border-green-500/20',
  '已失敗': 'bg-red-500/10 text-red-400 border-red-500/20',
  '待驗收': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  '已擱置': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const PRIORITY_COLORS: Record<string, string> = {
  'P0': 'text-red-400',
  'P1': 'text-orange-400',
  'P2': 'text-yellow-400',
  'P3': 'text-gray-400',
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [priorityFilter, setPriorityFilter] = useState('全部')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const PAGE_SIZE = 25

  const fetchTasks = useCallback(async () => {
    const supabase = createClient()
    let q = supabase
      .from('board_tasks')
      .select('id,title,status,priority,assignee,created_at,updated_at,completed_at,description,dispatch_prompt,dispatch_model,result,retry_count,last_failure_reason,tags,execution_type', { count: 'exact' })
      .order('id', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (statusFilter !== '全部') q = q.eq('status', statusFilter)
    if (priorityFilter !== '全部') q = q.eq('priority', priorityFilter)
    if (search.trim()) q = q.ilike('title', `%${search.trim()}%`)

    const { data, count } = await q
    setTasks((data || []) as Task[])
    setTotal(count || 0)
    setLoading(false)
  }, [page, statusFilter, priorityFilter, search])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useSupabaseRealtime('board_tasks', fetchTasks)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="搜尋任務標題..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-64 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={e => { setPriorityFilter(e.target.value); setPage(0) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
        >
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-xs text-gray-500 ml-auto">{total} 筆結果</span>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-gray-500 py-16">沒有符合條件的任務</div>
      ) : (
        <div className="space-y-1">
          {tasks.map(t => (
            <div key={t.id}>
              {/* Task Row */}
              <button
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left"
              >
                <span className="text-xs font-mono text-gray-600 w-14 shrink-0">#{t.id}</span>
                <span className={`text-xs font-medium w-8 shrink-0 ${PRIORITY_COLORS[t.priority] || 'text-gray-500'}`}>
                  {t.priority || '—'}
                </span>
                <span className="text-sm text-gray-200 truncate flex-1">{t.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[t.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                  {t.status}
                </span>
                <span className="text-xs text-gray-500 w-16 text-right shrink-0">{t.assignee || '—'}</span>
                <svg className={`w-4 h-4 text-gray-600 transition-transform ${expandedId === t.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Detail */}
              {expandedId === t.id && (
                <div className="mx-4 mb-2 p-4 rounded-b-lg bg-white/[0.03] border border-t-0 border-white/5 space-y-3 text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <Detail label="建立" value={fmtDate(t.created_at)} />
                    <Detail label="更新" value={fmtDate(t.updated_at)} />
                    <Detail label="完成" value={t.completed_at ? fmtDate(t.completed_at) : '—'} />
                    <Detail label="模型" value={t.dispatch_model || '—'} />
                    <Detail label="重試次數" value={String(t.retry_count || 0)} highlight={t.retry_count > 0} />
                    <Detail label="執行類型" value={t.execution_type || '—'} />
                    <Detail label="標籤" value={t.tags || '—'} />
                  </div>

                  {t.last_failure_reason && (
                    <div>
                      <p className="text-xs text-red-400 font-medium mb-1">❌ 最後失敗原因</p>
                      <pre className="text-xs text-red-300/70 bg-red-500/5 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-32">
                        {t.last_failure_reason}
                      </pre>
                    </div>
                  )}

                  {t.dispatch_prompt && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">📝 Dispatch Prompt</p>
                      <pre className="text-xs text-gray-400 bg-white/[0.02] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-48">
                        {t.dispatch_prompt}
                      </pre>
                    </div>
                  )}

                  {t.result && (
                    <div>
                      <p className="text-xs text-green-400 font-medium mb-1">✅ Result</p>
                      <pre className="text-xs text-gray-400 bg-green-500/5 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-32">
                        {t.result}
                      </pre>
                    </div>
                  )}

                  {t.description && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">描述</p>
                      <p className="text-xs text-gray-500 whitespace-pre-wrap max-h-24 overflow-y-auto">{t.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30"
          >
            上一頁
          </button>
          <span className="text-xs text-gray-500">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30"
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-gray-600">{label}：</span>
      <span className={highlight ? 'text-orange-400' : 'text-gray-400'}>{value}</span>
    </div>
  )
}

function fmtDate(s: string) {
  try {
    const d = new Date(s)
    return `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  } catch { return s }
}
