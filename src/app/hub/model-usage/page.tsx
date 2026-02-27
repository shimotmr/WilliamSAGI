'use client'

import { ArrowLeft, Activity, DollarSign, Zap, CheckCircle, PieChart, Trophy, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// Types
interface TodayStats {
  total_requests: number
  total_tokens_in: number
  total_tokens_out: number
  total_tokens: number
  total_cost: number
  success_rate: number
}

interface ModelStat {
  name: string
  provider: string
  model: string
  tokens: number
  cost: number
  count: number
}

interface AgentStat {
  agent: string
  total_tokens: number
  total_cost: number
  request_count: number
  success_rate: number
}

interface ModelQuota {
  display_name: string
  usage_percentage: number
  quota_used: number
  quota_limit: number
  status: 'healthy' | 'warning' | 'critical'
  window_type: string
}

interface ApiResponse {
  status: string
  data: {
    today: TodayStats
    modelDistribution: ModelStat[]
    agentRanking: AgentStat[]
  }
  models?: ModelQuota[]
  healthy_count?: number
  warning_count?: number
  critical_count?: number
}

const providerColors: Record<string, string> = {
  anthropic: '#8b5cf6',
  openai: '#10b981',
  minimax: '#f59e0b',
  moonshot: '#06b6d4',
  google: '#3b82f6',
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatCost(num: number): string {
  return '$' + num.toFixed(4)
}

export default function ModelUsageDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Create abort controller for cleanup
    const controller = new AbortController()
    
    // Timeout fallback - ensure loading state is always cleared
    const timeoutId = setTimeout(() => {
      console.log('[ModelUsage] Timeout reached, clearing loading state')
      if (loading) {
        setLoading(false)
        setError('請求超時，請重新整理頁面')
      }
    }, 10000)

    console.log('[ModelUsage] Starting fetch...')
    
    fetch('/api/model-usage', { signal: controller.signal })
      .then(res => {
        console.log('[ModelUsage] Response status:', res.status)
        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`)
        }
        return res.json()
      })
      .then(result => {
        console.log('[ModelUsage] API result:', result)
        clearTimeout(timeoutId)
        
        if (result.status === 'success') {
          setData(result)
          setError(null)
        } else {
          setError(result.error || '載入資料失敗')
        }
      })
      .catch(err => {
        console.error('[ModelUsage] Fetch error:', err)
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') {
          console.log('[ModelUsage] Request was aborted')
          return
        }
        setError(err.message || '網路錯誤')
      })
      .finally(() => {
        console.log('[ModelUsage] Loading complete')
        setLoading(false)
      })
      
    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
        <div className="animate-pulse text-gray-400 mb-4">載入中...</div>
        <div className="text-xs text-gray-600 mb-2">正在載入模型使用資料...</div>
        <button 
          onClick={() => window.location.reload()} 
          className="text-xs text-blue-400 hover:text-white mt-2"
        >
          [Debug] 點擊重新載入
        </button>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">模型使用統計</h1>
        </div>
        <div className="text-red-400 mb-4">錯誤: {error || '無法載入資料'}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          重新載入
        </button>
      </div>
    )
  }

  const { today, modelDistribution, agentRanking } = data?.data || {}
  const models = data?.models || []
  const healthyCount = data?.healthy_count || 0
  const warningCount = data?.warning_count || 0
  const criticalCount = data?.critical_count || 0

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">模型使用統計</h1>
        <span className="text-gray-500 text-sm ml-auto">{new Date().toLocaleDateString('zh-TW')}</span>
      </div>

      {/* Quota Status Overview */}
      {models.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-gray-400" />
            配額使用狀態
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 size={24} className="text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-400">{healthyCount}</div>
                <div className="text-sm text-gray-400">健康 (Healthy)</div>
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={24} className="text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
                <div className="text-sm text-gray-400">警告 (Warning)</div>
              </div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={24} className="text-red-400" />
              <div>
                <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
                <div className="text-sm text-gray-400">緊急 (Critical)</div>
              </div>
            </div>
          </div>

          {/* Model Quota Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {models.map((model, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium truncate">{model.display_name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    model.status === 'critical' ? 'bg-red-500/20 text-red-400' :
                    model.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {model.status === 'critical' ? '緊急' : model.status === 'warning' ? '警告' : '健康'}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1">{model.usage_percentage}%</div>
                <div className="text-xs text-gray-500 mb-3">
                  {model.quota_used.toLocaleString()} / {model.quota_limit.toLocaleString()} tokens
                </div>
                {/* Progress Bar */}
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      model.status === 'critical' ? 'bg-red-500' :
                      model.status === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(model.usage_percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400">{model.window_type} window</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon={<Activity size={20} />}
          label="請求次數"
          value={formatNumber(today?.total_requests || 0)}
          color="blue"
        />
        <StatCard
          icon={<Zap size={20} />}
          label="輸入 Tokens"
          value={formatNumber(today?.total_tokens_in || 0)}
          color="yellow"
        />
        <StatCard
          icon={<Zap size={20} />}
          label="輸出 Tokens"
          value={formatNumber(today?.total_tokens_out || 0)}
          color="orange"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="總 Tokens"
          value={formatNumber(today?.total_tokens || 0)}
          color="green"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="總成本"
          value={formatCost(today?.total_cost || 0)}
          color="emerald"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="成功率"
          value={`${today?.success_rate || 0}%`}
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Model Distribution */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-gray-400" />
            <h2 className="font-semibold">模型消耗分佈</h2>
          </div>
          <div className="space-y-3">
            {modelDistribution?.length === 0 ? (
              <div className="text-gray-500 text-center py-8">今日無資料</div>
            ) : (
              modelDistribution?.map((model, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: providerColors[model.provider] || '#6b7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate">{model.name}</span>
                      <span className="text-sm text-gray-400">{formatCost(model.cost)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatNumber(model.tokens)} tokens</span>
                      <span>{model.count} 次請求</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Agent Ranking */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-yellow-500" />
            <h2 className="font-semibold">Agent 消耗排行</h2>
          </div>
          <div className="space-y-3">
            {agentRanking?.length === 0 ? (
              <div className="text-gray-500 text-center py-8">今日無資料</div>
            ) : (
              agentRanking?.map((agent, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-gray-400/20 text-gray-300' :
                    i === 2 ? 'bg-orange-600/20 text-orange-400' :
                    'bg-gray-700 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate">{agent.agent}</span>
                      <span className="text-sm text-gray-400">{formatCost(agent.total_cost)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatNumber(agent.total_tokens)} tokens</span>
                      <span>{agent.success_rate}% 成功率</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    green: 'text-green-400 bg-green-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  }
  
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}