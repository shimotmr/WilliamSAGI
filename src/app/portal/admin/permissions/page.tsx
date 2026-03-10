'use client'
import { useState, useEffect } from 'react'

interface PortalPermission {
  id: number
  user_email: string
  role: string
  system: string
  created_by: string
  created_at: string
}

const ROLES = ['admin', 'user', 'dealer', 'viewer']

export default function PortalPermissionsPage() {
  const [permissions, setPermissions] = useState<PortalPermission[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => fetch('/api/permissions/portal').then(r => r.json()).then(d => setPermissions(d.permissions || []))
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!email) return
    setSaving(true); setMsg('')
    const r = await fetch('/api/permissions/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: email, role, system: 'portal', created_by: 'admin' })
    })
    const d = await r.json()
    if (d.ok) { setMsg(' 已新增'); setEmail(''); setRole('viewer'); load() }
    else setMsg(` ${d.error}`)
    setSaving(false)
  }

  const remove = async (userEmail: string) => {
    if (!confirm(`確定移除 ${userEmail}？`)) return
    await fetch('/api/permissions/portal', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail, system: 'portal' })
    })
    load()
  }

  const updateRole = async (userEmail: string, newRole: string) => {
    await fetch('/api/permissions/portal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail, role: newRole, system: 'portal' })
    })
    load()
  }

  const roleLabel = (r: string) => {
    switch(r) {
      case 'admin': return '管理員'
      case 'user': return '一般使用者'
      case 'dealer': return '經銷商'
      case 'viewer': return '檢視者'
      default: return r
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Portal 權限管理</h1>

      {/* 新增表單 */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="font-semibold text-sm mb-3">新增權限</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[250px]"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
          <button
            onClick={add}
            disabled={saving || !email}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            新增
          </button>
        </div>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </div>

      {/* 權限列表 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <span className="font-semibold text-sm">目前權限（{permissions.length} 人）</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">角色</th>
              <th className="p-3 text-left">系統</th>
              <th className="p-3 text-left">建立者</th>
              <th className="p-3 text-left">建立時間</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {permissions.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{p.user_email}</td>
                <td className="p-3">
                  <select
                    value={p.role}
                    onChange={e => updateRole(p.user_email, e.target.value)}
                    className={`border rounded px-2 py-1 text-xs font-medium ${
                      p.role === 'admin' ? 'bg-red-100 text-red-700' :
                      p.role === 'dealer' ? 'bg-purple-100 text-purple-700' :
                      p.role === 'user' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                  </select>
                </td>
                <td className="p-3 text-gray-600">{p.system || 'portal'}</td>
                <td className="p-3 text-gray-600">{p.created_by || '-'}</td>
                <td className="p-3 text-gray-400 text-xs">
                  {new Date(p.created_at).toLocaleDateString('zh-TW')}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => remove(p.user_email)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    移除
                  </button>
                </td>
              </tr>
            ))}
            {permissions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  尚無權限資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
