'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Area } from 'react-chartjs-2'
import { Activity, Target, AlertTriangle, BookOpen, Zap, RefreshCw, Loader2 } from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DashboardData {
  healthScores: { date: string; score: number; stuckTasks: number }[]
  taskStats: {
    weeklyStats: { week: string; completed: number; total: number; completionRate: number }[]
    dailyStuck: { date: string; stuckRatio: number; stuckCount: number }[]
  }
  agentActivity: {
    dailyActivity: { date: string; totalJobs: number; completedJobs: number; failedJobs: number }[]
    tokenConsumption: { date: string; tokens: number; cost: number }[]
    weeklySummary: { week: string; tokens: number; jobs: number }[]
  }
  learningStats: {
    totalLearnings: number
    weeklyGrowth: { week: string; count: number }[]
    recentLearnings: { name: string; created: string }[]
  }
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#9ca3af',
        font: { size: 11 },
      },
    },
  },
  scales: {
    x: {
      grid: { color: '#374151' },
      ticks: { color: '#9ca3af', font: { size: 10 } },
    },
    y: {
      grid: { color: '#374151' },
      ticks: { color: '#9ca3af', font: { size: 10 } },
    },
  },
}

const darkChartOptions = {
  ...chartOptions,
  plugins: {
    ...chartOptions.plugins,
    legend: {
      ...chartOptions.plugins.legend,
      labels: { color: '#9ca3af' },
    },
  },
}

function LoadingCard({ title }: { title: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        <span className="text-gray-400 text-sm">{title}</span>
      </div>
      <div className="h-48 flex items-center justify-center">
        <span className="text-gray-500">載入中...</span>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: any; trend?: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">{title}</span>
        <Icon className="w-4 h-4 text-blue-400" />
      </div>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && <span className="text-xs text-green-400">{trend}</span>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [healthRes, taskRes, agentRes, learningRes] = await Promise.all([
        fetch('/api/dashboard/health-scores'),
        fetch('/api/dashboard/task-stats'),
        fetch('/api/dashboard/agent-activity'),
        fetch('/api/dashboard/learning-stats'),
      ])

      const [healthData, taskData, agentData, learningData] = await Promise.all([
        healthRes.json(),
        taskRes.json(),
        agentRes.json(),
        learningRes.json(),
      ])

      if (!healthRes.ok || !taskRes.ok || !agentRes.ok || !learningRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      setData({
        healthScores: healthData.data || [],
        taskStats: {
          weeklyStats: taskData.weeklyStats || [],
          dailyStuck: taskData.dailyStuck || [],
        },
        agentActivity: {
          dailyActivity: agentData.dailyActivity || [],
          tokenConsumption: agentData.tokenConsumption || [],
          weeklySummary: agentData.weeklySummary || [],
        },
        learningStats: learningData,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Health Score Trend Chart (Line - Last 30 days)
  const healthScoreData = {
    labels: data?.healthScores.map(d => d.date.slice(5)) || [],
    datasets: [
      {
        label: '健康分數',
        data: data?.healthScores.map(d => d.score) || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // Task Completion Rate Chart (Bar - by week)
  const taskCompletionData = {
    labels: data?.taskStats.weeklyStats.map(d => d.week.slice(5)) || [],
    datasets: [
      {
        label: '完成數',
        data: data?.taskStats.weeklyStats.map(d => d.completed) || [],
        backgroundColor: '#22c55e',
      },
      {
        label: '總數',
        data: data?.taskStats.weeklyStats.map(d => d.total) || [],
        backgroundColor: '#6b7280',
      },
    ],
  }

  // Stuck Task Ratio Chart (Area - by day)
  const stuckTaskData = {
    labels: data?.taskStats.dailyStuck.slice(-14).map(d => d.date.slice(5)) || [],
    datasets: [
      {
        label: 'Stuck 比例 (%)',
        data: data?.taskStats.dailyStuck.slice(-14).map(d => d.stuckRatio) || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // Learning Growth Chart (Line - by week)
  const learningGrowthData = {
    labels: data?.learningStats.weeklyGrowth.map(d => d.week.slice(5)) || [],
    datasets: [
      {
        label: '新增學習',
        data: data?.learningStats.weeklyGrowth.map(d => d.count) || [],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // Token Consumption Chart (Line - by day)
  const tokenConsumptionData = {
    labels: data?.agentActivity.tokenConsumption.slice(-14).map(d => d.date.slice(5)) || [],
    datasets: [
      {
        label: 'Token 消耗',
        data: data?.agentActivity.tokenConsumption.slice(-14).map(d => d.tokens) || [],
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-400 mb-2">載入失敗</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              重試
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">KPI Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">系統健康與任務監控</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="總任務數" 
            value={data?.taskStats.weeklyStats.reduce((a, b) => a + b.total, 0) || 0}
            icon={Target}
          />
          <StatCard 
            title="完成率" 
            value={`${Math.round(data?.taskStats.weeklyStats.reduce((a, b) => a + b.completionRate, 0) / Math.max(data?.taskStats.weeklyStats.length || 1, 1) || 0)}%`}
            icon={Activity}
          />
          <StatCard 
            title="學習文檔" 
            value={data?.learningStats.totalLearnings || 0}
            icon={BookOpen}
          />
          <StatCard 
            title="本週 Token" 
            value={((data?.agentActivity.weeklySummary[data?.agentActivity.weeklySummary.length - 1]?.tokens || 0) / 1000).toFixed(1) + 'K'}
            icon={Zap}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LoadingCard title="健康分數趨勢" />
            <LoadingCard title="任務完成率" />
            <LoadingCard title="Stuck 任務比例" />
            <LoadingCard title="學習數增長" />
            <LoadingCard title="Token 消耗趨勢" />
          </div>
        ) : (
          <>
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Health Score Trend */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">健康分數趨勢 (近30天)</h3>
                <div className="h-64">
                  <Line data={healthScoreData} options={darkChartOptions} />
                </div>
              </div>

              {/* Task Completion Rate */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">任務完成率 (按週)</h3>
                <div className="h-64">
                  <Bar data={taskCompletionData} options={darkChartOptions} />
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stuck Task Ratio */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Stuck 任務比例 (按天)</h3>
                <div className="h-64">
                  <Area data={stuckTaskData} options={darkChartOptions} />
                </div>
              </div>

              {/* Learning Growth */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">學習數增長 (按週)</h3>
                <div className="h-64">
                  <Line data={learningGrowthData} options={darkChartOptions} />
                </div>
              </div>
            </div>

            {/* Token Consumption */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Token 消耗趨勢 (按天)</h3>
              <div className="h-64">
                <Line data={tokenConsumptionData} options={darkChartOptions} />
              </div>
            </div>

            {/* Recent Learnings */}
            {data?.learningStats.recentLearnings && data.learningStats.recentLearnings.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">最近學習</h3>
                <div className="space-y-2">
                  {data.learningStats.recentLearnings.map((learn, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                      <span className="text-gray-300">{learn.name}</span>
                      <span className="text-gray-500 text-sm">{learn.created}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
