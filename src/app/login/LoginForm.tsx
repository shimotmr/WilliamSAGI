'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '帳號或密碼錯誤')
        return
      }

      window.location.href = data.role === 'admin' ? '/hub' : '/portal'
    } catch {
      setError('網路連線失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <Card className="w-full rounded-3xl p-8">
          <div className="mb-8">
            <div className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              William<span className="text-[var(--primary)]">SAGI</span>
            </div>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Super AGI Control Hub
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                AD 帳號
              </label>
              <Input
                type="text"
                placeholder="請輸入 AD 帳號"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  密碼
                </label>
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>

              <Input
                type={showPw ? 'text' : 'password'}
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? '驗證中…' : '進入 Hub →'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[var(--foreground-muted)]">
            請輸入 AD 帳號及密碼登入系統
          </p>
        </Card>
      </div>
    </div>
  )
}
