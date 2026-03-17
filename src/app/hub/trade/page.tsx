'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, Briefcase, History, BarChart3, Wallet, RefreshCw, Wifi, WifiOff } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [h, b, p] = await Promise.all([
        apiFetch('/api/health').catch(() => ({ ok: false })),
        apiFetch('/api/account/balance').catch(() => null),
        apiFetch('/api/positions/stock').catch(() => ({ positions: [] })),
      ])
      setHealth(h)
      setBalance(b)
      setPositions(p?.positions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const isConnected = health?.ok && health?.connected
  const totalPnl = positions.reduce((s: number, p: any) => s + (p.pnl || 0), 0)
  const totalCost = positions.reduce((s: number, p: any) => s + p.price * p.quantity, 0)

  const links = [
    { href: '/hub/trade/quotes',    label: '即時行情', icon: <TrendingUp size={20} />, desc: '股票即時報價' },
    { href: '/hub/trade/positions', label: '持倉管理', icon: <Briefcase size={20} />, desc: '未實現損益' },
    { href: '/hub/trade/order',     label: '股票下單', icon: <ShoppingCart size={20} />, desc: '委託買賣' },
    { href: '/hub/trade/orders',    label: '委託記錄', icon: <BarChart3 size={20} />, desc: '當日委託' },
    { href: '/hub/trade/history',   label: '損益記錄', icon: <History size={20} />, desc: '已實現損益' },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">交易總覽</h1>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
            isConnected
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isConnected ? '永豐金已連線' : '未連線'}
          </span>
          <button onClick={fetchAll} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-slate-500 mb-1">帳戶餘額</p>
          <p className="text-sm md:text-xl font-bold text-slate-100 font-mono">
            {loading ? '...' : `$${(balance?.acc_balance ?? 0).toLocaleString()}`}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-slate-500 mb-1">未實現損益</p>
          <p className={`text-sm md:text-xl font-bold font-mono ${
            totalPnl === 0 ? 'text-slate-400' : totalPnl > 0 ? 'text-red-400' : 'text-green-400'
          }`}>
            {loading ? '...' : `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-slate-500 mb-1">持倉數</p>
          <p className="text-sm md:text-xl font-bold text-slate-100 font-mono">
            {loading ? '...' : positions.length}
          </p>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-1 hover:bg-slate-800/50 active:bg-slate-800/70 transition-colors group">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 group-hover:text-slate-300 transition-colors">{l.icon}</span>
              <span className="font-medium text-sm text-slate-200">{l.label}</span>
            </div>
            <span className="text-[10px] text-slate-600">{l.desc}</span>
          </Link>
        ))}
      </div>

      {/* Connection Info */}
      {!isConnected && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
          ⚠️ Shioaji 後端未連線。請確認 Mac mini 上的交易服務正在運行。
        </div>
      )}
    </div>
  )
}
