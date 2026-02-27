'use client'

import { 
  Cpu, Activity, Bell, Users, Clock, AlertTriangle, 
  CheckCircle2, RefreshCw, Wifi, WifiOff, ChevronRight,
  Terminal, Zap, Shield
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

import { BackButton } from '../components/BackButton'
import SystemMonitor from '../components/SystemMonitor'

// ============= Types =============
interface Agent {
  id: number
  name: string
  status: string
  currentTask?: string | null
  activeTasks?: number
  last_active?: string
}

interface BoardTask {
  id: number
  title: string
  status: string
  priority: string
  assignee: string
  updated_at: string
}

interface Alert {
  id: string
  priority: string
  title: string
  message: string
  source_service: string
  is_sent: boolean
  created_at: string
}

interface SystemStatus {
  system: { status: 'healthy' | 'warning' | 'error'; uptime: string }
  sessions: { active: number; total: number; mainAgent: number; subAgents: number }
  storage: { diskUsage: number }
  timestamp: string
}

// ============= Offline Status Hook =============
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => {
      setLastOnline(new Date())
      setIsOnline(true)
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, lastOnline }
}

// ============= API Fetcher =============
async function fetchWithCache(url: string, cacheKey: string, ttl = 30000) {
  const cached = sessionStorage.getItem(cacheKey)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < ttl) return data
  }
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }))
    return data
  } catch {
    return cached ? JSON.parse(cached).data : null
  }
}

