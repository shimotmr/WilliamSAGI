'use client'

import { TrendingUp, CheckCircle2, FileText, Zap, BadgeCheck } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Chart components with dynamic imports to prevent SSR hydration issues
const TaskTrendChart = dynamic(() => import('./components/TaskTrendChart'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-background-elevated rounded animate-pulse" />
})
const ReportTrendChart = dynamic(() => import('./components/ReportTrendChart'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-background-elevated rounded animate-pulse" />
})

interface DailyCount {
  date: string
  count: number
}

interface ReportTrendData {
  date: string
  research?: number
  review?: number
  design?: number
  analysis?: number
  report?: number
}

interface Capability {
  id: number
  title: string
  description: string | null
  category: string
  added_at: string
}

interface GrowthData {
  trend: DailyCount[]
  summary: {
    total: number
    avgPerDay: number
    cumulative: number[]
  }
  reportTrend: ReportTrendData[]
  capabilities: Capability[]
}

export default function GrowthPage() {
  const [data, setData] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/growth')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching growth data:', err)
        setError('載入失敗')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2" />
            <div className="h-4 bg-muted rounded w-64 mb-8" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center h-96 text-foreground-muted">
            <TrendingUp className="w-12 h-12 mb-2" />
            <p>{error || '無法載入資料'}</p>
          </div>
        </div>
      </main>
    )
  }

  const totalReports = data.reportTrend.reduce(
    (sum, day) => sum + (day.research || 0) + (day.review || 0) + (day.design || 0) + (day.analysis || 0) + (day.report || 0),
    0
  )

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-foreground">Growth Dashboard</h1>
          </div>
          <p className="text-foreground-muted">系統與團隊成長趨勢分析</p>
        </div>

        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Task Completion Trend Card */}
          <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">任務完成量趨勢</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">總完成數</div>
                <div className="text-xl font-bold text-foreground">{data.summary.total}</div>
              </div>
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">平均每日</div>
                <div className="text-xl font-bold text-foreground">{data.summary.avgPerDay}</div>
              </div>
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">期間</div>
                <div className="text-xl font-bold text-foreground">30 天</div>
              </div>
            </div>

            <div className="h-64">
              <TaskTrendChart data={data.trend} />
            </div>
          </div>

          {/* Report Trend Card */}
          <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold">報告產出量趨勢</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">總報告數</div>
                <div className="text-xl font-bold text-foreground">{totalReports}</div>
              </div>
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">平均每日</div>
                <div className="text-xl font-bold text-foreground">{(totalReports / 30).toFixed(1)}</div>
              </div>
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">期間</div>
                <div className="text-xl font-bold text-foreground">30 天</div>
              </div>
            </div>

            <div className="h-64">
              <ReportTrendChart data={data.reportTrend} />
            </div>
          </div>

          {/* System Capabilities Timeline Card */}
          <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold">系統能力擴展記錄</h2>
            </div>

            {data.capabilities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-foreground-muted">
                <Zap className="w-12 h-12 mb-2 opacity-50" />
                <p>尚無能力擴展記錄</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-2">
                <div className="space-y-4">
                  {data.capabilities.map((cap) => {
                    // 檢查是否為 BT 突破記錄
                    const isBreakthroughRecord = cap.title.includes('BT-001') || cap.title.includes('BT-002')
                    const breakthroughId = cap.title.includes('BT-001') ? 'bt-001' : cap.title.includes('BT-002') ? 'bt-002' : null
                    
                    const content = (
                      <div className="flex gap-3 group">
                        <div className="flex-shrink-0 pt-1">
                          <div className={`w-2 h-2 rounded-full ${isBreakthroughRecord ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                        </div>
                        <div className="flex-1 pb-4 border-b border-border/50 last:border-0">
                          <div className="flex items-start gap-2 mb-1">
                            <BadgeCheck className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isBreakthroughRecord ? 'text-yellow-400' : 'text-blue-400'}`} />
                            <span className={`font-medium ${isBreakthroughRecord ? 'text-yellow-400' : 'text-foreground'}`}>
                              {cap.title}
                            </span>
                            {isBreakthroughRecord && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full ml-2">
                                點擊查看詳情
                              </span>
                            )}
                          </div>
                          {cap.description && (
                            <p className="text-sm text-foreground-muted ml-6 mb-2">
                              {cap.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-foreground-muted ml-6">
                            <span className={`px-2 py-0.5 rounded-full ${isBreakthroughRecord ? 'bg-yellow-400/20 text-yellow-400' : 'bg-background-elevated'}`}>
                              {cap.category}
                            </span>
                            <span>
                              {new Date(cap.added_at).toLocaleDateString('zh-TW', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )

                    // 如果是突破記錄，包裹在可點擊的連結中
                    if (isBreakthroughRecord && breakthroughId) {
                      return (
                        <a
                          key={cap.id}
                          href={`/growth/${breakthroughId}`}
                          className="block hover:bg-background-elevated/50 rounded-lg p-3 -m-3 transition-colors cursor-pointer"
                        >
                          {content}
                        </a>
                      )
                    }

                    return (
                      <div key={cap.id}>
                        {content}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <a 
            href="/" 
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            返回首頁
          </a>
        </div>
      </div>
    </main>
  )
}
