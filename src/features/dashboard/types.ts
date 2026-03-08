export interface DashboardAgent {
// 🔒 AUDIT: 2026-03-08 | score=100/100 | full-audit
  name: string
  role: string
  color?: string
  emoji?: string
  total?: number
  completed: number
  todayCompleted?: number
  successRate: number
  currentTask?: string | null
  isActive: boolean
}

export interface DashboardTask {
  id?: number
  title: string
  assignee: string
  completedAt?: string
  updatedAt?: string
}

export interface ModelUsageStats {
  name: string
  provider: string
  tokens: number
  cost: number
  count: number
}

export interface DashboardTokenTrendItem {
  date: string
  tokens: number
  cost?: number
}

export interface DashboardData {
  statusCounts: Record<string, number>
  totalTasks: number
  weekCompleted: number
  completionRate: number
  agents: DashboardAgent[]
  recentCompleted: DashboardTask[]
  runningTasks: DashboardTask[]
  tokenTrend: DashboardTokenTrendItem[]
  modelUsage: ModelUsageStats[]
}
