'use client'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Plus, X, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_SHIOAJI_API_URL || 'https://shioaji.williamhsiao.tw'
const API_TOKEN = process.env.NEXT_PUBLIC_SHIOAJI_TOKEN || 'shioaji-william-2026'

interface Snapshot {
  code: string; name: string; close: number; open: number; high: number; low: number
  change_price: number; change_rate: number; change_type: string
  total_volume: number; buy_price: number; sell_price: number
  buy_volume: number; sell_volume: number; average_price: number
  volume_ratio: number
}

const DEFAULT_WATCHLIST = ['2330', '2317', '2454', '2881', '2412', '2303', '2002', '2882', '2891', '2886', '3008', '2308']
const STORAGE_KEY = 'shioaji-watchlist'

function getChangeColor(rate: number) {
  if (rate > 0) return 'text-red-400'
  if (rate < 0) return 'text-green-400'
  return 'text-slate-400'
}

function getChangeBg(rate: number) {
  if (rate > 0) return 'bg-red-500/10 border-red-500/20'
  if (rate < 0) return 'bg-green-500/10 border-green-500/20'
  return 'bg-slate-800/50 border-slate-700'
}

function getChangeIcon(rate: number) {
  if (rate > 0) return <TrendingUp size={14} />
  if (rate < 0) return <TrendingDown size={14} />
  return <Minus size={14} />
}

export default function QuotesPage() {
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [addSymbol, setAddSymbol] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setWatchlist(saved ? JSON.parse(saved) : DEFAULT_WATCHLIST)
    } catch { setWatchlist(DEFAULT_WATCHLIST) }
  }, [])

  const fetchQuotes = useCallback(async () => {
    if (watchlist.length === 0) return
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/quote/snapshot?symbols=${watchlist.join(',')}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      })
      const data = await res.json()
      setSnapshots(data.snapshots || [])
      setLastUpdate(new Date().toLocaleTimeString('zh-TW'))
    } catch {}
    setLoading(false)
  }, [watchlist])

  useEffect(() => { if (watchlist.length > 0) fetchQuotes() }, [watchlist, fetchQuotes])
  useEffect(() => {
    if (!autoRefresh) return
    const iv = setInterval(fetchQuotes, 10000)
    return () => clearInterval(iv)
  }, [autoRefresh, fetchQuotes])

  const addToWatchlist = () => {
    const sym = addSymbol.trim()
    if (sym && !watchlist.includes(sym)) {
      const next = [...watchlist, sym]
      setWatchlist(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    setAddSymbol('')
    setShowAdd(false)
  }

  const removeFromWatchlist = (code: string) => {
    const next = watchlist.filter(c => c !== code)
    setWatchlist(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">即時行情</h1>
        <div className="flex items-center gap-2">
          {lastUpdate && <span className="text-[10px] text-slate-600">{lastUpdate}</span>}
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-[10px] px-2 py-1 rounded ${autoRefresh ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            {autoRefresh ? '自動' : '手動'}
          </button>
          <button onClick={fetchQuotes} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Add Symbol */}
      {showAdd && (
        <div className="flex gap-2">
          <input value={addSymbol} onChange={e => setAddSymbol(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addToWatchlist()}
            placeholder="輸入股票代碼，如 2330"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500" />
          <button onClick={addToWatchlist} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white">加入</button>
        </div>
      )}

      {/* Quote Cards */}
      <div className="space-y-2">
        {snapshots.map(s => (
          <div key={s.code} className={`border rounded-xl p-3 md:p-4 ${getChangeBg(s.change_rate)}`}>
            <div className="flex items-center justify-between">
              {/* Left: code + name */}
              <div className="flex items-center gap-2 min-w-0">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-100 text-sm">{s.code}</span>
                    <span className="text-slate-400 text-xs truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                    <span>量 {(s.total_volume / 1000).toFixed(0)}K</span>
                    <span>均 {s.average_price?.toFixed(1)}</span>
                    <span>比 {s.volume_ratio?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Right: price + change */}
              <div className="text-right">
                <div className={`font-mono font-bold text-lg ${getChangeColor(s.change_rate)}`}>
                  {s.close.toLocaleString()}
                </div>
                <div className={`flex items-center justify-end gap-1 text-xs font-mono ${getChangeColor(s.change_rate)}`}>
                  {getChangeIcon(s.change_rate)}
                  <span>{s.change_price >= 0 ? '+' : ''}{s.change_price.toFixed(2)}</span>
                  <span>({s.change_rate >= 0 ? '+' : ''}{s.change_rate.toFixed(2)}%)</span>
                </div>
              </div>
            </div>

            {/* Bid/Ask */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50 text-[11px]">
              <div className="flex gap-3">
                <span className="text-red-400/80">買 {s.buy_price} × {s.buy_volume}</span>
                <span className="text-green-400/80">賣 {s.sell_price} × {s.sell_volume}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500">開 {s.open}</span>
                <span className="text-red-400/60">高 {s.high}</span>
                <span className="text-green-400/60">低 {s.low}</span>
              </div>
              <button onClick={() => removeFromWatchlist(s.code)}
                className="p-0.5 rounded text-slate-600 hover:text-red-400 transition-colors">
                <X size={12} />
              </button>
            </div>
          </div>
        ))}

        {snapshots.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500 text-sm">
            沒有報價數據。請確認 Shioaji 後端已啟動。
          </div>
        )}
      </div>
    </div>
  )
}
