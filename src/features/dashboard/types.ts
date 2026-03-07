export interface DashboardAgent {
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
}
