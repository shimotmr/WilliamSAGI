'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/hub'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '登入失敗'); return }
      router.push(data.role === 'admin' ? next : '/portal')
    } catch { setError('網路錯誤，請稍後再試') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">WilliamSAGI</h1>
        <p className="text-gray-400 text-center text-sm mb-8">請使用公司帳號登入</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="公司 Email" required
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="Zimbra 密碼" required
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50">
            {loading ? '驗證中...' : '登入'}
          </button>
        </form>
      </div>
    </div>
  )
}
