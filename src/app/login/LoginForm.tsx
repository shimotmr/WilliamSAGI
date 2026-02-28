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
    } catch { setError('網路連線失敗，請稍後再試') }
    finally   { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', background:'transparent', border:'1px solid rgba(148,163,184,0.15)',
    borderRadius:8, padding:'10px 14px', color:'#F8FAFC', fontSize:14, outline:'none',
    fontFamily:'inherit', boxSizing:'border-box', transition:'border-color 0.15s',
  }

  return (
    <div style={{
      minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr',
      background:'#080D18', fontFamily:'"Inter",-apple-system,sans-serif',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        input::placeholder{color:#475569}
        input:focus{border-color:rgba(129,140,248,0.6)!important;box-shadow:0 0 0 3px rgba(129,140,248,0.08)}
        @media(max-width:640px){.login-grid{grid-template-columns:1fr!important}.login-right{display:none!important}}
      `}</style>

      {/* Left — form panel */}
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px 56px',position:'relative',overflow:'hidden'}}>
        {/* dot grid bg */}
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(148,163,184,0.08) 1px,transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none'}}/>
        {/* glow */}
        <div style={{position:'absolute',top:-120,left:-80,width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>

        <div style={{position:'relative',maxWidth:360}}>
          {/* Brand */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:48}}>
            <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#6366F1,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#fff',fontWeight:800,fontSize:14,letterSpacing:'-0.5px'}}>W</span>
            </div>
            <span style={{color:'#F8FAFC',fontWeight:700,fontSize:16,letterSpacing:'-0.3px'}}>SAGI Hub</span>
          </div>

          <h1 style={{fontSize:28,fontWeight:700,color:'#F8FAFC',letterSpacing:'-0.6px',margin:'0 0 6px'}}>歡迎回來</h1>
          <p style={{fontSize:14,color:'#64748B',margin:'0 0 32px',lineHeight:1.5}}>使用公司帳號登入以繼續</p>

          {error && (
            <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:20,color:'#FCA5A5',fontSize:13,display:'flex',gap:8,alignItems:'flex-start'}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:500,color:'#94A3B8',marginBottom:6,letterSpacing:'0.02em'}}>電子郵件</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="you@company.com" required style={inputStyle}
                onFocus={e=>{(e.target as HTMLInputElement).style.borderColor='rgba(129,140,248,0.6)'}}
                onBlur={e=>{(e.target as HTMLInputElement).style.borderColor='rgba(148,163,184,0.15)'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:500,color:'#94A3B8',marginBottom:6,letterSpacing:'0.02em'}}>密碼</label>
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••" required style={{...inputStyle,paddingRight:40}}
                  onFocus={e=>{(e.target as HTMLInputElement).style.borderColor='rgba(129,140,248,0.6)'}}
                  onBlur={e=>{(e.target as HTMLInputElement).style.borderColor='rgba(148,163,184,0.15)'}} />
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#64748B',padding:0,display:'flex'}}>
                  {showPw
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              marginTop:6, padding:'11px 16px', background:'#6366F1', color:'#fff', border:'none',
              borderRadius:8, fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              opacity:loading?0.7:1, transition:'all 0.15s', fontFamily:'inherit',
            }}>
              {loading && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{animation:'spin 0.8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
              {loading ? '驗證中…' : '登入'}
            </button>
          </form>

          <p style={{marginTop:32,fontSize:12,color:'#334155',textAlign:'center'}}>SAGI Hub · AI Control Panel</p>
        </div>
      </div>

      {/* Right — brand panel */}
      <div className="login-right" style={{
        background:'linear-gradient(135deg,#0D1425 0%,#0F172A 100%)',
        borderLeft:'1px solid rgba(148,163,184,0.06)',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        padding:60,position:'relative',overflow:'hidden',
      }}>
        {/* mesh gradient */}
        <div style={{position:'absolute',top:'15%',left:'20%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 60%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'10%',right:'10%',width:220,height:220,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 60%)',pointerEvents:'none'}}/>
        {/* grid */}
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(148,163,184,0.06) 1px,transparent 1px)',backgroundSize:'32px 32px',pointerEvents:'none'}}/>

        <div style={{position:'relative',textAlign:'center',maxWidth:340}}>
          {/* abstract icon cluster */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginBottom:40}}>
            {[
              {bg:'rgba(99,102,241,0.15)',border:'rgba(99,102,241,0.25)',color:'#818CF8'},
              {bg:'rgba(16,185,129,0.12)',border:'rgba(16,185,129,0.2)',color:'#34D399'},
              {bg:'rgba(245,158,11,0.12)',border:'rgba(245,158,11,0.2)',color:'#FCD34D'},
            ].map((s,i)=>(
              <div key={i} style={{width:52,height:52,borderRadius:14,background:s.bg,border:`1px solid ${s.border}`,display:'flex',alignItems:'center',justifyContent:'center',color:s.color,transform:i===1?'translateY(-8px)':'none',boxShadow:`0 4px 24px ${s.bg}`}}>
                {i===0 && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V5"/><circle cx="12" cy="4" r="1" fill="currentColor"/></svg>}
                {i===1 && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
                {i===2 && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>}
              </div>
            ))}
          </div>

          <h2 style={{fontSize:22,fontWeight:700,color:'#F8FAFC',letterSpacing:'-0.5px',margin:'0 0 12px',lineHeight:1.3}}>
            SAGI 自主 Agent<br/>作業系統
          </h2>
          <p style={{fontSize:14,color:'#64748B',lineHeight:1.7,margin:'0 0 36px'}}>
            全自動任務派發 · 即時監控<br/>失敗自愈 · 多 Agent 協同
          </p>

          {/* stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {[{n:'806+',l:'已完成任務'},{n:'6',l:'活躍 Agent'},{n:'99%',l:'系統可用率'}].map(s=>(
              <div key={s.l} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(148,163,184,0.08)',borderRadius:10,padding:'14px 8px'}}>
                <div style={{fontSize:20,fontWeight:700,color:'#818CF8',fontVariantNumeric:'tabular-nums',lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:11,color:'#475569',marginTop:4}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
