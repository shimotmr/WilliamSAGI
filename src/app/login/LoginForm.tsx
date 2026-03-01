'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPw, setShowPw]     = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const router  = useRouter()

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    card.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

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
    <div style={{
      minHeight: '100vh', fontFamily: '"Inter",system-ui,sans-serif',
      background: '#050506', display: 'flex', alignItems: 'center',
      justifyContent: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '10%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(88,28,220,0.18) 0%, transparent 70%)',
          animation: 'floatBlob 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '5%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(94,106,210,0.12) 0%, transparent 70%)',
          animation: 'floatBlob 16s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Grid overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      <style>{`
        @keyframes floatBlob {
          0%,100%{transform:translateY(0) rotate(0deg)}
          50%{transform:translateY(-24px) rotate(1.5deg)}
        }
        .login-input {
          width:100%; padding:0.75rem 1rem; border-radius:10px;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
          color:#EDEDEF; font-size:0.9rem; outline:none;
          transition:border-color 200ms;
        }
        .login-input:focus { border-color:rgba(94,106,210,0.5); }
        .login-input::placeholder { color:#8A8F98; }
        .login-btn {
          width:100%; padding:0.875rem; border-radius:10px; border:none; cursor:pointer;
          background:linear-gradient(135deg,#5E6AD2,#6872D9);
          color:#fff; font-size:0.9rem; font-weight:600;
          letter-spacing:-0.01em; transition:opacity 200ms;
        }
        .login-btn:hover { opacity:0.88; }
        .login-btn:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>

      {/* Card */}
      <div ref={cardRef} onMouseMove={handleMouseMove} style={{
        position: 'relative', width: '100%', maxWidth: '400px', margin: '1.5rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', padding: '2.5rem',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#EDEDEF', marginBottom: '0.375rem' }}>
            William<span style={{ background: 'linear-gradient(135deg,#5E6AD2,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SAGI</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#8A8F98' }}>Super AGI Control Hub</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <input type="email" placeholder="admin@sagi.local" value={email}
            onChange={e => setEmail(e.target.value)} className="login-input" required />
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} className="login-input" required />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#8A8F98', cursor: 'pointer', fontSize: '0.75rem',
            }}>{showPw ? 'Hide' : 'Show'}</button>
          </div>
          {error && <p style={{ fontSize: '0.8rem', color: '#f87171', margin: 0 }}>{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '驗證中…' : '進入 Hub →'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '0.875rem', background: 'rgba(94,106,210,0.08)',
          border: '1px solid rgba(94,106,210,0.15)', borderRadius: '10px' }}>
          <p style={{ fontSize: '0.75rem', color: '#8A8F98', margin: 0 }}>
            <span style={{ color: '#5E6AD2', fontWeight: 600 }}>Admin</span>：admin@sagi.local / sagi2026
          </p>
        </div>
      </div>
    </div>
  )
}
