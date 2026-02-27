'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Activity,
  FileText,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface ComplianceData {
  overall_score: number
  total_checks: number
  passed: number
  warnings: number
  failed: number
  skipped: number
  last_check: string
  results: Array<{
    category: string
    check_name: string
    level: string
    message: string
    details: Record<string, any>
  }>
}

interface MetricsData {
  total: number
  completed?: number
  in_progress?: number
  delivered?: number
  pending?: number
  success_rate: number
  completion_rate?: number
  resolution_rate?: number
  total_incidents?: number
  resolved?: number
  unresolved?: number
}

interface DashboardData {
  compliance: ComplianceData
  tasks: MetricsData
  reports: MetricsData
  quality: MetricsData
  timestamp: string
}

const getStatusIcon = (level: string) => {
  switch (level) {
    case 'pass': return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    case 'fail': return <XCircle className="w-4 h-4 text-red-500" />
    default: return <Minus className="w-4 h-4 text-gray-400" />
  }
}

const getStatusColor = (score: number) => {
  if (score >= 90) return 'text-green-500'
  if (score >= 70) return 'text-yellow-500'
  return 'text-red-500'
}

const getStatusBg = (score: number) => {
  if (score >= 90) return 'bg-green-500/10'
  if (score >= 70) return 'bg-yellow-500/10'
  return 'bg-red-500/10'
}

export default function SOPDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/sop?type=summary')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch SOP data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    // 自動刷新每 60 秒
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="py-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} /> Back to feed
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Shield size={20} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SOP Dashboard</h1>
            <p className="text-sm text-muted-foreground">Loading compliance data...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-muted rounded-xl" />
            <div className="h-24 bg-muted rounded-xl" />
            <div className="h-24 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} /> Back to feed
        </Link>
        <div className="text-center py-20">
          <AlertCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p>Failed to load SOP data</p>
        </div>
      </div>
    )
  }

  const { compliance, tasks, reports, quality, timestamp } = data

  return (
    <div className="py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={16} /> Back to feed
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Shield size={20} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SOP Dashboard</h1>
            <p className="text-sm text-muted-foreground">SOP 合規性監控面板</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* Overall Score */}
      <div className={`rounded-xl p-6 mb-6 ${getStatusBg(compliance.overall_score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">合規評分</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${getStatusColor(compliance.overall_score)}`}>
                {compliance.overall_score.toFixed(1)}
              </span>
              <span className="text-lg text-muted-foreground">%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              上次檢查: {new Date(compliance.last_check).toLocaleString('zh-TW')}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" /> {compliance.passed} 通過
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-yellow-500" /> {compliance.warnings} 警告
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-500" /> {compliance.failed} 失敗
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Task Metrics */}
        <div className="border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold">任務指標</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">完成率</span>
              <span className={getStatusColor(tasks.completion_rate || 0)}>{(tasks.completion_rate || 0).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">總任務</span>
              <span>{tasks.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">已完成</span>
              <span className="text-green-500">{tasks.completed || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">進行中</span>
              <span className="text-yellow-500">{tasks.in_progress || 0}</span>
            </div>
          </div>
        </div>

        {/* Report Metrics */}
        <div className="border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold">報告指標</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">交付成功率</span>
              <span className={getStatusColor(reports.success_rate)}>{reports.success_rate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">總報告</span>
              <span>{reports.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">已交付</span>
              <span className="text-green-500">{reports.delivered || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">待處理</span>
              <span className="text-yellow-500">{reports.pending || 0}</span>
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold">品質指標</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">問題解決率</span>
              <span className={getStatusColor(quality.resolution_rate || 0)}>{(quality.resolution_rate || 0).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">總事件</span>
              <span>{quality.total_incidents || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">已解決</span>
              <span className="text-green-500">{quality.resolved || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">待解決</span>
              <span className="text-yellow-500">{quality.unresolved || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Check Results */}
      <div className="border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-4">檢查項目詳細結果</h3>
        <div className="space-y-3">
          {compliance.results.map((result, idx) => (
            <div 
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg ${
                result.level === 'pass' ? 'bg-green-500/5' :
                result.level === 'warning' ? 'bg-yellow-500/5' :
                result.level === 'fail' ? 'bg-red-500/5' : 'bg-gray-500/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(result.level)}
                <div>
                  <p className="font-medium text-sm">{result.check_name}</p>
                  <p className="text-xs text-muted-foreground">{result.message}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                result.level === 'pass' ? 'bg-green-500/10 text-green-500' :
                result.level === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                result.level === 'fail' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'
              }`}>
                {result.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-6 text-center">
        數據更新於: {new Date(timestamp).toLocaleString('zh-TW')} • 自動刷新間隔: 60 秒
      </p>
    </div>
  )
}
