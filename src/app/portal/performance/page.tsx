'use client'
import { useState, useEffect } from 'react'

interface RepPerf { rep: string; target: number; actual: number; rate: number }

export default function PerformancePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<RepPerf[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/portal/performance?year=${year}&month=${month}`)
      .then(r=>r.json()).then(d=>{setData(d.summary||[]); setLoading(false)})
  }, [year, month])

  const totalTarget = data.reduce((s,r)=>s+r.target,0)
  const totalActual = data.reduce((s,r)=>s+r.actual,0)
  const totalRate = totalTarget > 0 ? Math.round(totalActual/totalTarget*100) : 0

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">業績達成</h1>
        <div className="flex gap-2">
          <select value={year} onChange={e=>setYear(+e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e=>setMonth(+e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* 總覽卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {label:'總目標',val:`${(totalTarget/10000).toFixed(0)}萬`},
          {label:'總業績',val:`${(totalActual/10000).toFixed(0)}萬`},
          {label:'達成率',val:`${totalRate}%`,hi:totalRate>=100},
        ].map(c=>(
          <div key={c.label} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-400 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.hi?'text-green-600':''}`}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* 個人達成表 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? <p className="p-6 text-gray-400 text-sm">載入中...</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="p-3 text-left">業務</th>
                <th className="p-3 text-right">目標</th>
                <th className="p-3 text-right">業績</th>
                <th className="p-3 text-left">達成率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map(r=>(
                <tr key={r.rep}>
                  <td className="p-3 font-medium">{r.rep}</td>
                  <td className="p-3 text-right text-gray-500">{(r.target/10000).toFixed(1)}萬</td>
                  <td className="p-3 text-right font-medium">{(r.actual/10000).toFixed(1)}萬</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${r.rate>=100?'bg-green-500':r.rate>=60?'bg-blue-500':'bg-orange-400'}`}
                          style={{width:`${Math.min(r.rate,100)}%`}}/>
                      </div>
                      <span className={`text-xs font-medium w-10 text-right ${r.rate>=100?'text-green-600':''}`}>{r.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {!data.length && <tr><td colSpan={4} className="p-6 text-center text-gray-400">無資料</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
