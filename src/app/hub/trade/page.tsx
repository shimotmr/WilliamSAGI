'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, Briefcase, History, BarChart3, RefreshCw, Wifi, WifiOff, ClipboardList, DollarSign, Shield } from 'lucide-react'

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_SHIOAJI_API_URL || 'https://shioaji.williamhsiao.tw'
const API_TOKEN = process.env.NEXT_PUBLIC_SHIOAJI_TOKEN || 'shioaji-william-2026'

async function apiFetch(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  })
  return res.json()
}

export default function TradePage() {
  const [health, setHealth] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [limits, setLimits] = useState<any>(null)
  const [settlements, setSettlements] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [h, b, p, l, s, o] = await Promise.all([
        apiFetch('/api/health').catch(() => ({ ok: false })),
        apiFetch('/api/account/balance').catch(() => null),
        apiFetch('/api/positions/stock').catch(() => ({ positions: [] })),
        apiFetch('/api/account/trading-limits').catch(() => null),
        apiFetch('/api/settlements').catch(() => ({ settlements: [] })),
        apiFetch('/api/orders').catch(() => ({ orders: [] })),
      ])
      setHealth(h)
      setBalance(b)
      setPositions(p?.positions || [])
      setLimits(l)
      setSettlements(s?.settlements || [])
      setOrders(o?.orders || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const isConnected = health?.ok && health?.connected
  const totalPnl = positions.reduce((s: number, p: any) => s + (p.pnl || 0), 0)
  const totalMV = positions.reduce((s: number, p: any) => s + p.last_price * p.quantity * 1000, 0)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">交易總覽</h1>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
            isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isConnected ? '已連線' : '未連線'}
          </span>
          <button onClick={fetchAll} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-slate-500 mb-1">帳戶餘額</p>
          <p className="text-sm md:text-lg font-bold text-slate-100 font-mono">
            {loading ? '...' : `$${(balance?.acc_balance ?? 0).toLocaleString()}`}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-slate-500 mb-1">持倉市值</p>
          <p className="text-sm md:text-lg font-bold text-slate-100 font-mono">
            {loading ? '...' : `$${totalMV.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-slate-500 mb-1">未實現損益</p>
          <p className={`text-sm md:text-lg font-bold font-mono ${
            totalPnl === 0 ? 'text-slate-400' : totalPnl > 0 ? 'text-red-400' : 'text-green-400'
          }`}>
            {loading ? '...' : `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-slate-500 mb-1">持倉數</p>
          <p className="text-sm md:text-lg font-bold text-slate-100 font-mono">
            {loading ? '...' : positions.length}
          </p>
        </div>
      </div>

      {/* Trading Limits & Settlements */}
      {(limits || settlements.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Trading Limits */}
          {limits && !limits.error && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
              <h3 className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                <Shield size={14} /> 交易額度
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">電子交易額度</span>
                  <span className="font-mono text-slate-300">${limits.trading_limit?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">已用 / 可用</span>
                  <span className="font-mono text-slate-300">
                    ${limits.trading_used?.toLocaleString()} / ${limits.trading_available?.toLocaleString()}
                  </span>
                </div>
                {limits.margin_limit > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">融資額度</span>
                    <span className="font-mono text-slate-300">${limits.margin_available?.toLocaleString()}</span>
                  </div>
                )}
                {/* Usage bar */}
                <div className="mt-2">
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${limits.trading_limit > 0 ? Math.min((limits.trading_used / limits.trading_limit) * 100, 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settlements */}
          {settlements.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
              <h3 className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                <DollarSign size={14} /> 交割款
              </h3>
              <div className="space-y-1.5 text-xs">
                {settlements.map((s, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-slate-500">{s.date} (T+{s.T})</span>
                    <span className={`font-mono ${s.amount < 0 ? 'text-green-400' : s.amount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {s.amount !== 0 ? `$${s.amount.toLocaleString()}` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <ClipboardList size={14} /> 今日委託
            </h3>
            <Link href="/hub/trade/orders" className="text-[10px] text-blue-400 hover:text-blue-300">查看全部</Link>
          </div>
          <div className="space-y-1.5">
            {orders.slice(0, 5).map((t, i) => {
              const isBuy = t.order.action.includes('Buy')
              return (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-1 py-0.5 rounded text-[10px] ${isBuy ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {isBuy ? '買' : '賣'}
                    </span>
                    <span className="font-mono text-slate-300">{t.contract.code}</span>
                    <span className="text-slate-500">{t.contract.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{t.order.quantity}張 @ ${t.order.price}</span>
                    <span className="text-[10px] text-slate-500">{t.status.status.split('.').pop()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Nav (hidden on desktop since sidebar exists) */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {[
          { href: '/hub/trade/quotes',    label: '即時行情', icon: <TrendingUp size={18} /> },
          { href: '/hub/trade/order',     label: '股票下單', icon: <ShoppingCart size={18} /> },
          { href: '/hub/trade/positions', label: '持倉管理', icon: <Briefcase size={18} /> },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col items-center gap-1 hover:bg-slate-800/50 transition-colors">
            <span className="text-slate-400">{l.icon}</span>
            <span className="text-[10px] text-slate-300">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Connection Error */}
      {!isConnected && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
          ⚠️ Shioaji 後端未連線。請確認 Mac mini 上的交易服務正在運行。
        </div>
      )}
    </div>
  )
}
