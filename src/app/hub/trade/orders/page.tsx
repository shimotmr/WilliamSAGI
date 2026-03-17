'use client'

import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'partial'

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
  status: OrderStatus
  created_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<PaperOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trade/paper?type=orders')
      .then(r => r.json())
      .then(d => { setOrders(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'filled':   return { icon: <CheckCircle size={14} />, text: '已成交', cls: 'text-green-400' }
      case 'pending':  return { icon: <Clock size={14} />, text: '待成交', cls: 'text-yellow-400' }
      case 'cancelled':return { icon: <XCircle size={14} />, text: '已取消', cls: 'text-red-400' }
      case 'partial':  return { icon: <Clock size={14} />, text: '部分成交', cls: 'text-blue-400' }
      default:         return { icon: <Clock size={14} />, text: '未知', cls: 'text-slate-400' }
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">委託記錄</h1>
        <Link
          href="/hub/trade/order"
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">新增委託</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-24 mb-2" />
              <div className="h-3 bg-slate-800 rounded w-32" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-3">尚無委託記錄</p>
          <Link href="/hub/trade/order" className="text-blue-400 text-sm hover:underline">
            開始模擬下單 →
          </Link>
        </div>
      ) : (
        <>
          {/* 桌面表格 */}
          <div className="hidden md:block bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">股票</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-400">買賣</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">價格</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">數量</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">成交金額</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-400">狀態</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">時間</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const sc = getStatusConfig(order.status)
                  return (
                    <tr key={order.id} className="border-b border-slate-800 hover:bg-slate-800/20">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-100">{order.symbol}</span>
                        <span className="text-slate-400 text-sm ml-1.5">{order.symbol_name}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.action === 'buy' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {order.action === 'buy' ? '買進' : '賣出'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">{order.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">{order.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-slate-200">${order.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`flex items-center justify-center gap-1 text-xs ${sc.cls}`}>
                          {sc.icon} {sc.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-400">
                        {new Date(order.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 手機卡片 */}
          <div className="md:hidden space-y-2">
            {orders.map(order => {
              const sc = getStatusConfig(order.status)
              return (
                <div key={order.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-slate-100">{order.symbol}</span>
                      <span className="text-slate-400 text-xs ml-1">{order.symbol_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        order.action === 'buy' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {order.action === 'buy' ? '買進' : '賣出'}
                      </span>
                      <span className={`flex items-center gap-0.5 text-[10px] ${sc.cls}`}>
                        {sc.icon} {sc.text}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">價格</span>
                      <p className="font-mono text-slate-300">{order.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">數量</span>
                      <p className="font-mono text-slate-300">{order.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">金額</span>
                      <p className="font-mono text-slate-200">${order.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    {new Date(order.created_at).toLocaleString('zh-TW')}
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
