'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, Briefcase, History, BarChart3 } from 'lucide-react'

export default function TradePage() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hub/trade/summary')
      .then(r => r.json())
      .then(d => { setSummary(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const links = [
    { href: '/hub/trade/quotes',    label: '即時行情', icon: <TrendingUp size={20} /> },
    { href: '/hub/trade/positions', label: '模擬持倉', icon: <Briefcase size={20} /> },
    { href: '/hub/trade/order',     label: '模擬下單', icon: <ShoppingCart size={20} /> },
    { href: '/hub/trade/orders',    label: '委託記錄', icon: <BarChart3 size={20} /> },
    { href: '/hub/trade/history',   label: '成交記錄', icon: <History size={20} /> },
  ]

  const balance = summary?.account?.availableBalance
  const pnl = summary?.totalPnl ?? null
  const posCount = summary?.positionCount ?? 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">交易總覽</h1>
        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium">
          模擬模式
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {loading ? (
          [0,1,2].map(i => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4 animate-pulse">
              <div className="h-3 bg-slate-800 rounded w-12 mb-2"/>
              <div className="h-6 bg-slate-800 rounded w-16"/>
            </div>
          ))
        ) : (
          <>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-slate-500 mb-1">可用餘額</p>
              <p className="text-sm md:text-xl font-bold text-slate-100 font-mono">
                {balance != null ? `$${Number(balance).toLocaleString()}` : '$10,000,000'}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-slate-500 mb-1">未實現損益</p>
              <p className={`text-sm md:text-xl font-bold font-mono ${
                pnl === null ? 'text-slate-400' : pnl >= 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {pnl != null ? `${pnl >= 0 ? '+' : ''}${Number(pnl).toLocaleString()}` : '$0'}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-slate-500 mb-1">持倉數</p>
              <p className="text-sm md:text-xl font-bold text-slate-100 font-mono">{posCount}</p>
            </div>
          </>
        )}
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-5 flex items-center gap-3 hover:bg-slate-800/50 active:bg-slate-800/70 transition-colors">
            <span className="text-slate-400">{l.icon}</span>
            <span className="font-medium text-sm md:text-base text-slate-200">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 md:p-4 text-xs md:text-sm text-blue-400">
        📝 模擬交易模式：所有交易均為紙上交易，不涉及真實資金。初始資金 $10,000,000。
      </div>
    </div>
  )
}
