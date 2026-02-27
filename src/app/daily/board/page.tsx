'use client'
import { useState, useEffect } from 'react'

interface Task { id: number; title: string; status: string; assignee: string; priority: string; updated_at: string; description: string }

const STATUS_COLS = ['待執行','待派發','執行中','已完成','失敗']
const PRIORITY_COLORS: Record<string,string> = {'P0':'bg-red-100 text-red-700','P1':'bg-orange-100 text-orange-700','P2':'bg-blue-100 text-blue-700','P3':'bg-gray-100 text-gray-500'}

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'all'|string>('active')

  const load = () => {
    const s = filter === 'active' ? '待執行,待派發,執行中' : filter === 'done' ? '已完成' : ''
    const p = s ? `?status=${encodeURIComponent(s)}` : ''
    fetch(`/api/hub/board${p}`).then(r=>r.json()).then(d=>setTasks(d.tasks||[]))
  }
  useEffect(load, [filter])

  const grouped = STATUS_COLS.reduce((acc:Record<string,Task[]>, s) => {
    acc[s] = tasks.filter(t => t.status === s)
    return acc
  }, {})

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">任務看板</h1>
        <div className="flex gap-2">
          {[{val:'active',label:'進行中'},{val:'done',label:'已完成'},{val:'all',label:'全部'}].map(f=>(
            <button key={f.val} onClick={()=>setFilter(f.val)} className={`px-3 py-1.5 rounded-lg text-sm ${filter===f.val?'bg-blue-600 text-white':'bg-gray-100'}`}>{f.label}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLS.filter(s => filter !== 'done' || s === '已完成').filter(s => filter !== 'active' || ['待執行','待派發','執行中'].includes(s)).map(status => (
          <div key={status} className="flex-shrink-0 w-72">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">{status}</h3>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{grouped[status]?.length||0}</span>
            </div>
            <div className="space-y-2">
              {(grouped[status]||[]).map(t=>(
                <div key={t.id} className="bg-white rounded-xl shadow p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[t.priority]||'bg-gray-100'}`}>{t.priority}</span>
                    <span className="text-xs text-gray-400">#{t.id}</span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.assignee}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
