'use client'
import { useState, useEffect } from 'react'

interface Case { id: string; stage: string; order_id: string; rep: string; dealer: string; end_customer: string; machine: string; probability: number; quantity: number; amount: number; expected: number; order_date: string; ship_date: string; category: string; brand: string; updated_at: string }

const STAGE_COLORS: Record<string,string> = {
  '簽約':'bg-green-100 text-green-700','出貨':'bg-blue-100 text-blue-700',
  '報價':'bg-yellow-100 text-yellow-700','詢價':'bg-gray-100 text-gray-600',
  '取消':'bg-red-100 text-red-400','結案':'bg-gray-100 text-gray-400',
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [stage, setStage] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (stage) p.set('stage', stage)
    if (q) p.set('q', q)
    const r = await fetch(`/api/portal/cases?${p}`)
    const d = await r.json()
    setCases(d.cases || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [stage])

  const stages = ['簽約','出貨','報價','詢價','結案','取消']
  const totalAmt = cases.reduce((s,c) => s + (c.amount||0), 0)
  const totalExp = cases.reduce((s,c) => s + (c.expected||0), 0)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">案件管理</h1>
      <div className="flex gap-4 mb-4 text-sm text-gray-500">
        <span>共 {cases.length} 筆</span>
        <span>合約金額 <strong className="text-gray-800">{(totalAmt/10000).toFixed(0)}萬</strong></span>
        <span>預計金額 <strong className="text-gray-800">{(totalExp/10000).toFixed(0)}萬</strong></span>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={()=>setStage('')} className={`px-3 py-1.5 rounded-lg text-sm ${!stage?'bg-blue-600 text-white':'bg-gray-100'}`}>全部</button>
        {stages.map(s=><button key={s} onClick={()=>setStage(s)} className={`px-3 py-1.5 rounded-lg text-sm ${stage===s?'bg-blue-600 text-white':'bg-gray-100'}`}>{s}</button>)}
        <div className="flex-1"/>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="搜尋客戶/廠商/型號..."
          className="border rounded-lg px-3 py-2 text-sm w-56" />
        <button onClick={load} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">搜尋</button>
      </div>
      {loading ? <p className="text-gray-400 text-sm">載入中...</p> : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="p-3 text-left">狀態</th>
                <th className="p-3 text-left">訂單號</th>
                <th className="p-3 text-left">終端客戶</th>
                <th className="p-3 text-left">經銷商</th>
                <th className="p-3 text-left">機型</th>
                <th className="p-3 text-right">數量</th>
                <th className="p-3 text-right">合約金額</th>
                <th className="p-3 text-left">出貨日</th>
                <th className="p-3 text-left">業務</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cases.map(c=>(
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STAGE_COLORS[c.stage]||'bg-gray-100'}`}>{c.stage}</span></td>
                  <td className="p-3 text-gray-500 text-xs">{c.order_id||'-'}</td>
                  <td className="p-3 font-medium">{c.end_customer}</td>
                  <td className="p-3 text-gray-600">{c.dealer}</td>
                  <td className="p-3 text-gray-600">{c.machine}</td>
                  <td className="p-3 text-right">{c.quantity}</td>
                  <td className="p-3 text-right font-medium">{c.amount?(c.amount/10000).toFixed(1)+'萬':'-'}</td>
                  <td className="p-3 text-gray-500 text-xs">{c.ship_date||'-'}</td>
                  <td className="p-3 text-gray-500">{c.rep}</td>
                </tr>
              ))}
              {!cases.length && <tr><td colSpan={9} className="p-8 text-center text-gray-400">無資料</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
