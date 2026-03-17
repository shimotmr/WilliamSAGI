'use client'
import { useState, useEffect } from 'react'
import { RefreshCw, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_SHIOAJI_API_URL || 'https://shioaji.williamhsiao.tw'
const API_TOKEN = process.env.NEXT_PUBLIC_SHIOAJI_TOKEN || 'shioaji-william-2026'

interface TradeOrder {
  contract: { code: string; name: string }
  order: { id: string; action: string; price: number; quantity: number; price_type: string; order_type: string; ordno: string }
  status: { status: string; order_datetime: string; deals: { price: number; quantity: number }[] }
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  'PendingSubmit': { label: '傳送中', color: 'text-amber-400 bg-amber-500/20' },
  'PreSubmitted': { label: '預約中', color: 'text-blue-400 bg-blue-500/20' },
  'Submitted': { label: '已委託', color: 'text-blue-400 bg-blue-500/20' },
  'Filled': { label: '已成交', color: 'text-emerald-400 bg-emerald-500/20' },
  'Filling': { label: '部分成交', color: 'text-amber-400 bg-amber-500/20' },
  'Cancelled': { label: '已取消', color: 'text-slate-500 bg-slate-500/20' },
  'Failed': { label: '失敗', color: 'text-red-400 bg-red-500/20' },
  'Inactive': { label: '未啟用', color: 'text-slate-600 bg-slate-500/10' },
}

function getStatus(s: string) {
  for (const [key, val] of Object.entries(STATUS_MAP)) {
    if (s.includes(key)) return val
  }
  return { label: s, color: 'text-slate-400 bg-slate-500/20' }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<TradeOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      })
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const cancelOrder = async (tradeId: string) => {
    if (!confirm('確定要取消此委託？')) return
    try {
      await fetch(`${API_URL}/api/orders/${tradeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      })
      fetchOrders()
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">委託記錄</h1>
        <button onClick={fetchOrders} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
        </button>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-2">
          {orders.map((t, i) => {
            const st = getStatus(t.status.status)
            const isBuy = t.order.action.includes('Buy')
            const canCancel = t.status.status.includes('Submitted') || t.status.status.includes('PendingSubmit')
            const filledQty = t.status.deals.reduce((s, d) => s + d.quantity, 0)
            const filledPrice = t.status.deals.length > 0
              ? t.status.deals.reduce((s, d) => s + d.price * d.quantity, 0) / filledQty
              : 0

            return (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-slate-200">{t.contract.code}</span>
                    <span className="text-xs text-slate-500">{t.contract.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isBuy ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {isBuy ? '買' : '賣'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${st.color}`}>{st.label}</span>
                  </div>
                  {canCancel && (
                    <button onClick={() => cancelOrder(t.order.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400">
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>委託價 <span className="font-mono text-slate-300">${t.order.price}</span></span>
                  <span>數量 <span className="font-mono text-slate-300">{t.order.quantity}張</span></span>
                  <span>{t.order.price_type.replace('StockPriceType.', '')} / {t.order.order_type.replace('OrderType.', '')}</span>
                  {filledQty > 0 && (
                    <span className="text-emerald-400">成交 {filledQty}張 @ ${filledPrice.toFixed(2)}</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">{t.status.order_datetime}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm">
          {loading ? '載入中...' : '今日無委託記錄'}
        </div>
      )}
    </div>
  )
}
