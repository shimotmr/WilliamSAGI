'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

import { PositionTable, Position } from '@/components/trading/PositionTable'

/**
 * 模擬持倉頁面 — 從 paper_positions 讀取
 */
export default function PositionsPage() {
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchPositions = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/trade/paper?type=positions')
      const data = await res.json()
      setPositions(data.data || [])
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPositions()
    const iv = setInterval(fetchPositions, 30000)
    return () => clearInterval(iv)
  }, [])

  const totalCost = positions.reduce((s, p) => s + (p.cost_basis || 0), 0)
  const totalMV = positions.reduce((s, p) => s + (p.market_value || 0), 0)
  const totalPnl = positions.reduce((s, p) => s + (p.unrealized_pnl || 0), 0)
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">模擬持倉</h1>
        <button
          onClick={fetchPositions}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-colors"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* 摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {[
          { label: '持倉數', value: `${positions.length}` },
          { label: '總成本', value: `$${totalCost.toLocaleString()}` },
          { label: '總市值', value: `$${totalMV.toLocaleString()}` },
          {
            label: '未實現損益',
            value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()} (${totalPnlPct.toFixed(1)}%)`,
            color: totalPnl >= 0 ? 'text-red-400' : 'text-green-400',
          },
        ].map(c => (
          <div key={c.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-slate-500 mb-0.5">{c.label}</p>
            <p className={`text-xs md:text-base font-bold font-mono ${c.color || 'text-slate-100'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* 持倉表 */}
      <PositionTable
        positions={positions}
        isLoading={isLoading}
        onSellClick={(s) => router.push(`/hub/trade/order?symbol=${s}&action=sell`)}
        onBuyClick={(s) => router.push(`/hub/trade/order?symbol=${s}&action=buy`)}
      />
    </div>
  )
}
