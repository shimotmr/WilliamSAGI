'use client'
import { useState, useEffect } from 'react'

interface Permission {
  id: number
  user_email: string
  role: string
  created_by: string | null
  created_at: string
}

const ROLES = ['admin', 'user', 'viewer']
const ROLE_LABELS: Record<string, string> = { admin: '管理員', user: '使用者', viewer: '檢視者' }
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400',
  user: 'bg-blue-500/20 text-blue-400',
  viewer: 'bg-zinc-500/20 text-zinc-400',
}

export default function HubPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () =>
    fetch('/api/hub/permissions')
      .then((r) => r.json())
      .then((d) => setPermissions(d.permissions || []))

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!email) return
    setSaving(true)
    setMsg('')
    const r = await fetch('/api/hub/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: email, role }),
    })
    const d = await r.json()
    if (d.ok) { setMsg('✅ 已新增'); setEmail(''); load() }
    else setMsg(`❌ ${d.error}`)
    setSaving(false)
  }

  const remove = async (userEmail: string) => {
    if (!confirm(`確定移除 ${userEmail}？`)) return
    await fetch('/api/hub/permissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail }),
    })
    load()
  }

  const updateRole = async (userEmail: string, newRole: string) => {
    await fetch('/api/hub/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail, role: newRole }),
    })
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hub 權限管理</h1>
        <p className="text-sm text-[var(--foreground-muted)]">管理 Hub 系統的使用者存取權限</p>
      </div>

      {/* 新增表單 */}
      <div className="rounded-xl border border-white/10 bg-[var(--card)] p-4">
        <h2 className="text-sm font-semibold mb-3">新增權限</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="AD 帳號或 Email"
            className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-white/10 bg-[var(--background)] px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <button
            onClick={add}
            disabled={saving || !email}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition"
          >
            {saving ? '新增中…' : '新增'}
          </button>
        </div>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </div>

      {/* 權限列表 */}
      <div className="rounded-xl border border-white/10 bg-[var(--card)] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
          <span className="text-sm font-semibold">目前權限（{permissions.length} 人）</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--foreground-muted)] uppercase border-b border-white/5">
              <tr>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">角色</th>
                <th className="p-3 text-left">建立時間</th>
                <th className="p-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {permissions.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition">
                  <td className="p-3 font-medium">{p.user_email}</td>
                  <td className="p-3">
                    <select
                      value={p.role}
                      onChange={(e) => updateRole(p.user_email, e.target.value)}
                      className={`rounded-md px-2 py-1 text-xs font-medium border-0 ${ROLE_COLORS[p.role] || ''}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-[var(--foreground-muted)] text-xs">
                    {new Date(p.created_at).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => remove(p.user_email)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      移除
                    </button>
                  </td>
                </tr>
              ))}
              {permissions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--foreground-muted)]">
                    尚無權限資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
