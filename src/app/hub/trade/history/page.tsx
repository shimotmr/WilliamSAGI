'use client'

import { Calendar, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'

interface PaperOrder {
  id: string
  symbol: string
  symbol_name: string
  action: 'buy' | 'sell'
  price: number
  quantity: number
  amount: number
  commission: number
  tax: number
  total_cost: number
  status: string
  created_at: string
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<PaperOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all')

  useEffect(() => {
    fetch('/api/trade/paper?type=orders')
      .then(r => r.json())
      .then(d => { setOrders(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o => typeFilter === 'all' || o.action === typeFilter)

  const totalFees = filtered.reduce((s, o) => s + (o.commission || 0), 0)
  const totalTax = filtered.reduce((s, o) => s + (o.tax || 0), 0)

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-slate-100">成交記錄</h1>

      {/* 篩選 */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/30 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-1.5">
          <Filter className="text-slate-500" size={14} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm"
          >
            <option value="all">全部</option>
            <option value="buy">買進</option>
            <option value="sell">賣出</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 ml-auto">共 {filtered.length} 筆</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-24 mb-2" />
              <div className="h-3 bg-slate-800 rounded w-40" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          尚無成交記錄
        </div>
      ) : (
        <>
          {/* 桌面表格 */}
          <div className="hidden md:block bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">日期</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">股票</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-400">類型</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">數量</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">成交價</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">成交金額</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">手續費</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">稅</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-b border-slate-800 hover:bg-slate-800/20">
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(o.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-100">{o.symbol}</span>
                      <span className="text-slate-400 text-sm ml-1">{o.symbol_name}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        o.action === 'buy' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {o.action === 'buy' ? '買進' : '賣出'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">{o.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">{o.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-200">${o.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">${o.commission.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">${o.tax.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 手機卡片 */}
          <div className="md:hidden space-y-2">
            {filtered.map(o => (
              <div key={o.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-slate-100">{o.symbol}</span>
                    <span className="text-slate-400 text-xs ml-1">{o.symbol_name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    o.action === 'buy' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {o.action === 'buy' ? '買進' : '賣出'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">價格</span>
                    <p className="font-mono text-slate-300">{o.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">數量</span>
                    <p className="font-mono text-slate-300">{o.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">金額</span>
                    <p className="font-mono text-slate-200">${o.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                  <span>手續費 ${o.commission} / 稅 ${o.tax}</span>
                  <span>{new Date(o.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 摘要 */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-3 flex flex-wrap gap-4 text-xs text-slate-400">
            <span>總手續費：<span className="font-mono text-slate-300">${totalFees.toLocaleString()}</span></span>
            <span>總交易稅：<span className="font-mono text-slate-300">${totalTax.toLocaleString()}</span></span>
          </div>
        </>
      )}
    </div>
  )
}
