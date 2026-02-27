// ============================================================
// William Hub — Reports Management Center
// ============================================================
'use client'

import {
  FileText, ArrowLeft, Loader2,
  User, Calendar, Filter, ArrowUpDown,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

// --- Types ---
interface Report {
  id: number | string
  title: string
  date: string
  author: string
  type: 'md' | 'doc' | 'pdf'
  doc_url: string | null
  pdf_url: string | null
  pdf_exists?: boolean
  pdf_size?: number | null
  export_status: string | null
  content?: string
  md_content?: string
}

type FilterType = 'all' | 'md' | 'doc' | 'pdf'

// --- Badge colors ---
const typeBadge: Record<string, { bg: string; text: string }> = {
  md: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  doc: { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  pdf: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
}

// --- Report Card ---
function ReportCard({
  report,
  onClick,
}: {
  report: Report
  onClick: () => void
}) {
  const badge = typeBadge[report.type] || typeBadge.md
  const hasExport = report.doc_url || report.pdf_url
  const isExporting = report.export_status === 'exporting'

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg transition-all duration-150 hover:bg-white/[0.04] border border-white/[0.08] bg-card"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-foreground truncate flex-1">
          <span className="text-foreground-subtle font-mono text-xs mr-1">#{report.id}</span>{report.title}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full uppercase font-medium shrink-0"
          style={{ background: badge.bg, color: badge.text }}
        >
          {report.type}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <User size={10} />
        <span>{report.author}</span>
        <Calendar size={10} className="ml-1" />
        <span>{new Date(report.date).toLocaleDateString('zh-TW')}</span>
      </div>
    </button>
  )
}

// ============================================================
// Main Page
// ============================================================
export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc') // 預設降序（新的在上）
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch list
  useEffect(() => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReports(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = (filter === 'all' ? reports : reports.filter((r) => r.type === filter))
    .filter((r) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        r.title?.toLowerCase().includes(q) ||
        r.author?.toLowerCase().includes(q) ||
        String(r.id).includes(q)
      )
    })
    .sort((a, b) => {
      return sortOrder === 'desc' ? Number(b.id) - Number(a.id) : Number(a.id) - Number(b.id)
    })

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'MD', value: 'md' },
    { label: 'Doc', value: 'doc' },
    { label: 'PDF', value: 'pdf' },
  ]

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <a href="/" className="text-foreground-muted hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </a>
        <FileText size={18} className="text-blue-400" />
        <h1 className="text-sm font-semibold text-foreground">Reports</h1>
      </div>

      {/* Controls */}
      <div className="px-4 py-4 border-b border-border bg-background-subtle">
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          {/* Search bar */}
          <input
            type="text"
            placeholder="搜尋報告標題、作者、ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
          />

          {/* Filter and sort */}
          <div className="flex justify-between items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    filter === f.value
                      ? 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                      : 'bg-muted border border-border text-foreground-muted hover:bg-accent'
                  }`}
                >
                  <Filter size={10} className="inline mr-1" />
                  {f.label}
                </button>
              ))}
            </div>
            {/* Sort button */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-muted border border-border text-foreground-muted hover:bg-accent flex items-center gap-1.5"
              title={`排序：${sortOrder === 'desc' ? '新到舊' : '舊到新'}`}
            >
              <ArrowUpDown size={12} />
              {sortOrder === 'desc' ? '新→舊' : '舊→新'}
            </button>
          </div>

          {/* Report count */}
          <div className="text-xs text-foreground-muted">
            共 {filtered.length} 份報告{filter !== 'all' || searchQuery ? `（已篩選）` : ''}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-foreground-muted">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-foreground-muted text-sm">
              <FileText size={32} className="mx-auto mb-3 text-foreground-subtle" />
              No reports
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onClick={() => router.push(`/reports/${r.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
