'use client'

import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

import { PercentageBadge } from './PercentageBadge'
import { StockPrice } from './StockPrice'

import { cn } from '@/lib/utils'

interface PositionSummaryData {
  total_cost: number
  total_market_value: number
  total_unrealized_pnl: number
  total_unrealized_pnl_percent: number
  total_positions: number
}

interface PositionSummaryProps {
  data: PositionSummaryData
  isLoading?: boolean
  className?: string
}

/**
 * 持倉總覽組件
 * 顯示總市值、總成本、總損益、損益率
 */
export function PositionSummary({ data, isLoading = false, className }: PositionSummaryProps) {
  if (isLoading) {
    return <PositionSummarySkeleton />
  }

  const {
    total_cost,
    total_market_value,
    total_unrealized_pnl,
    total_unrealized_pnl_percent,
    total_positions
  } = data

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {/* 總市值 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <DollarSign className="text-blue-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400">總市值</h3>
            <p className="text-xl font-bold text-slate-100 font-mono font-variant-numeric: tabular-nums">
              {formatCurrency(total_market_value)}
            </p>
          </div>
        </div>
      </div>

      {/* 總成本 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <BarChart3 className="text-orange-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400">總成本</h3>
            <p className="text-xl font-bold text-slate-100 font-mono font-variant-numeric: tabular-nums">
              {formatCurrency(total_cost)}
            </p>
          </div>
        </div>
      </div>

      {/* 總損益 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            'p-2 rounded-lg',
            total_unrealized_pnl >= 0 ? 'bg-red-500/20' : 'bg-green-500/20'
          )}>
            {total_unrealized_pnl >= 0 ? (
              <TrendingUp className="text-red-400" size={20} />
            ) : (
              <TrendingDown className="text-green-400" size={20} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400">總損益</h3>
            <div className="space-y-1">
              <StockPrice 
                price={Math.abs(total_unrealized_pnl)} 
                change={total_unrealized_pnl}
                showChange={false}
                size="md"
                className="text-xl font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 損益率 & 持股檔數 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            'p-2 rounded-lg',
            total_unrealized_pnl >= 0 ? 'bg-red-500/20' : 'bg-green-500/20'
          )}>
            {total_unrealized_pnl >= 0 ? (
              <TrendingUp className="text-red-400" size={20} />
            ) : (
              <TrendingDown className="text-green-400" size={20} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400">損益率</h3>
            <div className="space-y-1">
              <PercentageBadge 
                value={total_unrealized_pnl_percent} 
                size="md" 
                className="text-lg font-bold"
              />
              <p className="text-xs text-slate-400 font-variant-numeric: tabular-nums">
                {total_positions} 檔持股
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 加載狀態骨架屏
 */
function PositionSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-slate-800 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-slate-800 rounded animate-pulse mb-2" />
              <div className="h-6 bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 格式化金額顯示
 */
function formatCurrency(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}億`
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}萬`
  } else {
    return amount.toLocaleString('zh-TW')
  }
}