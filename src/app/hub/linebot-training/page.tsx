'use client'

import {
  ArrowLeft,
  Search,
  MessageSquare,
  Plus,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────
type QaItem = {
  id: number
  question: string
  answer: string
  source_type: string
  created_at: string
}

type TrainingRecord = {
  id: number
  source_type: string
  data_count: number
  status: string
  created_at: string
}

const SOURCE_OPTIONS = ['手動', 'cases', 'reports'] as const

// ─── Status badge ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    '訓練中': { icon: <Loader2 size={14} className="animate-spin" />, cls: 'text-blue-400 bg-blue-400/10' },
    '已完成': { icon: <CheckCircle2 size={14} />, cls: 'text-emerald-400 bg-emerald-400/10' },
    '失敗':   { icon: <XCircle size={14} />, cls: 'text-red-400 bg-red-400/10' },
  }
  const c = map[status] || { icon: <Clock size={14} />, cls: 'text-amber-400 bg-amber-400/10' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${c.cls}`}>
      {c.icon} {status}
    </span>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function LineBotTrainingPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sourceType, setSourceType] = useState<string>('手動')
  const [submitting, setSubmitting] = useState(false)
  const [training, setTraining] = useState(false)
  const [qaList, setQaList] = useState<QaItem[]>([])
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // ─── Fetch data ──────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [qaRes, recRes] = await Promise.all([
        fetch('/api/hub/linebot-training?type=qa'),
        fetch('/api/hub/linebot-training?type=records'),
      ])
      const qaJson = await qaRes.json()
      const recJson = await recRes.json()
      if (qaJson.qa) setQaList(qaJson.qa)
      if (recJson.records) setRecords(recJson.records)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Add QA ──────────────────────────────────────────────
  const handleAddQa = async () => {
    if (!question.trim() || !answer.trim()) return
    setSubmitting(true)
    setMsg(null)
    try {
      const res = await fetch('/api/hub/linebot-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_qa', question: question.trim(), answer: answer.trim(), source_type: sourceType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setQuestion('')
      setAnswer('')
      setMsg({ type: 'ok', text: 'QA 新增成功' })
      fetchData()
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : '新增失敗' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Trigger training ────────────────────────────────────
  const handleTrain = async () => {
    setTraining(true)
    setMsg(null)
    try {
      const res = await fetch('/api/hub/linebot-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'train', source_type: sourceType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMsg({ type: 'ok', text: '訓練已開始' })
      fetchData()
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : '訓練觸發失敗' })
    } finally {
      setTraining(false)
    }
  }

  // ─── Filtered QA list ────────────────────────────────────
  const filteredQa = search
    ? qaList.filter(
        (q) =>
          q.question.toLowerCase().includes(search.toLowerCase()) ||
          q.answer.toLowerCase().includes(search.toLowerCase())
      )
    : qaList

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#090b10] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">LINE Bot 訓練管理</h1>
            <p className="text-xs text-gray-500">QA 資料管理 / 訓練觸發 / 訓練紀錄</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── QA Input Form ─────────────────────────────── */}
        <section className="border border-gray-800 rounded-lg p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Plus size={16} className="text-blue-400" />
            新增 QA 問答
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">問題</label>
              <input
                type="text"
                placeholder="輸入問題..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">答案</label>
              <input
                type="text"
                placeholder="輸入答案..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">資料來源</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-700 transition-colors"
              >
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddQa}
                disabled={submitting || !question.trim() || !answer.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                新增
              </button>
              <button
                onClick={handleTrain}
                disabled={training}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {training ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                訓練
              </button>
            </div>
          </div>

          {msg && (
            <p className={`text-xs ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
              {msg.text}
            </p>
          )}
        </section>

        {/* ── Training Records ──────────────────────────── */}
        <section className="border border-gray-800 rounded-lg p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <RefreshCw size={16} className="text-emerald-400" />
              訓練紀錄
            </h2>
            <button onClick={fetchData} className="text-gray-500 hover:text-gray-300 transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-500" />
            </div>
          ) : records.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">尚無訓練紀錄</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left py-2 px-3 font-medium">ID</th>
                    <th className="text-left py-2 px-3 font-medium">資料來源</th>
                    <th className="text-left py-2 px-3 font-medium">筆數</th>
                    <th className="text-left py-2 px-3 font-medium">狀態</th>
                    <th className="text-left py-2 px-3 font-medium">建立時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-gray-500 text-xs font-mono">{r.id}</td>
                      <td className="py-2.5 px-3 text-gray-300">{r.source_type}</td>
                      <td className="py-2.5 px-3 text-gray-400">{r.data_count}</td>
                      <td className="py-2.5 px-3"><StatusBadge status={r.status} /></td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleString('zh-TW')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── QA Data List ──────────────────────────────── */}
        <section className="border border-gray-800 rounded-lg p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-400" />
              QA 資料列表
              <span className="text-xs text-gray-600 font-normal">({filteredQa.length})</span>
            </h2>
            <div className="relative max-w-xs w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="搜尋 QA..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-500" />
            </div>
          ) : filteredQa.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={36} className="text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">{search ? '沒有符合的結果' : '尚無 QA 資料，請使用上方表單新增'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left py-2 px-3 font-medium">問題</th>
                    <th className="text-left py-2 px-3 font-medium">答案</th>
                    <th className="text-left py-2 px-3 font-medium hidden sm:table-cell">來源</th>
                    <th className="text-left py-2 px-3 font-medium hidden md:table-cell">時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredQa.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-gray-200 max-w-[200px] truncate">{q.question}</td>
                      <td className="py-2.5 px-3 text-gray-400 max-w-[260px] truncate">{q.answer}</td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs hidden sm:table-cell">{q.source_type}</td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs hidden md:table-cell">{new Date(q.created_at).toLocaleString('zh-TW')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
