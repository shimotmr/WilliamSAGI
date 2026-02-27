// ============================================================
// Travis Daily - Real-time Agents Dashboard v2.0
// 實作即時 Agent 狀態監控與工作負載視覺化
// ============================================================
'use client'

import { 
  ArrowLeft, Users, Activity, Zap, Clock, Sparkles, 
  RefreshCw, AlertCircle, TrendingUp, BarChart3,
  Cpu, Calendar, Timer, CheckCircle, Loader2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect, useCallback, useRef } from 'react'

// =============================================================================
// Type Definitions
// =============================================================================
interface Agent {
  id: string
  name: string
  emoji: string
  role: string
  description: string
  color: string
  skills: string[]
  status: 'active' | 'idle' | 'offline' | 'executing'
  statusText: string
  statusColor: string
  pulse: boolean
  lastRunAt: string
  lastStatus: string
  model: string
  quote: string
  isCoordinator: boolean
  taskStats?: {
    executing: number
    completedToday: number
    latestTask: string | null
  } | null
}

interface TaskStats {
  executing: number
  pending: number
  completedToday: number
}

interface ModelUsage {
  todayTokens: number
  yesterdayTokens: number
  weekTokens: number
  estimatedCost: number
  quota: number
  quotaRemaining: number
}

interface AgentsResponse {
  agents: Agent[]
  taskStats: TaskStats
  lastUpdate: string
  gatewayRunning: boolean
  modelUsage: ModelUsage
}

// =============================================================================
// Configuration
// =============================================================================
const POLL_INTERVAL_MS = 15_000 // 15 seconds for real-time updates
const ERROR_RETRY_DELAY_MS = 5_000 // 5 seconds retry on error

// Status color mapping
const statusColors = {
  active: 'bg-green-500',
  executing: 'bg-orange-500',
  idle: 'bg-yellow-500', 
  offline: 'bg-gray-500'
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  HIGH_LOAD: 5,
  MEDIUM_LOAD: 3,
  LOW_LOAD: 1
}

