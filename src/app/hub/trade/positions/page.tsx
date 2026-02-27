'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, AlertCircle } from 'lucide-react'

import { PositionSummary } from '@/components/trading/PositionSummary'
import { PositionTable, Position } from '@/components/trading/PositionTable'

interface PositionSummaryData {
  total_cost: number
  total_market_value: number
  total_unrealized_pnl: number
  total_unrealized_pnl_percent: number
  total_positions: number
}

interface PositionsResponse {
  success: boolean
  data: {
    positions: Position[]
    summary: {
      total_cost: number
      total_market_value: number
      total_unrealized_pnl: number
      total_unrealized_pnl_percent: number
    }
  }
  error?: string
  message?: string
}

/**
 * 持倉管理頁面
 * 整合實際API調用，支持排序和操作功能
 */
export default function PositionsPage() {
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>([])
  const [summary, setSummary] = useState<PositionSummaryData>({
    total_cost: 0,
    total_market_value: 0,
    total_unrealized_pnl: 0,
    total_unrealized_pnl_percent: 0,
    total_positions: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // 獲取持倉數據
  const fetchPositions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/trade/positions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data: PositionsResponse = await response.json()

      if (data.success && data.data) {
        setPositions(data.data.positions)
        setSummary({
          ...data.data.summary,
          total_positions: data.data.positions.length
        })
        setLastUpdated(new Date())
      } else {
        setError(data.message || '獲取持倉數據失敗')
      }
    } catch (err) {
      console.error('獲取持倉數據錯誤:', err)
      setError('網絡錯誤，請稍後重試')
    } finally {
      setIsLoading(false)
    }
  }

  // 自動刷新持倉數據（每30秒）
  useEffect(() => {
    fetchPositions()
    
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchPositions()
      }
    }, 30000) // 30秒刷新

    return () => clearInterval(interval)
  }, [])

  // 處理賣出按鈕點擊
  const handleSellClick = (symbol: string) => {
    router.push(`/trade/orders?symbol=${symbol}&action=sell`)
  }

  // 處理買進按鈕點擊
  const handleBuyClick = (symbol: string) => {
    router.push(`/trade/orders?symbol=${symbol}&action=buy`)
  }

  // 手動刷新
  const handleRefresh = () => {
    fetchPositions()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 頁面標題和控制 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">持倉管理</h1>
            <p className="text-slate-400 mt-1">
              管理您的股票持倉，監控投資績效
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-sm text-slate-500">
                更新於 {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:cursor-not-allowed rounded-lg text-slate-300 text-sm transition-colors"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-400" size={20} />
              <div>
                <h3 className="font-semibold text-red-300">載入失敗</h3>
                <p className="text-red-400 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 持倉總覽卡片 */}
        <PositionSummary
          data={summary}
          isLoading={isLoading}
        />

        {/* 持倉明細表格 */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-200">持倉明細</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>點擊表頭可排序</span>
            </div>
          </div>
          
          <PositionTable
            positions={positions}
            isLoading={isLoading}
            onSellClick={handleSellClick}
            onBuyClick={handleBuyClick}
          />
        </div>

        {/* 提示信息 */}
        {!isLoading && positions.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-500/20 rounded">
                <AlertCircle className="text-blue-400" size={16} />
              </div>
              <div className="flex-1 text-sm">
                <h4 className="font-medium text-slate-300 mb-1">操作提示</h4>
                <ul className="text-slate-400 space-y-1">
                  <li>• 點擊表頭可對持倉進行排序</li>
                  <li>• 點擊「買」或「賣」按鈕可直接進入下單頁面</li>
                  <li>• 數據每30秒自動更新，您也可手動點擊刷新</li>
                  <li>• 顏色說明：<span className="text-red-400">紅色代表上漲/獲利</span>，<span className="text-green-400">綠色代表下跌/虧損</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}