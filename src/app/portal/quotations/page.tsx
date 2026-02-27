'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Quotation { id: string; quotation_no: string; customer_name: string; quote_date: string; valid_until: string; total_amount: number; currency: string; status: string; created_by: string }

const STATUS_COLORS: Record<string,string> = {
  '草稿':'bg-gray-100 text-gray-500','已送出':'bg-blue-100 text-blue-700',
  '已接受':'bg-green-100 text-green-700','已拒絕':'bg-red-100 text-red-400',
  '已過期':'bg-yellow-100 text-yellow-600',
}

export default function QuotationsPage() {
  const [quotes, setQuotes] = useState<Quotation[]>([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (status) p.set('status', status)
    if (q) p.set('q', q)
    const r = await fetch(`/api/portal/quotations?${p}`)
    const d = await r.json()
    setQuotes(d.quotations || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [status])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">報價管理</h1>
        <Link href="/portal/quotations/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">+ 新增報價</Link>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['','草稿','已送出','已接受','已拒絕'].map(s=>(
          <button key={s} onClick={()=>setStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm ${status===s?'bg-blue-600 text-white':'bg-gray-100'}`}>{s||'全部'}</button>
        ))}
        <div className="flex-1"/>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="搜尋客戶/報價單號..."
          className="border rounded-lg px-3 py-2 text-sm w-48" />
      </div>
      {loading ? <p className="text-gray-400 text-sm">載入中...</p> : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="p-3 text-left">報價單號</th>
                <th className="p-3 text-left">客戶</th>
                <th className="p-3 text-left">報價日期</th>
                <th className="p-3 text-left">有效期</th>
                <th className="p-3 text-right">金額</th>
                <th className="p-3 text-left">狀態</th>
                <th className="p-3 text-left">建立者</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotes.map(q=>(
                <tr key={q.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="p-3"><Link href={`/portal/quotations/${q.id}`} className="text-blue-600 hover:underline font-mono text-xs">{q.quotation_no}</Link></td>
                  <td className="p-3 font-medium">{q.customer_name}</td>
                  <td className="p-3 text-gray-500 text-xs">{q.quote_date}</td>
                  <td className="p-3 text-gray-500 text-xs">{q.valid_until}</td>
                  <td className="p-3 text-right font-medium">{q.currency} {q.total_amount?.toLocaleString()}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[q.status]||'bg-gray-100'}`}>{q.status}</span></td>
                  <td className="p-3 text-gray-500 text-xs">{q.created_by}</td>
                </tr>
              ))}
              {!quotes.length && <tr><td colSpan={7} className="p-6 text-center text-gray-400">無資料</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
