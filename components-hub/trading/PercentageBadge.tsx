'use client'

import { cn } from '@/lib/utils'

interface PercentageBadgeProps {
  value: number
  size?: 'sm' | 'md'
  className?: string
}

/**
 * 漲跌百分比標籤組件
 * 遵循台股慣例：漲紅跌綠
 */
export function PercentageBadge({ value, size = 'md', className }: PercentageBadgeProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5'
  }

  // 台股慣例：漲紅跌綠
  const colorClasses = isPositive 
    ? 'bg-red-500/20 text-red-400 border-red-500/30'  // 漲 - 紅色
    : isNegative 
    ? 'bg-green-500/20 text-green-400 border-green-500/30'  // 跌 - 綠色
    : 'bg-slate-500/20 text-slate-400 border-slate-500/30'  // 平盤 - 灰色

  return (
    <span className={cn(
      'inline-flex items-center rounded-md border font-mono font-medium',
      sizeClasses[size],
      colorClasses,
      className
    )}>
      {isPositive && '+'}
      {value.toFixed(2)}%
    </span>
  )
}