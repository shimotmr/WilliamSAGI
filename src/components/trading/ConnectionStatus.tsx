'use client'

import { Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'

import { cn } from '@/lib/utils'

export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'error'

interface ConnectionStatusProps {
  status?: ConnectionState
  lastUpdate?: Date
  className?: string
}

/**
 * Shioaji 連線狀態指示器
 * 顯示即時連線狀態與最後更新時間
 */
export function ConnectionStatus({ 
  status = 'disconnected', 
  lastUpdate,
  className 
}: ConnectionStatusProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // 更新當前時間用於計算延遲
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatusConfig = (state: ConnectionState) => {
    switch (state) {
      case 'connected':
        return {
          icon: <Wifi size={16} />,
          text: '已連線',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30'
        }
      case 'connecting':
        return {
          icon: <Wifi size={16} className="animate-pulse" />,
          text: '連線中...',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30'
        }
      case 'error':
        return {
          icon: <AlertTriangle size={16} />,
          text: '連線異常',
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30'
        }
      default:
        return {
          icon: <WifiOff size={16} />,
          text: '未連線',
          color: 'text-slate-400',
          bgColor: 'bg-slate-500/20',
          borderColor: 'border-slate-500/30'
        }
    }
  }

  const config = getStatusConfig(status)

  // 計算延遲時間
  const getDelayText = () => {
    if (!lastUpdate || status !== 'connected') return null
    const delay = Math.floor((currentTime.getTime() - lastUpdate.getTime()) / 1000)
    if (delay < 5) return '即時'
    return `${delay}s前`
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <span className={config.color}>
        {config.icon}
      </span>
      <span className={cn('text-sm font-medium', config.color)}>
        {config.text}
      </span>
      {getDelayText() && (
        <>
          <span className="text-slate-500">•</span>
          <span className="text-xs text-slate-400">
            {getDelayText()}
          </span>
        </>
      )}
    </div>
  )
}