'use client'
import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_SHIOAJI_API_URL || 'https://shioaji.williamhsiao.tw'
const API_TOKEN = process.env.NEXT_PUBLIC_SHIOAJI_TOKEN || 'shioaji-william-2026'

interface Position {
  code: string; direction: string; quantity: number; price: number
  last_price: number; pnl: number; yd_quantity?: number; cond?: string
}

export default function PositionsPage() {
  const [tab, setTab] = useState<'stock' | 'futures'>('stock')
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPositions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/positions/${tab}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      })
      const data = await res.json()
      setPositions(data.positions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchPositions() }, [tab])

  const totalCost = positions.reduce((s, p) => s + p.price * p.quantity * (tab === 'stock' ? 1000 : 1), 0)
  const totalMV = positions.reduce((s, p) => s + p.last_price * p.quantity * (tab === 'stock' ? 1000 : 1), 0)
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0)
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">持倉管理</h1>
        <button onClick={fetchPositions} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 rounded-lg p-0.5">
        {(['stock', 'futures'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${
              tab === t ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {t === 'stock' ? '股票' : '期貨選擇權'}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: '持倉數', value: `${positions.length}`, color: '' },
          { label: '總成本', value: `$${totalCost.toLocaleString()}`, color: '' },
          { label: '總市值', value: `$${totalMV.toLocaleString()}`, color: '' },
          { label: '未實現損益', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()} (${totalPnlPct.toFixed(1)}%)`,
            color: totalPnl > 0 ? 'text-red-400' : totalPnl < 0 ? 'text-green-400' : '' },
        ].map(c => (
          <div key={c.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-500 mb-0.5">{c.label}</p>
            <p className={`text-xs md:text-sm font-bold font-mono ${c.color || 'text-slate-100'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {positions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs border-b border-slate-800">
                <th className="text-left py-2 px-2">代碼</th>
                <th className="text-left py-2 px-1">方向</th>
                <th className="text-right py-2 px-1">數量</th>
                <th className="text-right py-2 px-1">成本</th>
                <th className="text-right py-2 px-1">現價</th>
                <th className="text-right py-2 px-2">損益</th>
                <th className="text-right py-2 px-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => {
                const pnlPct = p.price > 0 ? ((p.last_price - p.price) / p.price * 100) : 0
                const pnlColor = p.pnl > 0 ? 'text-red-400' : p.pnl < 0 ? 'text-green-400' : 'text-slate-400'
                return (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2.5 px-2 font-mono font-medium text-slate-200">{p.code}</td>
                    <td className="py-2.5 px-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        p.direction.includes('Buy') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {p.direction.includes('Buy') ? '買' : '賣'}
                      </span>
                    </td>
                    <td className="py-2.5 px-1 text-right font-mono text-slate-300">{p.quantity}</td>
                    <td className="py-2.5 px-1 text-right font-mono text-slate-400">{p.price.toFixed(2)}</td>
                    <td className="py-2.5 px-1 text-right font-mono text-slate-200">{p.last_price.toFixed(2)}</td>
                    <td className={`py-2.5 px-2 text-right font-mono ${pnlColor}`}>
                      <div>{p.pnl >= 0 ? '+' : ''}{p.pnl.toLocaleString()}</div>
                      <div className="text-[10px]">{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%</div>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <Link href={`/hub/trade/order?symbol=${p.code}&action=${p.direction.includes('Buy') ? 'sell' : 'buy'}`}
                        className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
                        {p.direction.includes('Buy') ? '賣出' : '買進'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm">
          {loading ? '載入中...' : '目前無持倉'}
        </div>
      )}
    </div>
  )
}
