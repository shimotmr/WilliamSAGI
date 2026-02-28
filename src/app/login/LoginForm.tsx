'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{background: 'oklch(0.10 0.02 260)'}}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{background: 'radial-gradient(circle, oklch(0.55 0.25 280), transparent)'}} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15"
          style={{background: 'radial-gradient(circle, oklch(0.50 0.22 250), transparent)'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{background: 'radial-gradient(circle, oklch(0.60 0.20 270), transparent)'}} />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl border p-8 shadow-2xl"
          style={{background: 'oklch(0.15 0.015 260)', borderColor: 'oklch(0.25 0.02 260)'}}>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{background: 'linear-gradient(135deg, oklch(0.55 0.25 280), oklch(0.50 0.28 300))'}}>
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight"
              style={{background: 'linear-gradient(135deg, oklch(0.85 0.08 280), oklch(0.90 0.05 250))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              SAGIHUB
            </h1>
            <p className="mt-2 text-sm" style={{color: 'oklch(0.60 0.02 260)'}}>
              請使用公司帳號登入
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
              style={{background: 'oklch(0.18 0.05 20)', borderColor: 'oklch(0.45 0.20 20)', color: 'oklch(0.75 0.18 20)'}}>
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{color: 'oklch(0.55 0.02 260)'}} />
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="公司 Email" required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{background: 'oklch(0.12 0.015 260)', border: '1px solid oklch(0.25 0.02 260)',
                  color: 'oklch(0.90 0.01 260)'}}
                onFocus={e => (e.target.style.borderColor = 'oklch(0.55 0.25 280)')}
                onBlur={e => (e.target.style.borderColor = 'oklch(0.25 0.02 260)')} />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{color: 'oklch(0.55 0.02 260)'}} />
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="Zimbra 密碼" required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{background: 'oklch(0.12 0.015 260)', border: '1px solid oklch(0.25 0.02 260)',
                  color: 'oklch(0.90 0.01 260)'}}
                onFocus={e => (e.target.style.borderColor = 'oklch(0.55 0.25 280)')}
                onBlur={e => (e.target.style.borderColor = 'oklch(0.25 0.02 260)')} />
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
              style={{background: 'linear-gradient(135deg, oklch(0.55 0.25 280), oklch(0.50 0.28 300))'}}
              onMouseEnter={e => !loading && ((e.target as HTMLElement).style.opacity = '0.9')}
              onMouseLeave={e => ((e.target as HTMLElement).style.opacity = '1')}>
              {loading ? <><Loader2 size={16} className="animate-spin" />驗證中...</> : '登入'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs" style={{color: 'oklch(0.45 0.02 260)'}}>
            William Hub — AI Control Panel · © 2026
          </p>
        </div>
      </div>
    </div>
  )
}