// ============= Agent Panel =============
function AgentPanel({ agents, loading, onRefresh }: { 
  agents: Agent[], 
  loading: boolean,
  onRefresh: () => void 
}) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500', 
    offline: 'bg-gray-500'
  }

  const statusLabels: Record<string, string> = {
    active: '工作中',
    idle: '閒置',
    offline: '離線'
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          Agent 活動面板
        </h3>
        <button 
          onClick={onRefresh}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center text-gray-500 py-4">無 Agent 資料</div>
      ) : (
        <div className="space-y-2">
          {agents.slice(0, 6).map((agent) => (
            <div 
              key={agent.id}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-750 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${statusColors[agent.status] || 'bg-gray-500'}`} />
                <span className="text-sm font-medium text-white">{agent.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {agent.activeTasks ? (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                    {agent.activeTasks} 任務
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">{statusLabels[agent.status] || '未知'}</span>
                )}
                <ChevronRight size={14} className="text-gray-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============= Task Panel =============
function TaskPanel({ tasks, loading }: { tasks: BoardTask[], loading: boolean }) {
  const priorityColors: Record<string, string> = {
    P0: 'bg-red-600',
    P1: 'bg-orange-500',
    P2: 'bg-yellow-500',
    P3: 'bg-green-500'
  }

  const statusIcons: Record<string, JSX.Element> = {
    執行中: <Zap size={12} className="text-yellow-400" />,
    待處理: <Clock size={12} className="text-gray-400" />,
    已完成: <CheckCircle2 size={12} className="text-green-400" />
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Terminal size={16} className="text-purple-400" />
          任務狀態追蹤
        </h3>
        <a href="/board" className="text-xs text-blue-400 hover:text-blue-300">
          查看全部 →
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-gray-500 py-4">目前無進行中的任務</div>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 5).map((task) => (
            <div 
              key={task.id}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-750 hover:bg-gray-700/50 transition-colors cursor-pointer"
              onClick={() => window.location.href = `/board?task=${task.id}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {statusIcons[task.status] || statusIcons['待處理']}
                <span className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority] || 'bg-gray-500'}`} />
                <span className="text-sm text-white truncate">{task.title}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{task.assignee || '未指派'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============= Alert Panel =============
function AlertPanel({ alerts, loading }: { alerts: Alert[], loading: boolean }) {
  const priorityConfig: Record<string, { bg: string; text: string; emoji: string }> = {
    P0: { bg: 'bg-red-600', text: 'text-red-400', emoji: '🚨' },
    P1: { bg: 'bg-orange-500', text: 'text-orange-400', emoji: '⚠️' },
    P2: { bg: 'bg-yellow-500', text: 'text-yellow-400', emoji: '💡' },
    P3: { bg: 'bg-green-500', text: 'text-green-400', emoji: 'ℹ️' }
  }

  const unreadCount = alerts.filter(a => !a.is_sent).length

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Bell size={16} className="text-red-400" />
          警報通知中心
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <a href="/alerts" className="text-xs text-blue-400 hover:text-blue-300">
          查看全部 →
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center text-gray-500 py-4">目前無警報</div>
      ) : (
        <div className="space-y-2">
          {alerts.slice(0, 5).map((alert) => {
            const config = priorityConfig[alert.priority] || priorityConfig.P3
            return (
              <div 
                key={alert.id}
                className={`p-2 rounded-lg bg-gray-750 hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  !alert.is_sent ? 'border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{config.emoji}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${config.bg} text-white`}>
                    {alert.priority}
                  </span>
                  <span className="text-sm text-white truncate flex-1">{alert.title}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 ml-6">
                  {new Date(alert.created_at).toLocaleString('zh-TW')}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============= Main War Room Page =============
export default function WarRoomPage() {
  const { isOnline, lastOnline } = useOnlineStatus()
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<BoardTask[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [agentsData, tasksData, alertsData] = await Promise.all([
        fetchWithCache('/api/agents', 'warroom-agents', 15000),
        fetch('/api/board/status').then(r => r.json()).catch(() => ({ tasks: [] })),
        fetch('/api/alerts?limit=20').then(r => r.json()).catch(() => ({ alerts: [] }))
      ])
      
      setAgents(agentsData || [])
      setTasks(tasksData.tasks?.filter((t: BoardTask) => t.status === '執行中') || [])
      setAlerts(alertsData.alerts || [])
    } catch (e) {
      console.error('Failed to fetch warroom data:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    sessionStorage.removeItem('warroom-agents')
    await fetchData()
    setRefreshing(false)
  }

  // Calculate stats
  const activeAgents = agents.filter(a => a.status === 'active').length
  const executingTasks = tasks.filter(t => t.status === '執行中').length
  const criticalAlerts = alerts.filter(a => a.priority === 'P0' && !a.is_sent).length

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Shield size={28} className="text-indigo-400" />
              戰情室
              {!isOnline && <span className="text-sm bg-yellow-600 px-2 py-1 rounded">離線模式</span>}
            </h1>
            <p className="text-gray-400 mt-1">即時系統監控與任務調度中心</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Online Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isOnline ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
            }`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="text-xs font-medium">
                {isOnline ? '在線' : '離線'}
              </span>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || !isOnline}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span className="text-sm">重新整理</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <Activity size={18} className="text-green-400" />
              <span className="text-xs text-gray-400">運行狀態</span>
            </div>
            <div className="text-xl font-bold text-green-400 mt-1">
              {isOnline ? '正常' : '離線'}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <Users size={18} className="text-blue-400" />
              <span className="text-xs text-gray-400">活躍 Agent</span>
            </div>
            <div className="text-xl font-bold text-blue-400 mt-1">
              {activeAgents} / {agents.length}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <Terminal size={18} className="text-purple-400" />
              <span className="text-xs text-gray-400">執行中任務</span>
            </div>
            <div className="text-xl font-bold text-purple-400 mt-1">
              {executingTasks}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <AlertTriangle size={18} className="text-red-400" />
              <span className="text-xs text-gray-400">待處理警報</span>
            </div>
            <div className="text-xl font-bold text-red-400 mt-1">
              {criticalAlerts}
            </div>
          </div>
        </div>

        {/* System Monitor - Full Width */}
        <div className="mb-6">
          <SystemMonitor />
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AgentPanel 
            agents={agents} 
            loading={loading} 
            onRefresh={handleRefresh}
          />
          <TaskPanel 
            tasks={tasks} 
            loading={loading} 
          />
          <AlertPanel 
            alerts={alerts} 
            loading={loading} 
          />
        </div>

        {/* Last Updated */}
        <div className="mt-6 text-center text-xs text-gray-500">
          最後更新：{new Date().toLocaleString('zh-TW')} · 自動刷新間隔：15秒
          {!isOnline && lastOnline && (
            <span className="ml-2">（離線時間：{lastOnline.toLocaleTimeString('zh-TW')}）</span>
          )}
        </div>
      </div>
    </div>
  )
}

// War Room - Real-time System Monitoring & Task Command Center
// PWA Optimized with Offline Support
