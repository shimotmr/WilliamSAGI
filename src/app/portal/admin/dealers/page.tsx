'use client'
import { useState, useEffect } from 'react'

interface Dealer { id: string; name: string; contact: string; phone: string; email: string; region: string; status: string; address: string }

const STATUS_COLORS: Record<string,string> = {'活躍':'bg-green-100 text-green-700','停用':'bg-gray-100 text-gray-400','觀察中':'bg-yellow-100 text-yellow-700'}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/portal/dealers').then(r=>r.json()).then(d=>setDealers(d.dealers||[]))
  }, [])

  const filtered = dealers.filter(d => !q || d.name.includes(q) || d.contact?.includes(q) || d.region?.includes(q))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">經銷商管理</h1>
      <div className="flex gap-3 mb-4">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="搜尋名稱/聯絡人/地區..."
          className="flex-1 border rounded-lg px-4 py-2 text-sm" />
      </div>
      <p className="text-xs text-gray-400 mb-4">共 {filtered.length} 家</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(d=>(
          <div key={d.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold">{d.name}</p>
              <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[d.status]||'bg-gray-100'}`}>{d.status||'未知'}</span>
            </div>
            <p className="text-sm text-gray-500">{d.region}</p>
            {d.contact && <p className="text-sm text-gray-600 mt-1">👤 {d.contact}</p>}
            {d.phone && <p className="text-sm text-gray-500">📞 {d.phone}</p>}
            {d.email && <a href={`mailto:${d.email}`} className="text-sm text-blue-500 hover:underline">✉️ {d.email}</a>}
          </div>
        ))}
        {!filtered.length && <p className="text-gray-400 col-span-3 text-sm">無資料</p>}
      </div>
    </div>
  )
}
