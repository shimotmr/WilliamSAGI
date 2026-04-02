'use client'

import {
  ArrowLeft, Calendar, Download, FileText, Loader2, Tag, User,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { use, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

interface Report {
  id: number | string
  title: string
  date: string
  author: string
  type: 'md'
  md_content: string
  source: 'local' | 'supabase'
}

const sourceBadge: Record<string, { bg: string; text: string }> = {
  local: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  supabase: { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
}

const typeBadge: Record<string, { bg: string; text: string }> = {
  md: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
}

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentRef = useRef<HTMLDivElement>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const returnTo = useMemo(() => {
    const raw = searchParams.get('returnTo')
    return raw && raw.startsWith('/hub/reports') ? raw : '/hub/reports'
  }, [searchParams])

  useEffect(() => {
    if (!id) return

    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${id}`)
        if (!response.ok) {
          setError(response.status === 404 ? '找不到報告' : '載入報告失敗')
          return
        }

        const data = await response.json()
        if (data && !data.error) {
          setReport(data)
        } else {
          setError(data.error || '載入報告失敗')
        }
      } catch (fetchError) {
        console.error('Error fetching report:', fetchError)
        setError('網路錯誤')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [id])

  const goBack = () => router.push(returnTo)

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !report) return

    setDownloading(true)
    try {
      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }

      const html2pdfModule = await import('html2pdf.js')
      const html2pdf = html2pdfModule.default
      await html2pdf().set(options).from(contentRef.current).save()
    } catch (downloadError) {
      console.error('Error generating PDF:', downloadError)
      alert('PDF 匯出失敗，請稍後再試。')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <button
            onClick={goBack}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <FileText size={18} className="text-blue-400" />
          <h1 className="text-sm font-semibold text-foreground">載入報告中…</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-foreground-muted" />
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <button
            onClick={goBack}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <FileText size={18} className="text-red-400" />
          <h1 className="text-sm font-semibold text-foreground">報告載入失敗</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText size={48} className="mx-auto mb-4 text-foreground-subtle" />
            <p className="text-lg font-medium text-foreground mb-2">{error}</p>
            <button
              onClick={goBack}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              回報告列表
            </button>
          </div>
        </div>
      </div>
    )
  }

  const sourceColor = sourceBadge[report.source] || sourceBadge.local
  const typeColor = typeBadge[report.type] || typeBadge.md

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={goBack}
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <FileText size={18} className="text-blue-400" />
        <h1 className="text-sm font-semibold text-foreground flex-1">報告詳情</h1>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading || !report}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          <span className="hidden sm:inline">PDF</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="max-w-[800px] mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex-1">
                {report.title}
              </h1>

              <div className="flex gap-2 shrink-0">
                <span
                  className="text-[10px] px-2 py-1 rounded-full uppercase font-medium"
                  style={{ background: sourceColor.bg, color: sourceColor.text }}
                >
                  <Tag size={10} className="inline mr-1" />
                  {report.source}
                </span>
                <span
                  className="text-[10px] px-2 py-1 rounded-full uppercase font-medium"
                  style={{ background: typeColor.bg, color: typeColor.text }}
                >
                  {report.type}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <User size={14} />
                {report.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(report.date).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="md:hidden mb-6">
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              回報告列表
            </button>
          </div>

          <article className="prose-dark">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
            >
              {report.md_content || '_No content available_'}
            </ReactMarkdown>
          </article>

          <div className="mt-12 pt-8 border-t border-border">
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              回報告列表
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
