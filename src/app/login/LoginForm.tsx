'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPw, setShowPw]     = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') || '/hub'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '帳號或密碼錯誤'); return }
      router.push(data.role === 'admin' ? next : '/portal')
    } catch { setError('網路連線失敗') }
    finally   { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:'100vh',
      fontFamily:'"Inter",-apple-system,BlinkMacSystemFont,sans-serif',
      position:'relative',
      overflow:'hidden',
      background:'#0a0d14',
      display:'flex',alignItems:'center',justifyContent:'center',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Background gradient mesh — this is what makes glassmorphism work */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(88,28,220,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(99,102,241,0.2) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 50% 10%, rgba(139,92,246,0.15) 0%, transparent 50%)',pointerEvents:'none'}}/>

      {/* Noise texture overlay */}
      <div style={{position:'absolute',inset:0,opacity:0.03,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',pointerEvents:'none'}}/>

      {/* Glass card */}
      <div style={{
        position:'relative',
        width:'100%',maxWidth:400,margin:'0 20px',
        background:'rgba(14,18,30,0.6)',
        backdropFilter:'blur(24px)',
        WebkitBackdropFilter:'blur(24px)',
        border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:20,
        padding:'40px 36px',
        boxShadow:'0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:48,height:48,background:'linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)',borderRadius:13,marginBottom:16,boxShadow:'0 8px 20px rgba(124,58,237,0.4)'}}>
            <span style={{color:'#fff',fontWeight:800,fontSize:20,letterSpacing:'-0.5px'}}>W</span>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:'#F1F5F9',letterSpacing:'-0.4px'}}>SAGI Hub</div>
          <div style={{fontSize:13,color:'rgba(148,163,184,0.7)',marginTop:4}}>AI Control Panel</div>
        </div>

        {error && (
          <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,padding:'10px 14px',marginBottom:20,color:'#FCA5A5',fontSize:13,display:'flex',gap:8,alignItems:'flex-start'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'rgba(148,163,184,0.9)',marginBottom:7,letterSpacing:'0.03em'}}>電子郵件</label>
            <input
              type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="you@company.com" required
              style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'11px 14px',color:'#F1F5F9',fontSize:14,outline:'none',fontFamily:'inherit',boxSizing:'border-box',transition:'border-color 0.15s,box-shadow 0.15s'}}
              onFocus={e=>{e.target.style.borderColor='rgba(124,58,237,0.7)';e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.15)'}}
              onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none'}}
            />
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'rgba(148,163,184,0.9)',marginBottom:7,letterSpacing:'0.03em'}}>密碼</label>
            <div style={{position:'relative'}}>
              <input
                type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'11px 40px 11px 14px',color:'#F1F5F9',fontSize:14,outline:'none',fontFamily:'inherit',boxSizing:'border-box',transition:'border-color 0.15s,box-shadow 0.15s'}}
                onFocus={e=>{e.target.style.borderColor='rgba(124,58,237,0.7)';e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.15)'}}
                onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none'}}
              />
              <button type="button" onClick={()=>setShowPw(!showPw)}
                style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(148,163,184,0.6)',padding:0,display:'flex'}}>
                {showPw
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{marginTop:6,padding:'12px',background:'linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:loading?0.7:1,boxShadow:'0 6px 20px rgba(124,58,237,0.4)',transition:'all 0.15s',fontFamily:'inherit'}}>
            {loading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" style={{animation:'spin 0.8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
            {loading ? '驗證中…' : '登入'}
          </button>
        </form>

        <div style={{marginTop:28,textAlign:'center',color:'rgba(71,85,105,0.8)',fontSize:11,letterSpacing:'0.02em'}}>
          William SAGI · Autonomous Agent OS
        </div>
      </div>

      <style>{`
        input::placeholder{color:rgba(71,85,105,0.7)}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  )
}
