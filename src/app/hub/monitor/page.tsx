'use client'
import { useState, useEffect } from 'react'

export default function MonitorPage() {
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    fetch('/api/hub/system-status').then(r=>r.json()).then(setStatus).catch(()=>{})
  }, [])

  const metrics = [
    { label: 'Active Tasks', value: status?.activeTasks ?? '-', color: 'text-blue-600' },
    { label: 'Completed Today', value: status?.completedToday ?? '-', color: 'text-green-600' },
    { label: 'Failed Today', value: status?.failedToday ?? '-', color: 'text-red-500' },
    { label: 'Pending', value: status?.pendingTasks ?? '-', color: 'text-yellow-600' },
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">系統監控</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>
      {status?.recentTasks && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-5 py-3 border-b font-semibold text-sm">最近任務</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {status.recentTasks.map((t:any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{t.title}</td>
                  <td className="p-3 text-gray-500 text-xs">{t.assignee}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      t.status==='已完成'?'bg-green-100 text-green-700':
                      t.status==='執行中'?'bg-blue-100 text-blue-700':
                      t.status==='失敗'?'bg-red-100 text-red-600':'bg-gray-100 text-gray-500'
                    }`}>{t.status}</span>
                  </td>
                  <td className="p-3 text-gray-400 text-xs">{t.updated_at ? new Date(t.updated_at).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
