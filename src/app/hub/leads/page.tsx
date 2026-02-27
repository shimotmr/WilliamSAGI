'use client'
import { useState, useEffect } from 'react'

interface Lead { id: string; company: string; contact: string; phone?: string; status: string; assignee?: string; source?: string; created_at: string }

const STATUS_COLORS: Record<string,string> = {
  '新詢問':'bg-blue-100 text-blue-700',
  '跟進中':'bg-yellow-100 text-yellow-700',
  '已派發':'bg-green-100 text-green-700',
  '已結案':'bg-gray-100 text-gray-600',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filter, setFilter] = useState('新詢問')
  const [selected, setSelected] = useState<string[]>([])
  const [assignee, setAssignee] = useState('')

  useEffect(() => {
    fetch('/api/hub/leads')
      .then(r => r.json())
      .then(d => setLeads(d.leads || []))
      .catch(() => {})
  }, [])

  const dispatch = async () => {
    if (!selected.length || !assignee) return
    await fetch('/api/hub/leads/dispatch', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ids: selected, assignee })
    })
    setLeads(l => l.map(lead => selected.includes(lead.id) ? {...lead, status:'已派發', assignee} : lead))
    setSelected([])
    setAssignee('')
  }

  const filtered = leads.filter(l => !filter || l.status === filter)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Lead 派發中心</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['全部','新詢問','跟進中','已派發'].map(s => (
          <button key={s} onClick={() => setFilter(s==='全部'?'':s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter===(s==='全部'?'':s)?'bg-blue-600 text-white':'bg-gray-100'}`}>{s}</button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 mb-4 flex gap-3 items-center">
          <span className="text-sm">已選 {selected.length} 筆</span>
          <input value={assignee} onChange={e=>setAssignee(e.target.value)} placeholder="指派給（姓名/經銷商）"
            className="border rounded px-3 py-1.5 text-sm flex-1 max-w-xs" />
          <button onClick={dispatch} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm">派發</button>
          <button onClick={() => setSelected([])} className="text-gray-400 text-sm">取消</button>
        </div>
      )}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3 text-left w-8"><input type="checkbox" onChange={e => setSelected(e.target.checked?filtered.map(l=>l.id):[])}/></th>
              <th className="p-3 text-left">公司</th>
              <th className="p-3 text-left">聯絡人</th>
              <th className="p-3 text-left">來源</th>
              <th className="p-3 text-left">狀態</th>
              <th className="p-3 text-left">指派</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="p-3"><input type="checkbox" checked={selected.includes(lead.id)}
                  onChange={e => setSelected(s => e.target.checked ? [...s,lead.id] : s.filter(i=>i!==lead.id))}/></td>
                <td className="p-3 font-medium">{lead.company}</td>
                <td className="p-3 text-gray-600">{lead.contact}</td>
                <td className="p-3 text-gray-500">{lead.source || '-'}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[lead.status]||'bg-gray-100'}`}>{lead.status}</span></td>
                <td className="p-3 text-gray-500">{lead.assignee || '-'}</td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} className="p-6 text-center text-gray-400">無資料</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
