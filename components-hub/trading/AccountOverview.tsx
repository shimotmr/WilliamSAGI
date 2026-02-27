'use client'

import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react'

import { cn } from '@/lib/utils'

import { PercentageBadge } from './PercentageBadge'
import { StockPrice } from './StockPrice'

interface AccountData {
  totalValue: number        // 總市值
  totalCost: number        // 總成本
  unrealizedPnl: number    // 未實現損益
  unrealizedPnlPct: number // 未實現損益百分比
  realizedPnl: number      // 已實現損益
  availableCash: number    // 可用資金
  margin: number           // 融資金額
  marginMaintenance: number // 維持保證金
}

interface AccountOverviewProps {
  data: AccountData
  className?: string
}

/**
 * 帳戶總覽卡片
 * 顯示總市值、損益、可用資金等關鍵信息
 */
export function AccountOverview({ data, className }: AccountOverviewProps) {
  const {
    totalValue,
    totalCost,
    unrealizedPnl,
    unrealizedPnlPct,
    realizedPnl,
    availableCash,
    margin,
    marginMaintenance
  } = data

  return (
    <div className={cn(
      'bg-slate-900/50 border border-slate-800 rounded-xl p-6',
      className
    )}>
      {/* 標題 */}
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="text-blue-400" size={20} />
        <h3 className="text-lg font-semibold text-slate-200">帳戶總覽</h3>
      </div>

      {/* 主要數據網格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 總市值 */}
        <div className="space-y-2">
          <p className="text-sm text-slate-400">總市值</p>
          <div className="text-2xl font-bold text-slate-100">
            <StockPrice 
              price={totalValue} 
              showChange={false}
              size="lg"
            />
          </div>
        </div>

        {/* 未實現損益 */}
        <div className="space-y-2">
          <p className="text-sm text-slate-400">未實現損益</p>
          <div className="space-y-1">
            <StockPrice 
              price={Math.abs(unrealizedPnl)} 
              change={unrealizedPnl}
              showChange={false}
              size="lg"
            />
            <PercentageBadge value={unrealizedPnlPct} size="sm" />
          </div>
        </div>

        {/* 已實現損益 */}
        <div className="space-y-2">
          <p className="text-sm text-slate-400">已實現損益</p>
          <div className="flex items-center gap-2">
            {realizedPnl >= 0 ? (
              <TrendingUp className="text-red-400" size={16} />
            ) : (
              <TrendingDown className="text-green-400" size={16} />
            )}
            <StockPrice 
              price={Math.abs(realizedPnl)} 
              change={realizedPnl}
              showChange={false}
              size="md"
            />
          </div>
        </div>

        {/* 可用資金 */}
        <div className="space-y-2">
          <p className="text-sm text-slate-400">可用資金</p>
          <div className="text-xl font-bold text-blue-400">
            {availableCash.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 分隔線 */}
      <div className="border-t border-slate-800 my-6"></div>

      {/* 次要數據 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 總成本 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">總成本</span>
          <span className="font-mono text-slate-300">
            {totalCost.toLocaleString()}
          </span>
        </div>

        {/* 融資金額 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">融資金額</span>
          <span className="font-mono text-slate-300">
            {margin.toLocaleString()}
          </span>
        </div>

        {/* 維持保證金 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">維持保證金</span>
          <span className="font-mono text-slate-300">
            {marginMaintenance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 風險指標 */}
      {margin > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <PieChart className="text-yellow-400" size={16} />
            <span className="text-sm text-yellow-400">
              融資使用中 - 請注意風險控制
            </span>
          </div>
        </div>
      )}
    </div>
  )
}