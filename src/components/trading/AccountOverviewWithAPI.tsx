'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react'


import { PercentageBadge } from './PercentageBadge'
import { StockPrice } from './StockPrice'

import { cn } from '@/lib/utils'

interface BalanceData {
  cash_balance: number
  available_balance: number
  margin_available: number
  short_available: number
  total_market_value: number
  total_cost: number
  unrealized_pnl: number
  realized_pnl_today: number
  updated_at: string
}

interface ProfitLossData {
  total_realized_pnl: number
  total_unrealized_pnl: number
  total_pnl: number
  total_return_percent: number
  today_realized_pnl: number
  today_unrealized_pnl: number
  updated_at: string
}

interface AccountOverviewWithAPIProps {
  className?: string
}

/**
 * 帳戶總覽卡片 - 接入真實 API
 * 顯示總市值、損益、可用資金等關鍵信息
 */
export function AccountOverviewWithAPI({ className }: AccountOverviewWithAPIProps) {
  // 查詢帳戶餘額
  const { data: balanceData, isLoading: balanceLoading, error: balanceError } = useQuery<{ success: boolean; data: BalanceData }>({
    queryKey: ['account-balance'],
    queryFn: async () => {
      const response = await fetch('/api/trade/balance')
      if (!response.ok) {
        throw new Error('無法取得帳戶餘額')
      }
      return response.json()
    },
    refetchInterval: 30000  // 30秒更新一次
  })

  // 查詢損益資料
  const { data: profitLossData, isLoading: pnlLoading } = useQuery<{ success: boolean; data: ProfitLossData }>({
    queryKey: ['profit-loss'],
    queryFn: async () => {
      const response = await fetch('/api/trade/profit-loss')
      if (!response.ok) {
        throw new Error('無法取得損益資料')
      }
      return response.json()
    },
    refetchInterval: 30000
  })

  // 格式化金額 - 千分位，小數點兩位
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount))
  }

  // 格式化百分比
  const formatPercentage = (pct: number): number => {
    return Math.round(pct * 100) / 100
  }

  const isLoading = balanceLoading || pnlLoading

  if (isLoading) {
    return <AccountOverviewSkeleton className={className} />
  }

  if (balanceError || !balanceData?.success) {
    return (
      <div className={cn(
        'bg-slate-900/50 border border-slate-800 rounded-xl p-6',
        className
      )}>
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="text-blue-400" size={20} />
          <h3 className="text-lg font-semibold text-slate-200">帳戶總覽</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-400">無法載入帳戶資料</p>
          <p className="text-sm text-slate-500 mt-1">請檢查 Shioaji 連線狀態</p>
        </div>
      </div>
    )
  }

  const balance = balanceData.data
  const pnl = profitLossData?.data

  // 計算總資產 (現金 + 持倉市值)
  const totalAssets = balance.cash_balance + balance.total_market_value
  
  // 使用 API 資料或回退到餘額資料
  const unrealizedPnl = pnl?.total_unrealized_pnl || balance.unrealized_pnl
  const unrealizedPnlPct = balance.total_cost > 0 ? (unrealizedPnl / balance.total_cost) * 100 : 0
  const todayRealizedPnl = pnl?.today_realized_pnl || balance.realized_pnl_today

  return (
    <div className={cn(
      'bg-slate-900/50 border border-slate-800 rounded-xl p-6',
      className
    )}>
      {/* 標題 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wallet className="text-blue-400" size={20} />
          <h3 className="text-lg font-semibold text-slate-200">帳戶總覽</h3>
        </div>
        <div className="text-xs text-slate-500">
          更新時間: {new Date(balance.updated_at).toLocaleTimeString('zh-TW')}
        </div>
      </div>

      {/* 主要數據網格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 總資產 */}
        <div className="space-y-2">
          <p className="text-sm text-slate-400">總資產</p>
          <div className="text-2xl font-bold text-slate-100">
            {formatCurrency(totalAssets)}
          </div>
        </div>

        {/* 未實現損益 */}
        <div className="space-y-2">
          <p className="text-sm text-slate-400">未實現損益</p>
          <div className="space-y-1">
            <div className={`text-2xl font-bold ${
              unrealizedPnl >= 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)}
            </div>
            <PercentageBadge value={formatPercentage(unrealizedPnlPct)} size="sm" />
          </div>
        </div>

        {/* 今日已實現損益 */}
        <div className="space-y-2">
          <p className="text-sm text-slate-400">今日已實現</p>
          <div className="flex items-center gap-2">
            {todayRealizedPnl >= 0 ? (
              <TrendingUp className="text-red-400" size={16} />
            ) : (
              <TrendingDown className="text-green-400" size={16} />
            )}
            <div className={`text-xl font-bold ${
              todayRealizedPnl >= 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {todayRealizedPnl >= 0 ? '+' : ''}{formatCurrency(todayRealizedPnl)}
            </div>
          </div>
        </div>

        {/* 可用資金 */}
        <div className="space-y-2">
          <p className="text-sm text-slate-400">可用資金</p>
          <div className="text-xl font-bold text-blue-400">
            {formatCurrency(balance.available_balance)}
          </div>
        </div>
      </div>

      {/* 分隔線 */}
      <div className="border-t border-slate-800 my-6"></div>

      {/* 次要數據 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 現金餘額 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">現金餘額</span>
          <span className="font-mono font-variant-numeric: tabular-nums text-slate-300">
            {formatCurrency(balance.cash_balance)}
          </span>
        </div>

        {/* 持倉市值 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">持倉市值</span>
          <span className="font-mono font-variant-numeric: tabular-nums text-slate-300">
            {formatCurrency(balance.total_market_value)}
          </span>
        </div>

        {/* 總成本 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">持倉成本</span>
          <span className="font-mono font-variant-numeric: tabular-nums text-slate-300">
            {formatCurrency(balance.total_cost)}
          </span>
        </div>
      </div>

      {/* 融資融券資訊 (如果有的話) */}
      {(balance.margin_available > 0 || balance.short_available > 0) && (
        <>
          <div className="border-t border-slate-800 my-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">融資可用</span>
              <span className="font-mono font-variant-numeric: tabular-nums text-slate-300">
                {formatCurrency(balance.margin_available)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">融券可用</span>
              <span className="font-mono font-variant-numeric: tabular-nums text-slate-300">
                {formatCurrency(balance.short_available)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* 總損益指標 */}
      {pnl && (
        <>
          <div className="border-t border-slate-800 my-6"></div>
          <div className="p-4 bg-slate-800/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">總損益</div>
                <div className={`text-lg font-bold ${
                  pnl.total_pnl >= 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {pnl.total_pnl >= 0 ? '+' : ''}{formatCurrency(pnl.total_pnl)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">總報酬率</div>
                <PercentageBadge value={formatPercentage(pnl.total_return_percent)} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* 風險指標 */}
      {balance.margin_available > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <PieChart className="text-yellow-400" size={16} />
            <span className="text-sm text-yellow-400">
              融資可用 - 請注意風險控制
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 載入中的骨架屏
 */
function AccountOverviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse',
      className
    )}>
      {/* 標題骨架 */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-5 bg-slate-700 rounded"></div>
        <div className="w-24 h-5 bg-slate-700 rounded"></div>
      </div>

      {/* 主要數據骨架 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="w-16 h-4 bg-slate-700 rounded"></div>
            <div className="w-20 h-8 bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* 分隔線 */}
      <div className="border-t border-slate-800 my-6"></div>

      {/* 次要數據骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="w-16 h-4 bg-slate-700 rounded"></div>
            <div className="w-20 h-4 bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}