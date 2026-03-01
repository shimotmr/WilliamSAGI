'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPw, setShowPw]     = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '帳號或密碼錯誤'); return }
      router.push(data.role === 'admin' ? '/hub' : '/portal')
    } catch {
      setError('網路連線失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-wrap {
          min-height: 100vh;
          background: #050506;
          display: grid;
          place-items: center;
          padding: 1.5rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          padding: 2.25rem;
        }
        .login-logo {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #EDEDEF;
          margin-bottom: 0.25rem;
        }
        .login-logo span {
          background: linear-gradient(135deg,#5E6AD2,#818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .login-sub {
          font-size: 0.8125rem;
          color: #8A8F98;
          margin-bottom: 2rem;
        }
        .login-form { display: flex; flex-direction: column; gap: 0.875rem; }
        .login-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: #EDEDEF;
          font-size: 1rem;
          outline: none;
        }
        .login-input:focus { border-color: rgba(94,106,210,0.6); }
        .login-input::placeholder { color: #8A8F98; }
        .pw-wrap { position: relative; }
        .pw-toggle {
          position: absolute; right: 0.875rem; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: #8A8F98; font-size: 0.75rem; cursor: pointer;
        }
        .login-btn {
          width: 100%; padding: 0.875rem;
          border-radius: 10px; border: none; cursor: pointer;
          background: linear-gradient(135deg,#5E6AD2,#6872D9);
          color: #fff; font-size: 1rem; font-weight: 600;
        }
        .login-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .login-error { font-size: 0.8125rem; color: #f87171; }
        .login-hint {
          margin-top: 1.25rem;
          font-size: 0.75rem;
          color: #8A8F98;
          text-align: center;
        }
      `}</style>

      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">
            William<span>SAGI</span>
          </div>
          <p className="login-sub">Super AGI Control Hub</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <input
              type="email" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="login-input" autoComplete="email" required
            />
            <div className="pw-wrap">
              <input
                type={showPw ? 'text' : 'password'} placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)}
                className="login-input" autoComplete="current-password" required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? '驗證中…' : '進入 Hub →'}
            </button>
          </form>

          <p className="login-hint">使用公司 Email 登入</p>
        </div>
      </div>
    </>
  )
}
