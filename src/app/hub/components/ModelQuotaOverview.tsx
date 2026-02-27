'use client'

// Deployment trigger: Force Vercel redeploy
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js'
import { TrendingUp, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Model colors
const modelColors: Record<string, string> = {
  'anthropic': '#8b5cf6', // purple
  'openai': '#10b981', // green
  'minimax': '#f59e0b', // orange
  'moonshot': '#06b6d4', // cyan
  'google': '#3b82f6', // blue
}

interface ModelData {
  model_provider: string
  model_id: string
  display_name: string
  current_usage: number
  quota_limit: number
  usage_percentage: number
  status: 'green' | 'yellow' | 'red'
  quota_type: string
  quota_window_hours: number
}

interface SummaryData {
  total_models: number
  models_at_risk: number
  models_warning: number
  last_updated: string
}

interface ApiResponse {
  status: string
  data: {
    summary: SummaryData
    models: ModelData[]
  }
}

function getStatusColor(status: 'green' | 'yellow' | 'red'): string {
  switch (status) {
    case 'green': return '#4ade80'
    case 'yellow': return '#facc15'
    case 'red': return '#ef4444'
  }
}

function getStatusBg(status: 'green' | 'yellow' | 'red'): string {
  switch (status) {
    case 'green': return 'rgba(74, 222, 128, 0.1)'
    case 'yellow': return 'rgba(250, 204, 21, 0.1)'
    case 'red': return 'rgba(239, 68, 68, 0.1)'
  }
}

function getModelColor(provider: string): string {
  return modelColors[provider] || '#6b7280'
}

function getModelIcon(provider: string): string {
  switch (provider) {
    case 'anthropic': return 'C'
    case 'openai': return 'O'
    case 'minimax': return 'M'
    case 'moonshot': return 'K'
    case 'google': return 'G'
    default: return '?'
  }
}

export default function ModelQuotaOverview() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/model-usage/summary')
      const json = await res.json()
      if (json.status === 'success') {
        setData(json)
        setError(null)
      } else {
        setError(json.error || 'Failed to fetch')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} /> 模型額度總覽
          </h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} /> 模型額度總覽
          </h2>
          <button onClick={fetchData} className="text-foreground-muted hover:text-foreground">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="text-center text-red-400 py-8">載入失敗: {error}</div>
      </section>
    )
  }

  const { summary, models } = data.data

  return (
    <section className="mb-8">
      {/* Header with status summary */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={14} /> 模型額度總覽
        </h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-foreground-muted">
              {models.filter(m => m.status === 'green').length} healthy
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-foreground-muted">
              {models.filter(m => m.status === 'yellow').length} warning
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-foreground-muted">
              {models.filter(m => m.status === 'red').length} critical
            </span>
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {models.map((model) => {
          const statusColor = getStatusColor(model.status)
          const progressWidth = Math.min(model.usage_percentage, 100)
          const modelColor = getModelColor(model.model_provider)
          
          return (
            <div
              key={`${model.model_provider}:${model.model_id}`}
              className="group rounded-xl border p-4 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
              style={{
                borderColor: `${statusColor}30`,
                background: `linear-gradient(135deg, ${getStatusBg(model.status)} 0%, rgba(30,41,59,0.5) 100%)`,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ background: modelColor }}
                  >
                    {getModelIcon(model.model_provider)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate max-w-[120px]">
                      {model.display_name}
                    </div>
                    <div className="text-[10px] text-foreground-subtle">
                      {model.quota_type} • {model.quota_window_hours}h window
                    </div>
                  </div>
                </div>
                
                {/* Status + Percentage */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: statusColor }}>
                      {model.usage_percentage}%
                    </div>
                    <div className="text-[10px] text-foreground-subtle">
                      {model.current_usage.toLocaleString()} / {model.quota_limit.toLocaleString()}
                    </div>
                  </div>
                  <div className="relative">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: statusColor }}
                    />
                    {model.status === 'green' && (
                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-40"
                           style={{ background: statusColor }} />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${progressWidth}%`,
                    background: `linear-gradient(90deg, ${statusColor}, ${statusColor}CC)`
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Last updated */}
      <div className="mt-3 text-xs text-foreground-subtle text-right">
        Last updated: {new Date(summary.last_updated).toLocaleString('zh-TW')}
      </div>
    </section>
  )
}
