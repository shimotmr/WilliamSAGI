'use client'
import { useState, useEffect } from 'react'
import { Search, AlertTriangle, CheckCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_SHIOAJI_API_URL || 'https://shioaji.williamhsiao.tw'
const API_TOKEN = process.env.NEXT_PUBLIC_SHIOAJI_TOKEN || 'shioaji-william-2026'

interface SearchResult { code: string; name: string; reference: number; limit_up: number; limit_down: number; day_trade: string }

export default function OrderClient({ initialSymbol, initialAction }: { initialSymbol: string; initialAction: 'Buy' | 'Sell' }) {
  const [symbol, setSymbol] = useState(initialSymbol)
  const [action, setAction] = useState<'Buy' | 'Sell'>(initialAction)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [priceType, setPriceType] = useState('LMT')
  const [orderType, setOrderType] = useState('ROD')
  const [orderLot, setOrderLot] = useState('Common')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedContract, setSelectedContract] = useState<SearchResult | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchQuery.length < 1) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/contracts/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        })
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    if (!symbol) return
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/api/quote/snapshot?symbols=${symbol}`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        })
        const data = await res.json()
        if (data.snapshots?.[0]) {
          setPrice(String(data.snapshots[0].close))
          setSelectedContract({
            code: data.snapshots[0].code,
            name: data.snapshots[0].name,
            reference: data.snapshots[0].open,
            limit_up: data.snapshots[0].high,
            limit_down: data.snapshots[0].low,
            day_trade: 'Yes',
          })
        }
      } catch {}
    })()
  }, [symbol])

  const submitOrder = async () => {
    if (!symbol || !price || !quantity) return
    setSubmitting(true); setError(''); setResult(null)
    try {
      const res = await fetch(`${API_URL}/api/order/stock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol, action, price: parseFloat(price), quantity: parseInt(quantity),
          price_type: priceType, order_type: orderType, order_lot: orderLot,
        }),
      })
      const data = await res.json()
      if (data.ok) setResult(data)
      else setError(data.error || '下單失敗')
    } catch (e: any) { setError(e.message) }
    setSubmitting(false)
  }

  const estimatedCost = selectedContract && price && quantity
    ? (parseFloat(price) * parseInt(quantity) * 1000 * (action === 'Buy' ? 1.001425 : 0.995575))
    : 0

  return (
    <div className="space-y-4">
      <h1 className="text-xl md:text-2xl font-bold text-slate-100">股票下單</h1>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
        <label className="text-[10px] text-slate-500 block mb-1">股票代碼/名稱</label>
        <div className="relative">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜尋股票..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 pr-10" />
          <Search size={16} className="absolute right-3 top-2.5 text-slate-500" />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 border border-slate-700 rounded-lg overflow-hidden">
            {searchResults.slice(0, 6).map((r, i) => (
              <button key={i} onClick={() => { setSymbol(r.code); setSearchQuery(''); setSearchResults([]) }}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 text-sm flex justify-between">
                <span className="font-mono text-slate-300">{r.code}</span>
                <span className="text-slate-500">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedContract && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="font-mono text-slate-200 text-lg">{selectedContract.code}</span>
              <span className="text-slate-400 ml-2">{selectedContract.name}</span>
            </div>
            <button onClick={() => { setSymbol(''); setSelectedContract(null) }} className="text-slate-500 text-xs">清除</button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><span className="text-slate-500">參考價</span><p className="font-mono text-slate-300">${selectedContract.reference}</p></div>
            <div><span className="text-slate-500">漲停</span><p className="font-mono text-red-400">${selectedContract.limit_up}</p></div>
            <div><span className="text-slate-500">跌停</span><p className="font-mono text-green-400">${selectedContract.limit_down}</p></div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-3">
        <div className="flex gap-2">
          {(['Buy', 'Sell'] as const).map(a => (
            <button key={a} onClick={() => setAction(a)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                action === a
                  ? a === 'Buy' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
              {a === 'Buy' ? '買進' : '賣出'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['LMT', 'MKT', 'PRT'] as const).map(p => (
            <button key={p} onClick={() => setPriceType(p)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                priceType === p ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
              {p === 'LMT' ? '限價' : p === 'MKT' ? '市價' : '範圍市價'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">價格</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">數量（張）</label>
            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300" />
          </div>
        </div>

        <div className="flex gap-2">
          {(['Common', 'Intraday', 'Odd'] as const).map(l => (
            <button key={l} onClick={() => setOrderLot(l)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                orderLot === l ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
              {l === 'Common' ? '整股' : l === 'Intraday' ? '盤中零股' : '零股'}
            </button>
          ))}
        </div>

        {estimatedCost > 0 && (
          <div className={`p-2.5 rounded-lg ${action === 'Buy' ? 'bg-red-500/5 border border-red-500/20' : 'bg-green-500/5 border border-green-500/20'}`}>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">預估{action === 'Buy' ? '花費' : '所得'}（含手續費）</span>
              <span className={`font-mono font-medium ${action === 'Buy' ? 'text-red-400' : 'text-green-400'}`}>
                ${estimatedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}

        <button onClick={() => setShowConfirm(true)} disabled={!symbol || !price || !quantity || submitting}
          className={`w-full py-3 rounded-xl font-medium transition-colors ${
            action === 'Buy'
              ? 'bg-red-500 hover:bg-red-400 text-white disabled:bg-slate-700'
              : 'bg-green-500 hover:bg-green-400 text-white disabled:bg-slate-700'
          } disabled:text-slate-500`}>
          確認{action === 'Buy' ? '買進' : '賣出'}
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full">
            <div className="flex items-center gap-2 mb-3 text-amber-400">
              <AlertTriangle size={20} />
              <span className="font-medium">確認下單</span>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-slate-500">股票：</span>{selectedContract?.code} {selectedContract?.name}</p>
              <p><span className="text-slate-500">動作：</span>{action === 'Buy' ? '買進' : '賣出'}</p>
              <p><span className="text-slate-500">價格：</span>${price}</p>
              <p><span className="text-slate-500">數量：</span>{quantity} 張</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300">取消</button>
              <button onClick={() => { setShowConfirm(false); submitOrder() }}
                className={`flex-1 py-2.5 rounded-lg font-medium ${action === 'Buy' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                確認送出
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 text-emerald-400 mb-2"><CheckCircle size={16} /><span className="font-medium">下單成功</span></div>
          <p className="text-xs text-slate-400 font-mono">委託編號：{result.ordno}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
