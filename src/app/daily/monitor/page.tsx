'use client'

import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Zap,
  Gauge,
  RefreshCw,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

interface HealthData {
  current: {
    score: number
    level: string
    factors: {
      token_usage_rate: number
      failed_task_ratio: number
      stuck_task_count: number
      session_stability: number
      response_time: number
    }
  } | null
  previousLevel: string | null
  levelChanged: boolean
  history: Array<{
    score: number
    level: string
    timestamp: string
  }>
}

interface TaskData {
  total: number
  completed: number
  failed: number
  completionRate: number
  failureRate: number
  statusCounts: Record<string, number>
}

interface CostData {
  tokenCost: number
  infraCost: number
  thirdPartyCost: number
  laborCost: number
  totalCost: number
  monthlyBudget?: { used: number; percentage: number }
  dailyBudget?: { used: number; percentage: number }
}

export default function MonitorPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [tasks, setTasks] = useState<TaskData | null>(null)
  const [cost, setCost] = useState<CostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [healthRes, tasksRes, costRes] = await Promise.all([
        fetch('/api/monitor/health'),
        fetch('/api/monitor/tasks'),
        fetch('/api/monitor/cost'),
      ])

      if (healthRes.ok) setHealth(await healthRes.json())
      if (tasksRes.ok) setTasks(await tasksRes.json())
      if (costRes.ok) setCost(await costRes.json())

      setLastUpdate(new Date().toLocaleString('zh-TW'))
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchAllData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchAllData])

  const getHealthColor = (level: string) => {
    switch (level) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getHealthBg = (level: string) => {
    switch (level) {
      case 'healthy': return 'bg-green-500/10 border-green-500/20'
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20'
      case 'critical': return 'bg-red-500/10 border-red-500/20'
      default: return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  const getHealthIcon = (level: string) => {
    switch (level) {
      case 'healthy': return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'warning': return <AlertTriangle className="w-8 h-8 text-yellow-500" />
      case 'critical': return <XCircle className="w-8 h-8 text-red-500" />
      default: return <Gauge className="w-8 h-8 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">系統監控面板</h1>
                <p className="text-xs text-muted-foreground">System Monitoring Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} />
                  更新: {lastUpdate}
                </div>
              )}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  autoRefresh ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'
                }`}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                {autoRefresh ? '自動更新' : '暫停更新'}
              </button>
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="p-2 rounded-lg bg-muted hover:bg-accent transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Health Score Card */}
        <div className={`border rounded-2xl p-6 ${getHealthBg(health?.current?.level || 'unknown')}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {getHealthIcon(health?.current?.level || 'unknown')}
              <div>
                <h2 className="text-3xl font-bold">{health?.current?.score ?? '--'}</h2>
                <p className="text-sm text-muted-foreground">
                  健康分數 Health Score
                  {health?.levelChanged && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-500 text-xs rounded-full">
                      等級變更
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-semibold capitalize ${getHealthColor(health?.current?.level || 'unknown')}`}>
                {health?.current?.level || 'unknown'}
              </div>
              <p className="text-xs text-muted-foreground">
                {health?.previousLevel && `上次: ${health.previousLevel}`}
              </p>
            </div>
          </div>

          {health?.current?.factors && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-border/50">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Token 使用率</div>
                <div className="font-semibold">{health.current.factors.token_usage_rate}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">失敗任務比例</div>
                <div className="font-semibold">{health.current.factors.failed_task_ratio.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">卡住任務數</div>
                <div className="font-semibold">{health.current.factors.stuck_task_count}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Session 穩定度</div>
                <div className="font-semibold">{health.current.factors.session_stability}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">回應時間</div>
                <div className="font-semibold">{health.current.factors.response_time?.toFixed(0) ?? '--'}ms</div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">任務統計</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">總任務</span>
                <span className="text-sm font-semibold">{tasks?.total ?? '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">已完成</span>
                <span className="text-sm font-semibold text-green-500">{tasks?.completed ?? '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">失敗</span>
                <span className="text-sm font-semibold text-red-500">{tasks?.failed ?? '--'}</span>
              </div>
              <div className="pt-2 border-t border-border mt-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">完成率</span>
                  <span className="text-sm font-semibold">{tasks?.completionRate ?? '--'}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">今日成本</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Token</span>
                <span className="text-sm font-semibold">${cost?.tokenCost?.toFixed(2) ?? '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">基礎設施</span>
                <span className="text-sm font-semibold">${cost?.infraCost?.toFixed(2) ?? '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">第三方</span>
                <span className="text-sm font-semibold">${cost?.thirdPartyCost?.toFixed(2) ?? '--'}</span>
              </div>
              <div className="pt-2 border-t border-border mt-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">總計</span>
                  <span className="text-sm font-bold text-green-500">${cost?.totalCost?.toFixed(2) ?? '--'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">預算狀態</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">每日預算</span>
                  <span className={(cost?.dailyBudget?.percentage ?? 0) > 80 ? 'text-red-500' : ''}>
                    {cost?.dailyBudget?.percentage ?? 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (cost?.dailyBudget?.percentage ?? 0) > 80 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(cost?.dailyBudget?.percentage ?? 0, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">每月預算</span>
                  <span className={(cost?.monthlyBudget?.percentage ?? 0) > 80 ? 'text-red-500' : ''}>
                    {cost?.monthlyBudget?.percentage ?? 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (cost?.monthlyBudget?.percentage ?? 0) > 80 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(cost?.monthlyBudget?.percentage ?? 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Pipeline 狀態</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  health?.current?.level === 'healthy' ? 'bg-green-500' :
                  health?.current?.level === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">系統狀態</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">資料同步正常</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                歷史記錄: {health?.history?.length ?? 0} 筆
              </div>
            </div>
          </div>
        </div>

        {/* Health History Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            健康分數趨勢 (近24小時)
          </h3>
          <div className="h-32 flex items-end gap-1">
            {health?.history?.slice(-24).map((item, i) => (
              <div
                key={i}
                className="flex-1 rounded-t transition-all hover:opacity-80 cursor-pointer group relative"
                style={{
                  height: `${item.score}%`,
                  backgroundColor: item.level === 'healthy' ? '#22c55e' : 
                    item.level === 'warning' ? '#eab308' : '#ef4444',
                }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                  {item.score} ({item.level})
                </div>
              </div>
            ))}
            {(!health?.history || health.history.length === 0) && (
              <div className="w-full flex items-center justify-center text-muted-foreground text-sm">
                無歷史數據
              </div>
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>24小時前</span>
            <span>現在</span>
          </div>
        </div>

        {/* Task Status Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            任務狀態分布
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {tasks?.statusCounts && Object.entries(tasks.statusCounts).map(([status, count]) => (
              <div 
                key={status}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs text-muted-foreground truncate">{status}</div>
              </div>
            ))}
            {(!tasks?.statusCounts || Object.keys(tasks.statusCounts).length === 0) && (
              <div className="col-span-full text-center text-muted-foreground text-sm py-8">
                無任務數據
              </div>
            )}
          </div>
        </div>

        {/* Alert Section */}
        {(health?.current?.level === 'critical' || (cost?.dailyBudget?.percentage ?? 0) > 80) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
            <div className="flex2 text-red- items-center gap-500 mb-3">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">警告提醒</span>
            </div>
            <ul className="space-y-1 text-sm">
              {health?.current?.level === 'critical' && (
                <li className="flex items-center gap-2">
                  <XCircle size={14} className="text-red-500" />
                  系統健康分數處於危險等級 ({health.current.score}分)
                </li>
              )}
              {(cost?.dailyBudget?.percentage ?? 0) > 80 && (
                <li className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-yellow-500" />
                  每日預算使用已超過 80%
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
