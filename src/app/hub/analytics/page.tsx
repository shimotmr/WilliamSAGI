'use client'

import { ArrowLeft, Activity, DollarSign, Zap, BarChart3, TrendingUp, Clock, RefreshCw, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area 
} from 'recharts'

// Types
interface Summary {
  totalTokens: number
  totalCost: number
  totalRequests: number
  avgTokensPerRequest: number
}

interface RollingWindow {
  current: number
  limit: number
  percentage: number
  cost: number
}

interface ProviderData {
  provider: string
  tokens: number
  cost: number
  count: number
}

interface ModelData {
  name: string
  tokens: number
  cost: number
  count: number
  provider: string
}

interface AgentData {
  agent: string
  tokens: number
  cost: number
  count: number
}

interface TrendPoint {
  date?: string
  week?: string
  month?: string
  tokens: number
  cost: number
  requests: number
}

interface ApiResponse {
  status: string
  data: {
    summary: Summary
    rollingWindow: RollingWindow
    byProvider: ProviderData[]
    byModel: ModelData[]
    byAgent: AgentData[]
    dailyTrend: TrendPoint[]
    weeklyTrend: TrendPoint[]
    monthlyTrend: TrendPoint[]
  }
  period: string
  timestamp: string
}

const providerColors: Record<string, string> = {
  anthropic: '#8b5cf6',
  openai: '#10b981',
  minimax: '#f59e0b',
  moonshot: '#06b6d4',
  google: '#3b82f6',
  deepseek: '#6366f1',
  unknown: '#6b7280',
}

