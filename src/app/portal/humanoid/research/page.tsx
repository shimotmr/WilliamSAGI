'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const TAGS = ['全部', 'VLA', '宇樹', '天工', '市場分析', '競品', '開源']

export default function HumanoidResearchPage() {
  const [reports, setReports] = useState<any[]>([])
  const [tag, setTag] = useState('全部')
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/portal/humanoid').then(r => r.json()).then(d => setReports(d.reports || []))
  }, [])

  const filtered = reports.filter(r =>
    (tag === '全部' || r.title.includes(tag)) &&
    (!q || r.title.includes(q) || r.author?.includes(q))
  )

  const typeColors: Record<string, string> = {
    '研究報告': 'bg-purple-100 text-purple-700',
    'research': 'bg-purple-100 text-purple-700',
    'technical_resource': 'bg-blue-100 text-blue-700',
    '商業戰略': 'bg-green-100 text-green-700',
    'analysis': 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔬</span>
        <div>
          <h1 className="text-2xl font-bold">研究報告</h1>
          <p className="text-sm text-gray-500">VLA 模型、演算法研究、市場分析、競品調查</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {TAGS.map(t => (
          <button key={t} onClick={() => setTag(t)}
            className={`px-3 py-1.5 rounded-lg text-sm ${tag === t ? 'bg-slate-800 text-white' : 'bg-gray-100'}`}>
            {t}
          </button>
        ))}
        <div className="flex-1" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜尋報告..."
          className="border rounded-lg px-3 py-2 text-sm w-48" />
      </div>

      <p className="text-xs text-gray-400 mb-4">共 {filtered.length} 份資料</p>

      <div className="space-y-3">
        {filtered.map(r => (
          <Link key={r.id} href={`/hub/reports/${r.id}`}
            className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-gray-400 mt-1">{r.author} · {new Date(r.created_at).toLocaleDateString('zh-TW')}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ml-3 flex-shrink-0 ${typeColors[r.type] || 'bg-gray-100 text-gray-500'}`}>
                {r.type}
              </span>
            </div>
          </Link>
        ))}
        {!filtered.length && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">🔬</p>
            <p>尚無相關研究資料</p>
            <p className="text-xs mt-1">資料從 AI 報告庫自動匯入</p>
          </div>
        )}
      </div>
    </div>
  )
}
