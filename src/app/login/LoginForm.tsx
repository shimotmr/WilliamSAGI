'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [mounted, setMounted]   = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') || '/hub'

  useEffect(() => { setMounted(true) }, [])

  // Mouse-tracking spotlight
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    card.style.setProperty('--mx', `${x}px`)
    card.style.setProperty('--my', `${y}px`)
  }

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
      fontFamily:'"Inter","Geist Sans",system-ui,sans-serif',
      background:'#050506',
      display:'flex',alignItems:'center',justifyContent:'center',
      position:'relative',overflow:'hidden',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Layer 1: base radial gradient */}
      <div style={{position:'fixed',inset:0,background:'radial-gradient(ellipse at top, #0a0a0f 0%, #050506 50%, #020203 100%)',pointerEvents:'none'}}/>

      {/* Layer 2: noise texture */}
      <div style={{position:'fixed',inset:0,opacity:0.015,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',backgroundSize:'200px 200px',pointerEvents:'none'}}/>

      {/* Layer 3: animated gradient blobs */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',overflow:'hidden'}}>
        {/* Primary blob — top center */}
        <div style={{position:'absolute',top:'-20%',left:'50%',transform:'translateX(-50%)',width:900,height:1400,borderRadius:'50%',background:'rgba(94,106,210,0.25)',filter:'blur(150px)',animation:'floatBlob 9s ease-in-out infinite'}}/>
        {/* Secondary blob — left */}
        <div style={{position:'absolute',top:'20%',left:'-15%',width:600,height:800,borderRadius:'50%',background:'rgba(80,50,180,0.15)',filter:'blur(120px)',animation:'floatBlob2 11s ease-in-out infinite'}}/>
        {/* Tertiary blob — right */}
        <div style={{position:'absolute',bottom:'10%',right:'-10%',width:500,height:700,borderRadius:'50%',background:'rgba(60,80,200,0.12)',filter:'blur(100px)',animation:'floatBlob 13s ease-in-out infinite reverse'}}/>
      </div>

      {/* Layer 4: grid overlay */}
      <div style={{position:'fixed',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',backgroundSize:'64px 64px',pointerEvents:'none',opacity:mounted?1:0,transition:'opacity 0.5s'}}/>

      {/* Card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        style={{
          position:'relative',
          zIndex:10,
          width:'100%',maxWidth:400,margin:'0 20px',
          background:'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          border:'1px solid rgba(255,255,255,0.06)',
          borderRadius:16,
          padding:'40px 36px',
          boxShadow:'0 0 0 1px rgba(255,255,255,0.06), 0 2px 20px rgba(0,0,0,0.4), 0 0 40px rgba(0,0,0,0.2)',
        }}>

        {/* Spotlight effect */}
        <div style={{position:'absolute',inset:0,borderRadius:16,overflow:'hidden',pointerEvents:'none'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(300px circle at var(--mx,50%) var(--my,50%), rgba(94,106,210,0.12), transparent 70%)',opacity:mounted?1:0,transition:'opacity 0.3s'}}/>
        </div>
        {/* Top highlight line */}
        <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)',borderRadius:1,pointerEvents:'none'}}/>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:32,position:'relative'}}>
          <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:44,height:44,background:'linear-gradient(135deg, rgba(94,106,210,0.9) 0%, rgba(80,90,200,0.8) 100%)',border:'1px solid rgba(94,106,210,0.4)',borderRadius:12,marginBottom:18,boxShadow:'0 0 0 1px rgba(94,106,210,0.5), 0 4px 12px rgba(94,106,210,0.3), inset 0 1px 0 0 rgba(255,255,255,0.2)'}}>
            <span style={{color:'#fff',fontWeight:700,fontSize:18,letterSpacing:'-0.5px'}}>W</span>
          </div>
          <div style={{fontSize:20,fontWeight:600,letterSpacing:'-0.03em',background:'linear-gradient(to bottom, #EDEDEF, rgba(237,237,239,0.7))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>SAGI Hub</div>
          <div style={{fontSize:13,color:'#8A8F98',marginTop:4}}>AI Control Panel</div>
        </div>

        {error && (
          <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:20,color:'rgba(248,113,113,0.9)',fontSize:13,display:'flex',gap:8,alignItems:'flex-start',position:'relative'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14,position:'relative'}}>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'rgba(138,143,152,0.9)',marginBottom:7,letterSpacing:'0.02em'}}>電子郵件</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required
              style={{width:'100%',background:'#0F0F12',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'10px 14px',color:'#E4E4E7',fontSize:14,outline:'none',fontFamily:'inherit',boxSizing:'border-box',transition:'border-color 0.2s, box-shadow 0.2s'}}
              onFocus={e=>{e.target.style.borderColor='rgba(94,106,210,0.8)';e.target.style.boxShadow='0 0 0 2px rgba(94,106,210,0.2), 0 0 0 1px rgba(94,106,210,0.5)'}}
              onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none'}}
            />
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'rgba(138,143,152,0.9)',marginBottom:7,letterSpacing:'0.02em'}}>密碼</label>
            <div style={{position:'relative'}}>
              <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                style={{width:'100%',background:'#0F0F12',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'10px 40px 10px 14px',color:'#E4E4E7',fontSize:14,outline:'none',fontFamily:'inherit',boxSizing:'border-box',transition:'border-color 0.2s, box-shadow 0.2s'}}
                onFocus={e=>{e.target.style.borderColor='rgba(94,106,210,0.8)';e.target.style.boxShadow='0 0 0 2px rgba(94,106,210,0.2), 0 0 0 1px rgba(94,106,210,0.5)'}}
                onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none'}}
              />
              <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#8A8F98',padding:0,display:'flex',transition:'color 0.2s'}}
                onMouseEnter={e=>(e.currentTarget.style.color='#EDEDEF')}
                onMouseLeave={e=>(e.currentTarget.style.color='#8A8F98')}>
                {showPw
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{marginTop:8,padding:'11px',background:loading?'rgba(94,106,210,0.6)':'#5E6AD2',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:500,cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 0 0 1px rgba(94,106,210,0.5), 0 4px 12px rgba(94,106,210,0.3), inset 0 1px 0 0 rgba(255,255,255,0.2)',transition:'all 0.2s',fontFamily:'inherit',letterSpacing:'-0.01em'}}
            onMouseEnter={e=>{if(!loading)(e.currentTarget as HTMLButtonElement).style.background='#6872D9'}}
            onMouseLeave={e=>{if(!loading)(e.currentTarget as HTMLButtonElement).style.background='#5E6AD2'}}>
            {loading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" style={{animation:'spin 0.8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
            {loading ? '驗證中…' : '登入'}
          </button>
        </form>

        <div style={{marginTop:28,textAlign:'center',color:'rgba(138,143,152,0.5)',fontSize:11,letterSpacing:'0.02em',position:'relative'}}>
          William SAGI · Autonomous Agent OS
        </div>
      </div>

      <style>{`
        input::placeholder{color:rgba(138,143,152,0.5)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes floatBlob{0%,100%{transform:translateX(-50%) translateY(0) rotate(0deg)}50%{transform:translateX(-50%) translateY(-20px) rotate(1deg)}}
        @keyframes floatBlob2{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-15px) rotate(-1deg)}}
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition-duration:0.01ms!important}}
      `}</style>
    </div>
  )
}
