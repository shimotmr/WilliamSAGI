'use client'
import { useState } from 'react'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_SHIOAJI_API_URL || 'https://shioaji.williamhsiao.tw'
const API_TOKEN = process.env.NEXT_PUBLIC_SHIOAJI_TOKEN || 'shioaji-william-2026'

interface ProfitLoss {
  code: string; quantity: number; price: number; pnl: number
  date: string; pr_ratio?: number; cond?: string
}

interface Summary {
  code: string; quantity: number; entry_price: number; cover_price: number
  pnl: number; pr_ratio: number; buy_cost: number; sell_cost: number
}

export default function HistoryPage() {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  
  const [beginDate, setBeginDate] = useState(thirtyDaysAgo)
  const [endDate, setEndDate] = useState(today)
  const [tab, setTab] = useState<'detail' | 'summary'>('summary')
  const [details, setDetails] = useState<ProfitLoss[]>([])
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [total, setTotal] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      if (tab === 'detail') {
        const res = await fetch(`${API_URL}/api/profit-loss?begin_date=${beginDate}&end_date=${endDate}`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        })
        const data = await res.json()
        setDetails(data.profit_loss || [])
      } else {
        const res = await fetch(`${API_URL}/api/profit-loss/summary?begin_date=${beginDate}&end_date=${endDate}`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        })
        const data = await res.json()
        setSummaries(data.items || [])
        setTotal(data.total || null)
      }
    } catch {}
    setLoading(false)
  }

  const totalPnl = tab === 'summary' ? (total?.pnl ?? 0) : details.reduce((s, d) => s + d.pnl, 0)

  return (
    <div className="space-y-4">
      <h1 className="text-xl md:text-2xl font-bold text-slate-100">損益記錄</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 rounded-lg p-0.5">
        {(['summary', 'detail'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${
              tab === t ? 'bg-slate-700 text-slate-100' : 'text-slate-500'
            }`}>
            {t === 'summary' ? '彙總' : '明細'}
          </button>
        ))}
      </div>

      {/* Date Range */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 block mb-1">起始日期</label>
          <input type="date" value={beginDate} onChange={e => setBeginDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-300" />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 block mb-1">結束日期</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-300" />
        </div>
        <button onClick={fetchData} disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white whitespace-nowrap">
          {loading ? '查詢中...' : '查詢'}
        </button>
      </div>

      {/* Total */}
      {(details.length > 0 || summaries.length > 0) && (
        <div className={`rounded-xl p-4 border ${totalPnl >= 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">期間損益合計</span>
            <div className={`flex items-center gap-1 font-mono font-bold text-lg ${totalPnl >= 0 ? 'text-red-400' : 'text-green-400'}`}>
              {totalPnl >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}
              {total?.pr_ratio != null && <span className="text-sm ml-1">({total.pr_ratio.toFixed(2)}%)</span>}
            </div>
          </div>
        </div>
      )}

      {/* Summary View */}
      {tab === 'summary' && summaries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs border-b border-slate-800">
                <th className="text-left py-2 px-2">代碼</th>
                <th className="text-right py-2 px-1">數量</th>
                <th className="text-right py-2 px-1">買入均價</th>
                <th className="text-right py-2 px-1">賣出均價</th>
                <th className="text-right py-2 px-2">損益</th>
                <th className="text-right py-2 px-2">報酬率</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td className="py-2.5 px-2 font-mono text-slate-200">{s.code}</td>
                  <td className="py-2.5 px-1 text-right font-mono text-slate-400">{s.quantity}</td>
                  <td className="py-2.5 px-1 text-right font-mono text-slate-400">{s.entry_price}</td>
                  <td className="py-2.5 px-1 text-right font-mono text-slate-400">{s.cover_price}</td>
                  <td className={`py-2.5 px-2 text-right font-mono ${s.pnl >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {s.pnl >= 0 ? '+' : ''}${s.pnl.toLocaleString()}
                  </td>
                  <td className={`py-2.5 px-2 text-right font-mono text-xs ${s.pr_ratio >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {s.pr_ratio >= 0 ? '+' : ''}{s.pr_ratio.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail View */}
      {tab === 'detail' && details.length > 0 && (
        <div className="space-y-2">
          {details.map((d, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
              <div>
                <span className="font-mono text-slate-200">{d.code}</span>
                <span className="text-xs text-slate-500 ml-2">{d.date}</span>
                <span className="text-xs text-slate-500 ml-2">{d.quantity}張 @ ${d.price}</span>
              </div>
              <div className={`font-mono font-medium ${d.pnl >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                {d.pnl >= 0 ? '+' : ''}${d.pnl.toLocaleString()}
                {d.pr_ratio != null && <span className="text-xs ml-1">({d.pr_ratio.toFixed(2)}%)</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && details.length === 0 && summaries.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          選擇日期範圍後按「查詢」查看損益記錄
        </div>
      )}
    </div>
  )
}
