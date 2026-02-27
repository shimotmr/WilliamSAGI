'use client'
import { useState, useEffect } from 'react'

interface KItem { id: string; name: string; category: string; description: string; core_points: string; risk_level: string; last_updated: string; tags: string[] }

const RISK_COLORS: Record<string,string> = {'high':'bg-red-100 text-red-700','medium':'bg-yellow-100 text-yellow-700','low':'bg-green-100 text-green-700'}

export default function KnowledgePage() {
  const [items, setItems] = useState<KItem[]>([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string|null>(null)

  useEffect(() => {
    fetch('/api/portal/knowledge').then(r=>r.json()).then(d=>{
      setItems(d.items||[])
      setCats([...new Set((d.items||[]).map((i:KItem)=>i.category).filter(Boolean))] as string[])
    })
  }, [])

  const filtered = items.filter(i => (!q || i.name.includes(q) || i.description?.includes(q)) && (!cat || i.category===cat))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">知識庫 / SOP</h1>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="搜尋..." className="flex-1 border rounded-lg px-4 py-2 text-sm min-w-[200px]"/>
        <select value={cat} onChange={e=>setCat(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">全部分類</option>
          {cats.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {filtered.map(item=>(
          <div key={item.id} className="bg-white rounded-xl shadow overflow-hidden">
            <button onClick={()=>setExpanded(expanded===item.id?null:item.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs ${RISK_COLORS[item.risk_level]||'bg-gray-100 text-gray-500'}`}>{item.risk_level}</span>
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-gray-400">{item.category}</span>
              </div>
              <span className="text-gray-400 text-sm">{expanded===item.id?'▲':'▼'}</span>
            </button>
            {expanded===item.id && (
              <div className="px-4 pb-4 border-t text-sm text-gray-600 space-y-2">
                {item.description && <p>{item.description}</p>}
                {item.core_points && <div className="bg-gray-50 rounded p-3 text-xs whitespace-pre-wrap">{item.core_points}</div>}
              </div>
            )}
          </div>
        ))}
        {!filtered.length && <p className="text-gray-400 text-sm">無資料</p>}
      </div>
    </div>
  )
}
