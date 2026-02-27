'use client'

import {
  ArrowLeft,
  Search,
  MessageSquare,
  Database,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  FileText,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

// ─── Types ───────────────────────────────────────────────────
type FaqItem = {
  patterns: string[]
  answer: string
  category: string
}

type TestCase = {
  id: number
  category: string
  question: string
  expected: string
  criteria: string
  status: 'pass' | 'fail' | 'pending'
}

// ─── Static Data ─────────────────────────────────────────────
// TODO: Replace with real data from Supabase
const faqData: FaqItem[] = []

// TODO: Replace with real test cases from Supabase  
const testCases: TestCase[] = []

// ─── Tab type ────────────────────────────────────────────────
type Tab = 'faq' | 'knowledge' | 'tests'

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'faq', label: 'FAQ 管理', icon: <MessageSquare size={16} /> },
  { key: 'knowledge', label: '知識庫', icon: <Database size={16} /> },
  { key: 'tests', label: '測試案例', icon: <FlaskConical size={16} /> },
]

// ─── Status badge ────────────────────────────────────────────
function StatusBadge({ status }: { status: TestCase['status'] }) {
  const config = {
    pass: { icon: <CheckCircle2 size={14} />, text: '通過', cls: 'text-emerald-400 bg-emerald-400/10' },
    fail: { icon: <XCircle size={14} />, text: '失敗', cls: 'text-red-400 bg-red-400/10' },
    pending: { icon: <Clock size={14} />, text: '待測', cls: 'text-amber-400 bg-amber-400/10' },
  }
  const c = config[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${c.cls}`}>
      {c.icon} {c.text}
    </span>
  )
}

// ─── FAQ Tab ─────────────────────────────────────────────────
function FaqTab({ search }: { search: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    if (!search) return faqData
    const q = search.toLowerCase()
    return faqData.filter(
      (f) =>
        f.category.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.patterns.some((p) => p.toLowerCase().includes(q))
    )
  }, [search])

  const grouped = useMemo(() => {
    const map: Record<string, FaqItem[]> = {}
    filtered.forEach((f) => {
      if (!map[f.category]) map[f.category] = []
      map[f.category].push(f)
    })
    return map
  }, [filtered])

  const toggle = (cat: string) => setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))

  // Show empty state when no FAQ data exists
  if (faqData.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400 mb-2">尚無 FAQ 資料</h3>
        <p className="text-sm text-gray-500">
          請聯繫系統管理員新增 FAQ 問答資料
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="border border-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggle(cat)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/40 hover:bg-gray-800/60 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-blue-400" />
              <span className="font-medium text-sm">{cat}</span>
              <span className="text-xs text-gray-500">({items.length})</span>
            </div>
            {expanded[cat] ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
          </button>
          {expanded[cat] && (
            <div className="divide-y divide-gray-800/60">
              {items.map((item, i) => (
                <div key={i} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <HelpCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                      {item.patterns.map((p) => (
                        <span key={p} className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">{p}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 pl-5">{item.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {Object.keys(grouped).length === 0 && faqData.length > 0 && (
        <p className="text-center text-gray-500 py-8 text-sm">沒有符合的結果</p>
      )}
    </div>
  )
}

// ─── Knowledge Result type ───────────────────────────────────
type KnowledgeResult = {
  title: string
  spec: string
  source: string
  product_types: string
  list_price: number | null
  dealer_price: number | null
  total_qty: number | null
}

// ─── Knowledge Tab ───────────────────────────────────────────
function KnowledgeTab({ search }: { search: string }) {
  // TODO: Replace with real API integration when knowledge/search endpoint is available
  // For now, show empty state as API doesn't exist
  
  return (
    <div className="text-center py-12">
      <Database size={48} className="text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-400 mb-2">尚無知識庫資料</h3>
      <p className="text-sm text-gray-500 mb-4">
        知識庫功能尚未建置完成，請聯繫系統管理員
      </p>
      <p className="text-xs text-gray-600">
        API 端點 <code>/api/knowledge/search</code> 尚未實作
      </p>
    </div>
  )
}

// ─── Tests Tab ───────────────────────────────────────────────
function TestsTab({ search }: { search: string }) {
  const filtered = useMemo(() => {
    if (!search) return testCases
    const q = search.toLowerCase()
    return testCases.filter(
      (t) =>
        t.category.toLowerCase().includes(q) ||
        t.question.toLowerCase().includes(q) ||
        t.expected.toLowerCase().includes(q)
    )
  }, [search])

  const stats = useMemo(() => {
    const pass = filtered.filter((t) => t.status === 'pass').length
    const fail = filtered.filter((t) => t.status === 'fail').length
    const pending = filtered.filter((t) => t.status === 'pending').length
    return { pass, fail, pending, total: filtered.length }
  }, [filtered])

  // Show empty state when no test cases exist
  if (testCases.length === 0) {
    return (
      <div className="text-center py-12">
        <FlaskConical size={48} className="text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400 mb-2">尚無測試案例</h3>
        <p className="text-sm text-gray-500">
          請聯繫系統管理員新增 LINE Bot 測試案例
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex gap-4 text-xs">
        <span className="text-emerald-400">{stats.pass} 通過</span>
        <span className="text-red-400">{stats.fail} 失敗</span>
        <span className="text-amber-400">{stats.pending} 待測</span>
        <span className="text-gray-500">{stats.total} 總計</span>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-800">
              <th className="text-left py-2 px-3 font-medium">分類</th>
              <th className="text-left py-2 px-3 font-medium">問題</th>
              <th className="text-left py-2 px-3 font-medium hidden md:table-cell">預期</th>
              <th className="text-left py-2 px-3 font-medium">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-2.5 px-3 text-gray-500 text-xs whitespace-nowrap">{t.category}</td>
                <td className="py-2.5 px-3 text-gray-200">{t.question}</td>
                <td className="py-2.5 px-3 text-gray-400 text-xs hidden md:table-cell max-w-[240px] truncate">{t.expected}</td>
                <td className="py-2.5 px-3"><StatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && testCases.length > 0 && (
        <p className="text-center text-gray-500 py-8 text-sm">沒有符合的結果</p>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function LineBotTrainingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('faq')
  const [search, setSearch] = useState('')

  return (
    <div className="min-h-screen bg-[#090b10] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">LINE Bot 訓練中心</h1>
            <p className="text-xs text-gray-500">FAQ / 知識庫 / 測試案例管理</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearch('') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="搜尋..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
            />
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'faq' && <FaqTab search={search} />}
        {activeTab === 'knowledge' && <KnowledgeTab search={search} />}
        {activeTab === 'tests' && <TestsTab search={search} />}
      </main>
    </div>
  )
}