// =============================================================================
// Utility Functions
// =============================================================================
function timeAgo(dateStr: string): string {
  if (!dateStr) return 'Unknown'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

function getSystemLoadLevel(executingTasks: number): 'low' | 'medium' | 'high' {
  if (executingTasks >= PERFORMANCE_THRESHOLDS.HIGH_LOAD) return 'high'
  if (executingTasks >= PERFORMANCE_THRESHOLDS.MEDIUM_LOAD) return 'medium'
  return 'low'
}

// =============================================================================
// Main Component
// =============================================================================
export default function AgentsRealtimePage() {
  const [data, setData] = useState<AgentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [quoteIndex, setQuoteIndex] = useState(0)

  // Refs for cleanup and state persistence
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedAgentRef = useRef<Agent | null>(null)
  
  selectedAgentRef.current = selectedAgent

  // =============================================================================
  // Data Fetching
  // =============================================================================
  const fetchAgents = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    
    try {
      const response = await fetch('/api/agents', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const responseData: AgentsResponse = await response.json()
      
      setData(responseData)
      setError(null)
      setLastUpdated(new Date())
      
      // Update selected agent with fresh data
      const currentSelected = selectedAgentRef.current
      if (currentSelected) {
        const freshAgent = responseData.agents.find(a => a.id === currentSelected.id)
        if (freshAgent) setSelectedAgent(freshAgent)
      }
      
    } catch (err) {
      console.error('[AgentsRealtime] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      
      // Retry logic
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = setTimeout(() => fetchAgents(), ERROR_RETRY_DELAY_MS)
      
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // =============================================================================
  // Lifecycle & Polling
  // =============================================================================
  useEffect(() => {
    // Initial fetch
    fetchAgents()
    
    // Setup polling
    pollingRef.current = setInterval(() => fetchAgents(), POLL_INTERVAL_MS)
    
    // Cleanup
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [fetchAgents])

  // =============================================================================
  // Event Handlers
  // =============================================================================
  const handleAgentSelect = useCallback((agent: Agent) => {
    if (selectedAgent?.id === agent.id) {
      // Cycle through quotes if available
      if (agent.quote) {
        setQuoteIndex(prev => (prev + 1) % 3) // Simple quote cycling
      }
    } else {
      setSelectedAgent(agent)
      setQuoteIndex(0)
    }
  }, [selectedAgent])

  const handleManualRefresh = useCallback(() => {
    fetchAgents(true)
  }, [fetchAgents])

  // =============================================================================
  // Derived State
  // =============================================================================
  const systemStats = React.useMemo(() => {
    if (!data) return null
    
    const { agents, taskStats, gatewayRunning, modelUsage } = data
    const onlineCount = agents.filter(a => a.status === 'active').length
    const executingCount = agents.filter(a => a.status === 'executing').length
    const loadLevel = getSystemLoadLevel(executingCount)
    const quotaUsage = ((modelUsage.quota - modelUsage.quotaRemaining) / modelUsage.quota) * 100
    
    return {
      totalAgents: agents.length,
      onlineCount,
      executingCount,
      loadLevel,
      quotaUsage,
      gatewayRunning,
      completedToday: taskStats.completedToday,
      pendingTasks: taskStats.pending
    }
  }, [data])

  // =============================================================================
  // Loading State
  // =============================================================================
  if (loading && !data) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading agent status...</p>
          </div>
        </div>
      </div>
    )
  }

  // =============================================================================
  // Error State
  // =============================================================================
  if (error && !data) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-4">Failed to load agents</p>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data || !systemStats) return null

  // =============================================================================
  // Main Render
  // =============================================================================
  return (
    <div className="py-6 space-y-6">
      {/* Navigation & Header */}
      <div>
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to feed
        </Link>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                <Activity size={18} className="text-white" />
              </div>
              Real-time Agent Monitor
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Live status dashboard showing AI agents execution, workload, and performance metrics. 
              Updates every {POLL_INTERVAL_MS / 1000} seconds.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/agents/showcase"
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all text-sm font-medium"
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">Showcase</span>
            </Link>
            
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-gray-600 transition-all disabled:opacity-50"
              title="Manual refresh"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline text-sm">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-muted-foreground">Agents</span>
          </div>
          <div className="text-lg font-bold">{systemStats.totalAgents}</div>
          <div className="text-xs text-muted-foreground">
            {systemStats.onlineCount} online
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-orange-500" />
            <span className="text-xs font-medium text-muted-foreground">Active</span>
          </div>
          <div className="text-lg font-bold">{systemStats.executingCount}</div>
          <div className="text-xs text-muted-foreground">
            {systemStats.loadLevel} load
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-xs font-medium text-muted-foreground">Today</span>
          </div>
          <div className="text-lg font-bold">{systemStats.completedToday}</div>
          <div className="text-xs text-muted-foreground">completed</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Timer size={16} className="text-yellow-500" />
            <span className="text-xs font-medium text-muted-foreground">Pending</span>
          </div>
          <div className="text-lg font-bold">{systemStats.pendingTasks}</div>
          <div className="text-xs text-muted-foreground">in queue</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={16} className="text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground">Quota</span>
          </div>
          <div className="text-lg font-bold">{systemStats.quotaUsage.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground">
            {formatNumber(data.modelUsage.quotaRemaining)} left
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className={systemStats.gatewayRunning ? 'text-green-500' : 'text-red-500'} />
            <span className="text-xs font-medium text-muted-foreground">Gateway</span>
          </div>
          <div className="text-lg font-bold">
            {systemStats.gatewayRunning ? 'ON' : 'OFF'}
          </div>
          <div className="text-xs text-muted-foreground">
            {systemStats.gatewayRunning ? 'healthy' : 'offline'}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && data && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <AlertCircle size={12} />
          <span>Connection issues detected. Showing cached data. Retrying...</span>
        </div>
      )}

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.agents.map((agent) => {
          const isSelected = selectedAgent?.id === agent.id
          const isExecuting = agent.status === 'executing'
          const isActive = agent.status === 'active'
          
          return (
            <button
              key={agent.id}
              onClick={() => handleAgentSelect(agent)}
              className={`relative text-left rounded-xl border p-4 transition-all duration-200 group hover:border-gray-600/50 ${
                isSelected 
                  ? 'ring-2 ring-primary/50 border-primary/50 bg-primary/5' 
                  : 'hover:shadow-lg'
              } ${agent.isCoordinator ? 'ring-1 ring-blue-500/30 bg-blue-500/5' : ''}`}
            >
              {/* Coordinator Badge */}
              {agent.isCoordinator && (
                <div className="absolute top-2 right-2 text-xs px-2 py-0.5 bg-blue-500/15 text-blue-500 border border-blue-500/25 rounded-full font-medium">
                  Coordinator
                </div>
              )}

              {/* Status Indicator */}
              <div className="absolute top-4 left-4">
                <div className={`w-3 h-3 rounded-full ${statusColors[agent.status]} ${
                  agent.pulse ? 'animate-pulse' : ''
                }`} />
              </div>

              {/* Agent Info */}
              <div className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{agent.emoji}</div>
                  <div>
                    <h3 className="font-bold text-lg">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.role}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {agent.description}
                </p>

                {/* Status Text */}
                <div className="text-xs font-medium mb-2" style={{ color: agent.color }}>
                  {agent.statusText}
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {agent.skills.slice(0, 3).map(skill => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                  {agent.skills.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                      +{agent.skills.length - 3}
                    </span>
                  )}
                </div>

                {/* Last Activity */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{timeAgo(agent.lastRunAt)}</span>
                  <span className="text-xs opacity-60">{agent.model}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <div className="border border-border rounded-xl p-5 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{selectedAgent.emoji}</div>
              <div>
                <h3 className="font-bold text-xl flex items-center gap-2">
                  {selectedAgent.name}
                  {selectedAgent.isCoordinator && (
                    <span className="text-xs px-2 py-1 bg-blue-500/15 text-blue-500 border border-blue-500/25 rounded-full">
                      Coordinator
                    </span>
                  )}
                </h3>
                <p className="text-muted-foreground">{selectedAgent.role}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedAgent.description}</p>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedAgent(null)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              ✕
            </button>
          </div>

          {/* Quote */}
          {selectedAgent.quote && (
            <div 
              className="rounded-lg p-4 mb-4 cursor-pointer transition-colors hover:bg-muted/30"
              style={{ 
                backgroundColor: `${selectedAgent.color}10`,
                borderLeft: `3px solid ${selectedAgent.color}`
              }}
              onClick={() => handleAgentSelect(selectedAgent)}
            >
              <p className="text-sm italic">「{selectedAgent.quote}」</p>
              <p className="text-xs text-muted-foreground mt-2">
                Click to cycle quotes • Last active: {timeAgo(selectedAgent.lastRunAt)}
              </p>
            </div>
          )}

          {/* Skills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {selectedAgent.skills.map(skill => (
              <div
                key={skill}
                className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground text-center"
              >
                {skill}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>
          Real-time monitoring • Last updated: {lastUpdated?.toLocaleTimeString() || 'Unknown'}
        </p>
        <p>
          Cost: ${data.modelUsage.estimatedCost.toFixed(2)} • 
          Today: {formatNumber(data.modelUsage.todayTokens)} tokens • 
          Week: {formatNumber(data.modelUsage.weekTokens)} tokens
        </p>
      </div>
    </div>
  )
}