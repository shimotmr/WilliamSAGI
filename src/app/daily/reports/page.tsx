'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Report { id: string; title: string; author: string; type: string; created_at: string; task_id: number }

export default function DailyReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [type, setType] = useState('')

  useEffect(() => {
    const p = type ? `?type=${encodeURIComponent(type)}` : ''
    fetch(`/api/hub/reports${p}`).then(r=>r.json()).then(d=>setReports(d.reports||[]))
  }, [type])

  const types = ['分析報告','研究報告','技術文檔','決策建議','審查報告','監控規格']

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">報告庫</h1>
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={()=>setType('')} className={`px-3 py-1.5 rounded-lg text-sm ${!type?'bg-blue-600 text-white':'bg-gray-100'}`}>全部</button>
        {types.map(t=><button key={t} onClick={()=>setType(t)} className={`px-3 py-1.5 rounded-lg text-sm ${type===t?'bg-blue-600 text-white':'bg-gray-100'}`}>{t}</button>)}
      </div>
      <div className="space-y-3">
        {reports.map(r=>(
          <Link key={r.id} href={`/hub/reports/${r.id}`} className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-gray-400 mt-1">{r.author} · {r.type} · {new Date(r.created_at).toLocaleDateString('zh-TW')}</p>
              </div>
              {r.task_id && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">#{r.task_id}</span>}
            </div>
          </Link>
        ))}
        {!reports.length && <p className="text-gray-400 text-sm">無報告</p>}
      </div>
    </div>
  )
}