const agentColors: Record<string, string> = {
  coder: '#8b5cf6',
  designer: '#ec4899',
  architect: '#06b6d4',
  writer: '#10b981',
  researcher: '#f59e0b',
  default: '#6b7280',
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatCost(num: number): string {
  return '$' + num.toFixed(4)
}

function formatFullCost(num: number): string {
  if (num >= 1000) return '$' + (num / 1000).toFixed(2) + 'K'
  return '$' + num.toFixed(4)
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('7d')
  const [activeTab, setActiveTab] = useState<'provider' | 'model' | 'agent'>('provider')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(`/api/analytics?period=${period}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.status === 'success') {
        setData(result)
        setError(null)
      } else {
        setError(result.error || '載入資料失敗')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : '網路錯誤')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchData()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
        <div className="animate-pulse text-gray-400 mb-4">載入中...</div>
        <div className="text-xs text-gray-600 mb-2">正在載入 Token 消耗分析資料...</div>
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
          <h1 className="text-2xl font-bold">Token 消耗分析</h1>
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

  const { summary, rollingWindow, byProvider, byModel, byAgent, dailyTrend, weeklyTrend, monthlyTrend } = data.data

  // Get trend data based on period
  const getTrendData = () => {
    if (period === '24h') return dailyTrend
    if (period === '7d') return weeklyTrend
    return monthlyTrend
  }

  const trendData = getTrendData()

  // Prepare bar chart data based on active tab
  const getBarData = () => {
    if (activeTab === 'provider') {
      return byProvider.map(item => ({
        name: item.provider,
        tokens: item.tokens,
        cost: item.cost,
        count: item.count,
      }))
    } else if (activeTab === 'model') {
      return byModel.slice(0, 10).map(item => ({
        name: item.name.split('/')[1] || item.name,
        fullName: item.name,
        tokens: item.tokens,
        cost: item.cost,
        count: item.count,
        provider: item.provider,
      }))
    } else {
      return byAgent.map(item => ({
        name: item.agent,
        tokens: item.tokens,
        cost: item.cost,
        count: item.count,
      }))
    }
  }

  const barData = getBarData()

  // Format trend data for line chart
  const lineChartData = trendData.map(item => ({
    name: item.date || item.week || item.month,
    tokens: item.tokens,
    cost: item.cost,
    requests: item.requests,
  }))

  // Rolling window status color
  const getRollingStatus = () => {
    if (rollingWindow.percentage < 50) return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: '✓' }
    if (rollingWindow.percentage < 80) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '⚠' }
    return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '✕' }
  }
  const rollingStatus = getRollingStatus()

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">Token 消耗分析</h1>
          <span className="text-gray-500 text-sm ml-2">{new Date().toLocaleDateString('zh-TW')}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
            {['24h', '7d', '30d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  period === p 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {p === '24h' ? '24小時' : p === '7d' ? '7天' : '30天'}
              </button>
            ))}
          </div>
          
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg border transition-colors ${
              autoRefresh 
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                : 'bg-gray-900 border-gray-800 text-gray-400'
            }`}
            title={autoRefresh ? '自動刷新已開啟 (30秒)' : '自動刷新已關閉'}
          >
            <RefreshCw size={18} className={autoRefresh ? 'animate-spin-slow' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Activity size={20} />}
          label="總 Tokens"
          value={formatNumber(summary.totalTokens)}
          subValue={`${summary.totalRequests} 次請求`}
          color="blue"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="總成本"
          value={formatFullCost(summary.totalCost)}
          subValue={`平均 $${(summary.totalCost / Math.max(summary.totalRequests, 1)).toFixed(4)}/請求`}
          color="emerald"
        />
        <StatCard
          icon={<Zap size={20} />}
          label="平均 Tokens/請求"
          value={formatNumber(summary.avgTokensPerRequest)}
          color="yellow"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="數據點"
          value={String(trendData.length)}
          subValue={period === '24h' ? '小時' : period === '7d' ? '週' : '月'}
          color="purple"
        />
      </div>

      {/* 5-Hour Rolling Window Monitor */}
      <div className={`mb-8 rounded-xl p-5 border ${rollingStatus.bg} ${rollingStatus.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock size={20} className={rollingStatus.color} />
            <h2 className="font-semibold text-lg">5小時 Rolling Window 監控</h2>
            <span className={`text-xs px-2 py-1 rounded ${rollingStatus.bg} ${rollingStatus.color} border ${rollingStatus.border}`}>
              {rollingStatus.icon} {rollingWindow.percentage}%
            </span>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${rollingStatus.color}`}>
              {formatNumber(rollingWindow.current)}
            </div>
            <div className="text-xs text-gray-400">
              / {formatNumber(rollingWindow.limit)} tokens
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              rollingWindow.percentage < 50 ? 'bg-green-500' :
              rollingWindow.percentage < 80 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(rollingWindow.percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>0</span>
          <span>{formatNumber(rollingWindow.limit * 0.25)}</span>
          <span>{formatNumber(rollingWindow.limit * 0.5)}</span>
          <span>{formatNumber(rollingWindow.limit * 0.75)}</span>
          <span>{formatNumber(rollingWindow.limit)}</span>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-sm">
          <span className="text-gray-400">目前窗口成本估算:</span>
          <span className="font-semibold text-yellow-400">{formatCost(rollingWindow.cost)}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart - Grouped by */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-gray-400" />
              <h2 className="font-semibold">消耗分佈</h2>
            </div>
            
            {/* Tab Selector */}
            <div className="flex bg-gray-800 rounded-lg p-0.5">
              {(['provider', 'model', 'agent'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    activeTab === tab 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'provider' ? 'Provider' : tab === 'model' ? 'Model' : 'Agent'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <YAxis 
                  type="category" 
                  dataKey={activeTab === 'model' ? 'name' : activeTab === 'provider' ? 'name' : 'name'} 
                  stroke="#9CA3AF" 
                  fontSize={11}
                  width={80}
                  tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [formatNumber(Number(value)) + ' tokens', 'Tokens']}
                  labelFormatter={(label) => String(label)}
                />
                <Bar 
                  dataKey="tokens" 
                  fill="#8B5CF6"
                  radius={[0, 4, 4, 0]}
                  name="tokens"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Line Chart */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-gray-400" />
            <h2 className="font-semibold">
              {period === '24h' ? '小時趨勢' : period === '7d' ? '週趨勢' : '月趨勢'}
            </h2>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={11}
                  interval={Math.floor(lineChartData.length / 6)}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickFormatter={(value) => formatNumber(value)}
                  yAxisId="left"
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickFormatter={(value) => '$' + value.toFixed(2)}
                  orientation="right"
                  yAxisId="right"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value, name) => [
                    name === 'tokens' ? formatNumber(Number(value)) + ' tokens' : '$' + Number(value).toFixed(4),
                    name === 'tokens' ? 'Tokens' : 'Cost'
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="tokens"
                  stroke="#8B5CF6"
                  fillOpacity={1}
                  fill="url(#colorTokens)"
                  name="tokens"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorCost)"
                  name="cost"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Table */}
      <div className="mt-6 bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={18} className="text-gray-400" />
          <h2 className="font-semibold">成本明細</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* By Provider */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">By Provider</h3>
            <div className="space-y-2">
              {byProvider.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: providerColors[item.provider] || '#6b7280' }}
                    />
                    <span className="text-sm">{item.provider}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCost(item.cost)}</span>
                </div>
              ))}
              {byProvider.length === 0 && (
                <div className="text-gray-500 text-sm">無資料</div>
              )}
            </div>
          </div>

          {/* By Model */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">By Model (Top 5)</h3>
            <div className="space-y-2">
              {byModel.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[120px]" title={item.name}>
                    {item.name.split('/')[1] || item.name}
                  </span>
                  <span className="text-sm font-medium">{formatCost(item.cost)}</span>
                </div>
              ))}
              {byModel.length === 0 && (
                <div className="text-gray-500 text-sm">無資料</div>
              )}
            </div>
          </div>

          {/* By Agent */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">By Agent</h3>
            <div className="space-y-2">
              {byAgent.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: agentColors[item.agent] || agentColors.default }}
                    />
                    <span className="text-sm">{item.agent}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCost(item.cost)}</span>
                </div>
              ))}
              {byAgent.length === 0 && (
                <div className="text-gray-500 text-sm">無資料</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-6 text-center text-xs text-gray-600">
        最後更新: {new Date(data.timestamp).toLocaleString('zh-TW')} • 
        自動刷新: {autoRefresh ? '開啟 (30秒)' : '關閉'}
      </div>
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subValue,
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subValue?: string;
  color: string 
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
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
      {subValue && <div className="text-xs text-gray-600 mt-1">{subValue}</div>}
    </div>
  )
}
