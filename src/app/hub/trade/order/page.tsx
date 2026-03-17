'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, AlertTriangle, CheckCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_SHIOAJI_API_URL || 'https://shioaji.williamhsiao.tw'
const API_TOKEN = process.env.NEXT_PUBLIC_SHIOAJI_TOKEN || 'shioaji-william-2026'

interface SearchResult { code: string; name: string; reference: number; limit_up: number; limit_down: number; day_trade: string }

export default function OrderPage() {
  const searchParams = useSearchParams()
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || '')
  const [action, setAction] = useState<'Buy' | 'Sell'>(searchParams.get('action') === 'sell' ? 'Sell' : 'Buy')
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

  // Auto-search
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

  // Load price when symbol selected
  useEffect(() => {
    if (!symbol) return
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/quote/snapshot?symbols=${symbol}`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        })
        const data = await res.json()
        const snap = data.snapshots?.[0]
        if (snap) {
          setPrice(String(snap.close))
          setSelectedContract({
            code: snap.code, name: snap.name,
            reference: snap.close, limit_up: 0, limit_down: 0, day_trade: '',
          })
        }
      } catch {}
    })()
  }, [symbol])

  const selectContract = (c: SearchResult) => {
    setSymbol(c.code)
    setSelectedContract(c)
    setPrice(String(c.reference))
    setSearchQuery('')
    setSearchResults([])
  }

  const qty = parseInt(quantity) || 0
  const prc = parseFloat(price) || 0
  const shares = orderLot === 'Common' ? qty * 1000 : qty
  const amount = prc * shares
  const commission = Math.max(Math.round(amount * 0.001425), 20)
  const tax = action === 'Sell' ? Math.round(amount * 0.003) : 0
  const totalCost = action === 'Buy' ? amount + commission : amount - commission - tax

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol, action, price: prc, quantity: qty,
          price_type: priceType, order_type: orderType, order_lot: orderLot,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || 'Unknown error')
      setResult(data)
      setShowConfirm(false)
    } catch (e: any) {
      setError(e.message)
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-slate-100">股票下單</h1>

      {/* Symbol Search */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
          <Search size={16} className="text-slate-500" />
          <input value={searchQuery || (selectedContract ? `${symbol} ${selectedContract.name}` : symbol)}
            onChange={e => { setSearchQuery(e.target.value); setSelectedContract(null) }}
            onFocus={() => { if (selectedContract) setSearchQuery('') }}
            placeholder="搜尋股票代碼或名稱"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none" />
        </div>
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {searchResults.map(c => (
              <button key={c.code} onClick={() => selectContract(c)}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex justify-between items-center text-sm">
                <span><span className="font-mono text-slate-200">{c.code}</span> <span className="text-slate-400">{c.name}</span></span>
                <span className="text-slate-500 font-mono">${c.reference}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buy / Sell Toggle */}
      <div className="grid grid-cols-2 gap-1 bg-slate-900 rounded-lg p-0.5">
        {(['Buy', 'Sell'] as const).map(a => (
          <button key={a} onClick={() => setAction(a)}
            className={`py-2.5 text-sm font-medium rounded-md transition-colors ${
              action === a
                ? a === 'Buy' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}>
            {a === 'Buy' ? '買進' : '賣出'}
          </button>
        ))}
      </div>

      {/* Price & Quantity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">價格</label>
          <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            disabled={priceType === 'MKT'} />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">數量 ({orderLot === 'Common' ? '張' : '股'})</label>
          <input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="1"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      {/* Order Options */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">價格類型</label>
          <select value={priceType} onChange={e => setPriceType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-300">
            <option value="LMT">限價</option>
            <option value="MKT">市價</option>
            <option value="MKP">範圍市價</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">委託類型</label>
          <select value={orderType} onChange={e => setOrderType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-300">
            <option value="ROD">ROD</option>
            <option value="IOC">IOC</option>
            <option value="FOK">FOK</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">交易單位</label>
          <select value={orderLot} onChange={e => setOrderLot(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-300">
            <option value="Common">整股</option>
            <option value="IntradayOdd">盤中零股</option>
            <option value="Fixing">定盤</option>
            <option value="Odd">盤後零股</option>
          </select>
        </div>
      </div>

      {/* Cost Preview */}
      {prc > 0 && qty > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-1 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>成交金額</span><span className="font-mono">${amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>手續費 (0.1425%)</span><span className="font-mono">${commission.toLocaleString()}</span>
          </div>
          {action === 'Sell' && (
            <div className="flex justify-between text-slate-400">
              <span>證交稅 (0.3%)</span><span className="font-mono">${tax.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-slate-200 pt-1 border-t border-slate-800">
            <span>{action === 'Buy' ? '預估付出' : '預估收入'}</span>
            <span className="font-mono">${totalCost.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button onClick={() => setShowConfirm(true)} disabled={!symbol || !prc || !qty}
        className={`w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-30 ${
          action === 'Buy' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
        }`}>
        {action === 'Buy' ? '確認買進' : '確認賣出'}
      </button>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle size={20} />
              <span className="font-bold">確認下單</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">股票</span><span className="text-slate-200">{symbol} {selectedContract?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">方向</span>
                <span className={action === 'Buy' ? 'text-red-400' : 'text-green-400'}>{action === 'Buy' ? '買進' : '賣出'}</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">價格</span><span className="font-mono text-slate-200">${prc}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">數量</span><span className="font-mono text-slate-200">{qty} {orderLot === 'Common' ? '張' : '股'}</span></div>
              <div className="flex justify-between font-medium pt-2 border-t border-slate-800">
                <span className="text-slate-300">預估金額</span><span className="font-mono text-slate-100">${totalCost.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-[10px] text-amber-400/70">⚠️ 此為真實交易，將透過永豐金下單。需經安全閘門核准。</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowConfirm(false)} className="py-2.5 rounded-lg bg-slate-800 text-slate-300 text-sm">取消</button>
              <button onClick={handleSubmit} disabled={submitting}
                className={`py-2.5 rounded-lg text-white text-sm font-medium ${
                  action === 'Buy' ? 'bg-red-600' : 'bg-green-600'
                } ${submitting ? 'opacity-50' : ''}`}>
                {submitting ? '送出中...' : '確認送出'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2">
          <CheckCircle size={16} className="text-emerald-400 mt-0.5" />
          <div className="text-sm text-emerald-400">
            <p className="font-medium">委託已送出</p>
            <p className="text-xs text-emerald-400/70 mt-1">
              {result.trade?.contract?.code} {result.trade?.order?.action} {result.trade?.order?.quantity}張 @ ${result.trade?.order?.price}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
          ❌ {error}
        </div>
      )}
    </div>
  )
}
