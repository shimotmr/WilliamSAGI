'use client'

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
} from 'chart.js'
import { LineChart, TrendingUp } from 'lucide-react'
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

interface DataPoint {
  date: string
  tokens: number
  tokens_in: number
  tokens_out: number
  prompts: number
  cost: number
}

interface TrendModel {
  model_provider: string
  model_id: string
  display_name: string
  data_points: DataPoint[]
  total_tokens: number
  total_prompts: number
  total_cost: number
  average_daily: number
  trend_direction: 'increasing' | 'decreasing' | 'stable'
}

interface ApiResponse {
  status: string
  data: {
    period: string
    granularity: string
    trends: TrendModel[]
  }
}

function getModelColor(provider: string): string {
  return modelColors[provider] || '#6b7280'
}

function getTrendIcon(direction: 'increasing' | 'decreasing' | 'stable'): string {
  switch (direction) {
    case 'increasing': return '↗'
    case 'decreasing': return '↘'
    default: return '→'
  }
}

function getTrendColor(direction: 'increasing' | 'decreasing' | 'stable'): string {
  switch (direction) {
    case 'increasing': return '#ef4444'
    case 'decreasing': return '#10b981'
    default: return '#6b7280'
  }
}

export default function ModelTrendChart() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/model-usage/trend?days=${days}`)
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
  }, [days])

  // Prepare chart data
  const chartData = data ? {
    labels: data.data.trends[0]?.data_points.map(d => {
      const date = new Date(d.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }) || [],
    datasets: data.data.trends.map((model, idx) => ({
      label: model.display_name,
      data: model.data_points.map(d => d.tokens),
      borderColor: getModelColor(model.model_provider),
      backgroundColor: `${getModelColor(model.model_provider)}20`,
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 2,
      pointHoverBorderColor: '#1e293b',
      pointHoverBackgroundColor: getModelColor(model.model_provider),
    })),
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: function(context: any[]) {
            return context[0]?.label || ''
          },
          label: function(context: any) {
            const value = context.parsed.y
            return `${context.dataset.label}: ${value.toLocaleString()} tokens`
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: '#334155',
          borderColor: '#334155',
        },
        ticks: {
          color: '#94a3b8',
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#334155',
          borderColor: '#334155',
        },
        ticks: {
          color: '#94a3b8',
          callback: function(value: any) {
            if (typeof value === 'number') {
              return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
            }
            return value
          }
        },
      },
    },
  }

  if (loading && !data) {
    return (
      <section className="mb-8">
        <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
              <LineChart size={14} /> 使用趨勢
            </h2>
          </div>
          <div className="flex items-center justify-center h-[300px]">
            <div className="w-8 h-8 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="mb-8">
        <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
              <LineChart size={14} /> 使用趨勢
            </h2>
            <button onClick={fetchData} className="text-foreground-muted hover:text-foreground text-xs">
              Retry
            </button>
          </div>
          <div className="text-center text-red-400 py-8">載入失敗: {error}</div>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
            <LineChart size={14} /> 使用趨勢 - {days}天
          </h2>
          
          {/* Time range selector */}
          <div className="flex rounded border border-border overflow-hidden">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  days === d
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-transparent text-foreground-muted hover:bg-slate-700'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          {chartData && <Line data={chartData} options={chartOptions} />}
        </div>

        {/* Legend + Stats */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.data.trends.map((model) => {
              const color = getModelColor(model.model_provider)
              return (
                <div key={`${model.model_provider}:${model.model_id}`} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ background: color }} 
                    />
                    <span className="text-xs text-foreground-muted truncate max-w-[100px]">
                      {model.display_name}
                    </span>
                  </div>
                  <div className="text-lg font-bold" style={{ color }}>
                    {model.total_tokens.toLocaleString()}
                  </div>
                  <div 
                    className="text-[10px]"
                    style={{ color: getTrendColor(model.trend_direction) }}
                  >
                    {getTrendIcon(model.trend_direction)} {model.trend_direction}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
