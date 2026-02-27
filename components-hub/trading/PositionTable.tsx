'use client'

import { ChevronUp, ChevronDown, TrendingUp, BarChart3, ShoppingCart, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'

import { PercentageBadge } from './PercentageBadge'
import { StockPrice } from './StockPrice'

import { cn } from '@/lib/utils'

export interface Position {
  symbol: string
  symbol_name: string
  quantity: number
  avg_cost: number
  current_price: number
  market_value: number
  cost_basis: number
  unrealized_pnl: number
  unrealized_pnl_percent: number
  updated_at: string
}

type SortField = 'symbol' | 'market_value' | 'unrealized_pnl' | 'unrealized_pnl_percent'
type SortDirection = 'asc' | 'desc'

interface PositionTableProps {
  positions: Position[]
  isLoading?: boolean
  className?: string
  onSellClick?: (symbol: string) => void
  onBuyClick?: (symbol: string) => void
}

/**
 * 持倉明細表格組件
 * 包含排序功能，支持按損益、市值、代號排序
 */
export function PositionTable({ 
  positions, 
  isLoading = false, 
  className,
  onSellClick,
  onBuyClick
}: PositionTableProps) {
  const [sortField, setSortField] = useState<SortField>('market_value')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // 排序處理
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc') // 默認降序
    }
  }

  // 排序後的持倉數據
  const sortedPositions = [...positions].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortField) {
      case 'symbol':
        aValue = a.symbol
        bValue = b.symbol
        break
      case 'market_value':
        aValue = a.market_value
        bValue = b.market_value
        break
      case 'unrealized_pnl':
        aValue = a.unrealized_pnl
        bValue = b.unrealized_pnl
        break
      case 'unrealized_pnl_percent':
        aValue = a.unrealized_pnl_percent
        bValue = b.unrealized_pnl_percent
        break
      default:
        aValue = a.market_value
        bValue = b.market_value
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  if (isLoading) {
    return <PositionTableSkeleton />
  }

  if (positions.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">目前沒有持倉</h3>
          <p className="text-slate-500">開始投資，建立您的第一筆持倉</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden', className)}>
      {/* 桌面版表格 */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/30">
              <SortableHeader
                field="symbol"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                className="text-left px-6 py-4"
              >
                股票代號
              </SortableHeader>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">數量</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">成本價</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">現價</th>
              <SortableHeader
                field="market_value"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                className="text-right px-6 py-4"
              >
                市值
              </SortableHeader>
              <SortableHeader
                field="unrealized_pnl"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                className="text-right px-6 py-4"
              >
                損益
              </SortableHeader>
              <SortableHeader
                field="unrealized_pnl_percent"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                className="text-right px-6 py-4"
              >
                損益率
              </SortableHeader>
              <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedPositions.map((position) => (
              <PositionTableRow
                key={position.symbol}
                position={position}
                onSellClick={onSellClick}
                onBuyClick={onBuyClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* 手機版卡片列表 */}
      <div className="lg:hidden divide-y divide-slate-800">
        {sortedPositions.map((position) => (
          <PositionMobileCard
            key={position.symbol}
            position={position}
            onSellClick={onSellClick}
            onBuyClick={onBuyClick}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * 可排序的表頭組件
 */
function SortableHeader({
  field,
  currentField,
  direction,
  onSort,
  children,
  className
}: {
  field: SortField
  currentField: SortField
  direction: SortDirection
  onSort: (field: SortField) => void
  children: React.ReactNode
  className?: string
}) {
  const isActive = currentField === field
  
  return (
    <th className={cn(className)}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors group"
      >
        {children}
        <div className="flex flex-col">
          {isActive ? (
            direction === 'asc' ? (
              <ChevronUp size={14} className="text-slate-300" />
            ) : (
              <ChevronDown size={14} className="text-slate-300" />
            )
          ) : (
            <ArrowUpDown size={14} className="text-slate-600 group-hover:text-slate-400" />
          )}
        </div>
      </button>
    </th>
  )
}

/**
 * 桌面版表格行組件
 */
function PositionTableRow({ 
  position, 
  onSellClick, 
  onBuyClick 
}: {
  position: Position
  onSellClick?: (symbol: string) => void
  onBuyClick?: (symbol: string) => void
}) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors">
      <td className="px-6 py-4">
        <div>
          <div className="font-mono font-variant-numeric: tabular-nums font-bold text-slate-100">{position.symbol}</div>
          <div className="text-sm text-slate-400">{position.symbol_name}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="font-mono font-variant-numeric: tabular-nums text-slate-300">
          {position.quantity.toLocaleString()} 張
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="font-mono font-variant-numeric: tabular-nums text-slate-400">
          {position.avg_cost.toFixed(2)}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <StockPrice 
          price={position.current_price}
          change={position.current_price - position.avg_cost}
          showChange={false}
          size="sm"
        />
      </td>
      <td className="px-6 py-4 text-right">
        <span className="font-mono font-variant-numeric: tabular-nums font-semibold text-slate-100">
          {formatCurrency(position.market_value)}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="space-y-1">
          <StockPrice 
            price={Math.abs(position.unrealized_pnl)}
            change={position.unrealized_pnl}
            showChange={false}
            size="sm"
          />
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <PercentageBadge value={position.unrealized_pnl_percent} size="sm" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => onBuyClick?.(position.symbol)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
          >
            <TrendingUp size={12} />
            買
          </button>
          <button 
            onClick={() => onSellClick?.(position.symbol)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
          >
            <ShoppingCart size={12} />
            賣
          </button>
        </div>
      </td>
    </tr>
  )
}

/**
 * 手機版卡片組件
 */
function PositionMobileCard({ 
  position, 
  onSellClick, 
  onBuyClick 
}: {
  position: Position
  onSellClick?: (symbol: string) => void
  onBuyClick?: (symbol: string) => void
}) {
  return (
    <div className="p-4 space-y-4">
      {/* 標題行 */}
      <div className="flex justify-between items-start">
        <div>
          <div className="font-mono font-variant-numeric: tabular-nums font-bold text-slate-100 text-lg">{position.symbol}</div>
          <div className="text-sm text-slate-400">{position.symbol_name}</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-variant-numeric: tabular-nums font-semibold text-slate-100">
            {formatCurrency(position.market_value)}
          </div>
          <div className="text-sm text-slate-400">市值</div>
        </div>
      </div>

      {/* 數據行 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-slate-400">數量</div>
          <div className="font-mono font-variant-numeric: tabular-nums text-slate-300">{position.quantity.toLocaleString()} 張</div>
        </div>
        <div>
          <div className="text-slate-400">成本價</div>
          <div className="font-mono font-variant-numeric: tabular-nums text-slate-300">{position.avg_cost.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-slate-400">現價</div>
          <StockPrice 
            price={position.current_price}
            change={position.current_price - position.avg_cost}
            showChange={false}
            size="sm"
          />
        </div>
        <div>
          <div className="text-slate-400">損益率</div>
          <PercentageBadge value={position.unrealized_pnl_percent} size="sm" />
        </div>
      </div>

      {/* 損益行 */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-slate-400 text-sm">未實現損益</div>
          <StockPrice 
            price={Math.abs(position.unrealized_pnl)}
            change={position.unrealized_pnl}
            showChange={false}
            size="sm"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onBuyClick?.(position.symbol)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
          >
            <TrendingUp size={14} />
            買進
          </button>
          <button 
            onClick={() => onSellClick?.(position.symbol)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
          >
            <ShoppingCart size={14} />
            賣出
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 加載骨架屏
 */
function PositionTableSkeleton() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/30">
              <th className="text-left px-6 py-4">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-16" />
              </th>
              <th className="text-right px-6 py-4">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-12 ml-auto" />
              </th>
              <th className="text-right px-6 py-4">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-16 ml-auto" />
              </th>
              <th className="text-right px-6 py-4">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-12 ml-auto" />
              </th>
              <th className="text-right px-6 py-4">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-12 ml-auto" />
              </th>
              <th className="text-right px-6 py-4">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-12 ml-auto" />
              </th>
              <th className="text-right px-6 py-4">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-16 ml-auto" />
              </th>
              <th className="text-center px-6 py-4">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-12 mx-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-slate-800">
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-800 rounded animate-pulse w-16" />
                    <div className="h-3 bg-slate-800 rounded animate-pulse w-20" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-800 rounded animate-pulse w-16 ml-auto" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-800 rounded animate-pulse w-16 ml-auto" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-800 rounded animate-pulse w-16 ml-auto" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-800 rounded animate-pulse w-20 ml-auto" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-800 rounded animate-pulse w-16 ml-auto" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 bg-slate-800 rounded animate-pulse w-16 ml-auto" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <div className="h-7 bg-slate-800 rounded animate-pulse w-8" />
                    <div className="h-7 bg-slate-800 rounded animate-pulse w-8" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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