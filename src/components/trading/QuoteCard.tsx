'use client'

import { Heart, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StockPrice } from './StockPrice'
import { PercentageBadge } from './PercentageBadge'

interface QuoteData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  updatedAt?: string
}

interface QuoteCardProps {
  quote: QuoteData
  isSelected?: boolean
  onSelect?: (symbol: string) => void
  onToggleWatchlist?: (symbol: string) => void
  isInWatchlist?: boolean
  showAnimation?: boolean
  className?: string
}

/**
 * 單一股票報價卡片元件
 */
export function QuoteCard({
  quote,
  isSelected = false,
  onSelect,
  onToggleWatchlist,
  isInWatchlist = false,
  showAnimation = true,
  className
}: QuoteCardProps) {
  const { symbol, name, price, change, changePercent, volume, updatedAt } = quote

  const isPositive = change > 0
  const isNegative = change < 0

  // 動畫效果的 CSS 類名
  const animationClasses = showAnimation 
    ? isPositive 
      ? 'animate-pulse-red'
      : isNegative 
      ? 'animate-pulse-green'
      : ''
    : ''

  const handleClick = () => {
    onSelect?.(symbol)
  }

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleWatchlist?.(symbol)
  }

  return (
    <div
      className={cn(
        'relative p-4 bg-slate-900/50 border border-slate-800 rounded-xl transition-all duration-200 cursor-pointer hover:bg-slate-800/50',
        isSelected && 'border-blue-500 bg-slate-800/50',
        animationClasses,
        className
      )}
      onClick={handleClick}
    >
      {/* 標頭 - 股票代號和名稱 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-slate-300 font-semibold">
              {symbol}
            </span>
            <button
              onClick={handleWatchlistToggle}
              className={cn(
                'p-1 rounded-full transition-colors hover:bg-slate-700',
                isInWatchlist ? 'text-red-400' : 'text-slate-500'
              )}
            >
              <Heart 
                size={14} 
                className={isInWatchlist ? 'fill-current' : ''} 
              />
            </button>
          </div>
          <span className="text-xs text-slate-400 truncate block">
            {name}
          </span>
        </div>

        {/* 趋势图标 */}
        <div className="flex items-center ml-2">
          {isPositive && (
            <TrendingUp size={16} className="text-red-400" />
          )}
          {isNegative && (
            <TrendingDown size={16} className="text-green-400" />
          )}
        </div>
      </div>

      {/* 價格資訊 */}
      <div className="space-y-2">
        {/* 現價 */}
        <div className="flex items-end justify-between">
          <StockPrice 
            price={price}
            change={change}
            size="lg"
            showChange={false}
            className="leading-none"
          />
          <PercentageBadge value={changePercent} size="sm" />
        </div>

        {/* 漲跌金額 */}
        <div className="flex items-center justify-between text-sm">
          <StockPrice 
            price={Math.abs(change)}
            change={change}
            size="sm"
            showChange={false}
            className={cn(
              'font-medium',
              isPositive ? 'text-red-400' : isNegative ? 'text-green-400' : 'text-slate-400'
            )}
          />
          <span className="text-slate-500 text-xs">
            {change >= 0 ? '+' : ''}{change.toFixed(2)}
          </span>
        </div>

        {/* 成交量 */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>成交量</span>
          <span className="font-mono">
            {volume >= 1000000 
              ? `${(volume / 1000000).toFixed(1)}M` 
              : volume >= 1000 
              ? `${(volume / 1000).toFixed(0)}K`
              : volume.toString()
            }
          </span>
        </div>
      </div>

      {/* 更新時間 */}
      {updatedAt && (
        <div className="absolute top-2 right-2 text-xs text-slate-600">
          {new Date(updatedAt).toLocaleTimeString('zh-TW', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      )}

      {/* 選中指示器 */}
      {isSelected && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-900" />
      )}
    </div>
  )
}

// 添加動畫樣式到全域 CSS 中
const animationStyles = `
@keyframes pulse-red {
  0%, 100% { 
    background-color: rgba(15, 23, 42, 0.5); 
  }
  50% { 
    background-color: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
  }
}

@keyframes pulse-green {
  0%, 100% { 
    background-color: rgba(15, 23, 42, 0.5); 
  }
  50% { 
    background-color: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
  }
}

.animate-pulse-red {
  animation: pulse-red 0.8s ease-out;
}

.animate-pulse-green {
  animation: pulse-green 0.8s ease-out;
}
`

// 將動畫樣式注入到文檔中
if (typeof window !== 'undefined') {
  const styleElement = document.getElementById('quote-animations')
  if (!styleElement) {
    const style = document.createElement('style')
    style.id = 'quote-animations'
    style.textContent = animationStyles
    document.head.appendChild(style)
  }
}