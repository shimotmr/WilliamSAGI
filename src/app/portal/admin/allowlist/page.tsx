'use client'
import { useState, useEffect } from 'react'

interface AllowUser { email: string; role: string; name: string; created_at: string }

const ROLES = ['admin', 'manager', 'user', 'readonly']

export default function AllowlistPage() {
  const [users, setUsers] = useState<AllowUser[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('user')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/portal/admin/allowlist').then(r=>r.json()).then(d=>setUsers(d.users||[]))
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!email) return
    setSaving(true); setMsg('')
    const r = await fetch('/api/portal/admin/allowlist', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, name, role })
    })
    const d = await r.json()
    if (d.ok) { setMsg('✅ 已新增'); setEmail(''); setName(''); setRole('user'); load() }
    else setMsg(`❌ ${d.error}`)
    setSaving(false)
  }

  const remove = async (email: string) => {
    if (!confirm(`確定移除 ${email}？`)) return
    await fetch('/api/portal/admin/allowlist', {
      method: 'DELETE',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email })
    })
    load()
  }

  // 從 employees 快速新增
  const [empSearch, setEmpSearch] = useState('')
  const [empResults, setEmpResults] = useState<any[]>([])
  const searchEmp = async () => {
    if (!empSearch) return
    const r = await fetch(`/api/portal/employees?q=${empSearch}`)
    const d = await r.json()
    setEmpResults((d.employees||[]).filter((e:any)=>e.email).slice(0,8))
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">存取白名單管理</h1>

      {/* 快速從員工名冊新增 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <h2 className="font-semibold text-sm mb-3">從員工名冊快速新增</h2>
        <div className="flex gap-2 mb-3">
          <input value={empSearch} onChange={e=>setEmpSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchEmp()}
            placeholder="搜尋員工姓名..." className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white" />
          <button onClick={searchEmp} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">搜尋</button>
        </div>
        {empResults.length > 0 && (
          <div className="space-y-1">
            {empResults.map(e => (
              <div key={e.email} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                <span>{e.name} <span className="text-gray-400 text-xs">({e.department})</span></span>
                <span className="text-gray-500 text-xs mr-3">{e.email}</span>
                <button onClick={async()=>{
                  await fetch('/api/portal/admin/allowlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e.email,name:e.name,role:'user'})})
                  setMsg(`✅ 已新增 ${e.name}`); load()
                }} className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg">新增</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 手動新增 */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="font-semibold text-sm mb-3">手動新增</h2>
        <div className="flex gap-2 flex-wrap">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]" />
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="姓名"
            className="border rounded-lg px-3 py-2 text-sm w-28" />
          <select value={role} onChange={e=>setRole(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={add} disabled={saving||!email} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">新增</button>
        </div>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </div>

      {/* 白名單列表 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <span className="font-semibold text-sm">目前白名單（{users.length} 人）</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3 text-left">姓名</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">角色</th>
              <th className="p-3 text-left">加入時間</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u=>(
              <tr key={u.email} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{u.name||'-'}</td>
                <td className="p-3 text-gray-600">{u.email}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role==='admin'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                <td className="p-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString('zh-TW')}</td>
                <td className="p-3"><button onClick={()=>remove(u.email)} className="text-red-400 hover:text-red-600 text-xs">移除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
