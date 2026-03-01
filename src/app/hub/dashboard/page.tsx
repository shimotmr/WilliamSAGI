'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import Link from 'next/link'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

// Modern Dark design tokens (from designprompts.dev)
const T = {
  bg:        '#050506',
  bgDeep:    '#020203',
  bgElevated:'#0a0a0c',
  surface:   'rgba(255,255,255,0.05)',
  surfaceHov:'rgba(255,255,255,0.08)',
  fg:        '#EDEDEF',
  fgMuted:   '#8A8F98',
  fgSubtle:  'rgba(255,255,255,0.6)',
  accent:    '#5E6AD2',
  accentBrt: '#6872D9',
  accentGlow:'rgba(94,106,210,0.3)',
  border:    'rgba(255,255,255,0.06)',
  borderHov: 'rgba(255,255,255,0.10)',
  font:      '"Inter","Geist Sans",system-ui,sans-serif',
  // Status
  green:  '#4ade80',
  amber:  '#fbbf24',
  red:    '#f87171',
}

// Agent colors
const AC = ['#5E6AD2','#4ade80','#fbbf24','#f87171','#a78bfa','#38bdf8','#fb923c']

// SVG icons (1.5px stroke)
const I = {
  list: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="3" y="6" width="18" height="16" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  zap:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>,
  chk:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>,
  pct:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  cpu:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  bar:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  bot:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V5"/><circle cx="12" cy="4" r="1" fill="currentColor"/></svg>,
  back: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  clk:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
}

type Agent = { name:string; role:string; completed:number; successRate:number; isActive:boolean }
type Task  = { title:string; assignee:string; completedAt?:string }
type Data  = { statusCounts:Record<string,number>; totalTasks:number; weekCompleted:number; completionRate:number; agents:Agent[]; recentCompleted:Task[]; runningTasks:Task[]; tokenTrend:{date:string;tokens:number}[] }

class EB extends React.Component<{children:React.ReactNode},{e:boolean}>{
  state={e:false}
  static getDerivedStateFromError(){return{e:true}}
  render(){return this.state.e?<span style={{color:T.fgMuted,fontSize:12}}>—</span>:this.props.children}
}

// Card with spotlight effect
function Card({children,style={},spotlight=false}:{children:React.ReactNode;style?:React.CSSProperties;spotlight?:boolean}){
  const [hov,setHov]=useState(false)
  const ref=useRef<HTMLDivElement>(null)
  function onMove(e:React.MouseEvent<HTMLDivElement>){
    if(!spotlight||!ref.current)return
    const r=ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx',`${e.clientX-r.left}px`)
    ref.current.style.setProperty('--my',`${e.clientY-r.top}px`)
  }
  return(
    <div ref={ref} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onMouseMove={onMove}
      style={{
        position:'relative',overflow:'hidden',
        background:`linear-gradient(to bottom, rgba(255,255,255,${hov?0.09:0.06}) 0%, rgba(255,255,255,${hov?0.03:0.02}) 100%)`,
        border:`1px solid ${hov?T.borderHov:T.border}`,
        borderRadius:16,padding:'20px 22px',
        boxShadow:hov
          ?'0 0 0 1px rgba(255,255,255,0.1), 0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(94,106,210,0.06)'
          :'0 0 0 1px rgba(255,255,255,0.06), 0 2px 20px rgba(0,0,0,0.4)',
        transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        transform:hov?'translateY(-2px)':'none',
        ...style,
      }}>
      {/* top highlight */}
      <div style={{position:'absolute',top:0,left:'8%',right:'8%',height:1,background:'linear-gradient(to right,transparent,rgba(255,255,255,0.12),transparent)',pointerEvents:'none'}}/>
      {/* spotlight */}
      {spotlight&&<div style={{position:'absolute',inset:0,background:'radial-gradient(300px circle at var(--mx,50%) var(--my,50%),rgba(94,106,210,0.1),transparent 70%)',opacity:hov?1:0,transition:'opacity 0.3s',pointerEvents:'none',borderRadius:16}}/>}
      <div style={{position:'relative'}}>{children}</div>
    </div>
  )
}

// Stat card
function Stat({label,value,sub,icon,color}:{label:string;value:string|number;sub:string;icon:React.ReactNode;color:string}){
  return(
    <Card spotlight>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <div style={{padding:8,borderRadius:10,background:`${color}18`,color,display:'flex',border:`1px solid ${color}25`}}>{icon}</div>
        <span style={{fontSize:11,fontWeight:500,color:T.fgMuted,textTransform:'uppercase',letterSpacing:'0.06em',fontFamily:'monospace'}}>{label}</span>
      </div>
      <div style={{fontSize:32,fontWeight:600,color:T.fg,letterSpacing:'-0.03em',fontVariantNumeric:'tabular-nums',lineHeight:1,background:'linear-gradient(to bottom,#EDEDEF,rgba(237,237,239,0.75))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{value}</div>
      <div style={{fontSize:11,color:T.fgMuted,marginTop:6}}>{sub}</div>
    </Card>
  )
}

// Section title
function ST({icon,title,badge}:{icon:React.ReactNode;title:string;badge?:string|number}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:16}}>
      <span style={{color:T.fgMuted,display:'flex'}}>{icon}</span>
      <span style={{fontWeight:500,fontSize:13,color:T.fg,letterSpacing:'-0.01em'}}>{title}</span>
      {badge!=null&&<span style={{marginLeft:'auto',fontSize:11,color:T.fgMuted,background:'rgba(255,255,255,0.06)',borderRadius:20,padding:'2px 8px',border:'1px solid rgba(255,255,255,0.06)',fontVariantNumeric:'tabular-nums'}}>{badge}</span>}
    </div>
  )
}

export default function DashboardPage(){
  const [data,setData]=useState<Data|null>(null)
  const [ts,setTs]=useState('')
  const [mounted,setMounted]=useState(false)

  const load=()=>fetch('/api/hub/dashboard').then(r=>r.json())
    .then(d=>{if(d&&!d.error){setData(d);setTs(new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}))}})
    .catch(()=>{})

  useEffect(()=>{setMounted(true);load();const t=setInterval(load,30000);return()=>clearInterval(t)},[])

  const stats=data?[
    {label:'待執行',value:data.statusCounts['待執行']??0,sub:`共 ${data.totalTasks} 個任務`,color:T.accent,icon:I.list},
    {label:'執行中',value:data.statusCounts['執行中']??0,sub:'Agent 作業中',color:T.amber,icon:I.zap},
    {label:'已完成',value:data.statusCounts['已完成']??0,sub:`本週 +${data.weekCompleted}`,color:T.green,icon:I.chk},
    {label:'完成率',value:`${data.completionRate}%`,sub:'歷史統計',color:'#a78bfa',icon:I.pct},
  ]:[]

  return(
    <div style={{minHeight:'100vh',fontFamily:T.font,color:T.fg,background:T.bg,position:'relative',overflow:'hidden'}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Base gradient */}
      <div style={{position:'fixed',inset:0,background:'radial-gradient(ellipse at top,#0a0a0f 0%,#050506 50%,#020203 100%)',pointerEvents:'none',zIndex:0}}/>
      {/* Noise */}
      <div style={{position:'fixed',inset:0,opacity:0.015,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',backgroundSize:'200px 200px',pointerEvents:'none',zIndex:0}}/>
      {/* Blobs */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-30%',left:'50%',width:1200,height:1400,borderRadius:'50%',background:'rgba(94,106,210,0.18)',filter:'blur(150px)',animation:'floatBlob 10s ease-in-out infinite',transform:'translateX(-50%)'}}/>
        <div style={{position:'absolute',top:'15%',left:'-20%',width:700,height:900,borderRadius:'50%',background:'rgba(80,50,180,0.12)',filter:'blur(120px)',animation:'floatBlob2 13s ease-in-out infinite'}}/>
        <div style={{position:'absolute',bottom:'5%',right:'-15%',width:600,height:800,borderRadius:'50%',background:'rgba(60,80,200,0.1)',filter:'blur(100px)',animation:'floatBlob 16s ease-in-out infinite reverse'}}/>
      </div>
      {/* Grid */}
      <div style={{position:'fixed',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',backgroundSize:'64px 64px',pointerEvents:'none',zIndex:0,opacity:mounted?1:0,transition:'opacity 0.6s'}}/>

      <div style={{position:'relative',zIndex:1,maxWidth:1320,margin:'0 auto',padding:'28px 24px'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:28}}>
          <div>
            
      <style>{`
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .two-col-grid { grid-template-columns: 1fr !important; }
          .bottom-grid { grid-template-columns: 1fr !important; }
          .title-meta { flex-wrap: wrap; gap: 6px !important; }
        }
      `}</style>
          <Link href="/hub" style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:T.fgMuted,textDecoration:'none',marginBottom:10,transition:'color 0.2s'}}
              onMouseEnter={e=>(e.currentTarget.style.color=T.fg)}
              onMouseLeave={e=>(e.currentTarget.style.color=T.fgMuted)}>
              {I.back} Hub
            </Link>
            <h1 style={{fontSize:22,fontWeight:600,letterSpacing:'-0.03em',margin:0,background:'linear-gradient(to bottom,#EDEDEF,rgba(237,237,239,0.8))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Clawd Dashboard</h1>
            <p style={{fontSize:13,color:T.fgMuted,margin:'4px 0 0',letterSpacing:'-0.01em'}}>系統即時監控 · Agent 作業中心</p>
          </div>
          <div className="title-meta" style={{display:'flex',alignItems:'center',gap:10}}>
            {data&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.green}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:T.green,display:'inline-block',boxShadow:`0 0 8px ${T.green}`,animation:'pulse 2s infinite'}}/>
              系統正常
            </div>}
            {ts&&<div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:T.fgMuted,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'6px 10px'}}>
              {I.clk} {ts}
            </div>}
          </div>
        </div>

        {!data?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:360,color:T.fgMuted,gap:10}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" style={{animation:'spin 0.8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            載入中…
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>

            {/* Stats */}
            <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {stats.map(s=><Stat key={s.label} {...s}/>)}
            </div>

            {/* Row 2 */}
            <div className="two-col-grid" style={{display:'grid',gridTemplateColumns:'270px 1fr',gap:10}}>
              <Card>
                <ST icon={I.cpu} title="系統概況"/>
                <EB>
                  {[
                    {k:'閘道器',v:'online :18789',vc:T.green},
                    {k:'總任務',v:(data.totalTasks??0).toLocaleString(),vc:T.fg},
                    {k:'Agent 數量',v:String(data.agents.length),vc:T.fg},
                    {k:'本週完成',v:String(data.weekCompleted),vc:T.green},
                  ].map((r,i)=>(
                    <div key={r.k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<3?`1px solid rgba(255,255,255,0.05)`:'none'}}>
                      <span style={{fontSize:13,color:T.fgMuted}}>{r.k}</span>
                      <span style={{fontSize:13,fontWeight:500,color:r.vc,fontVariantNumeric:'tabular-nums'}}>{r.v}</span>
                    </div>
                  ))}
                </EB>
              </Card>
              <Card>
                <ST icon={I.bar} title="Token 消耗 — 近 7 天"/>
                <EB>
                  {(data.tokenTrend??[]).length>0?(
                    <Line
                      data={{
                        labels:(data.tokenTrend??[]).map(d=>d.date.slice(5)),
                        datasets:[{
                          label:'Tokens',data:(data.tokenTrend??[]).map(d=>d.tokens),
                          borderColor:T.accent,backgroundColor:'rgba(94,106,210,0.06)',
                          fill:true,tension:0.4,pointRadius:3,
                          pointBackgroundColor:T.accent,pointBorderColor:'#050506',pointBorderWidth:2,
                        }]
                      }}
                      options={{
                        responsive:true,maintainAspectRatio:false,
                        plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(10,10,12,0.95)',borderColor:'rgba(255,255,255,0.08)',borderWidth:1,titleColor:T.fg,bodyColor:T.fgMuted,padding:12,cornerRadius:8}},
                        scales:{
                          x:{grid:{color:'rgba(255,255,255,0.03)'},ticks:{color:T.fgMuted,font:{size:11,family:'Inter'}}},
                          y:{grid:{color:'rgba(255,255,255,0.03)'},ticks:{color:T.fgMuted,font:{size:11,family:'Inter'}}},
                        }
                      }}
                      height={162}
                    />
                  ):(
                    <div style={{height:162,display:'flex',alignItems:'center',justifyContent:'center',color:T.fgMuted,fontSize:13}}>尚無資料</div>
                  )}
                </EB>
              </Card>
            </div>

            {/* Agents — asymmetric bento */}
            {data.agents.length>0&&(
              <Card>
                <ST icon={I.bot} title="Agent 狀態" badge={`${data.agents.filter(a=>a.isActive).length} / ${data.agents.length} 活躍`}/>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:8}}>
                  {data.agents.slice(0,8).map((ag,i)=>{
                    const c=AC[i%AC.length]
                    return(
                      <div key={ag.name} style={{background:`${c}0a`,border:`1px solid ${c}20`,borderRadius:12,padding:'14px 15px',transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:11}}>
                          <div style={{width:32,height:32,borderRadius:8,background:c,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:13,color:'#050506',flexShrink:0,boxShadow:`0 0 12px ${c}40`}}>
                            {ag.name.slice(0,1).toUpperCase()}
                          </div>
                          <div style={{minWidth:0,flex:1}}>
                            <div style={{fontWeight:500,fontSize:13,color:T.fg,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-0.01em'}}>{ag.name}</div>
                            <div style={{fontSize:11,color:T.fgMuted,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.role}</div>
                          </div>
                          {ag.isActive&&<span style={{width:5,height:5,borderRadius:'50%',background:T.green,display:'inline-block',boxShadow:`0 0 6px ${T.green}`,flexShrink:0}}/>}
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.fgMuted,marginBottom:5}}>
                          <span>完成 {ag.completed}</span>
                          <span style={{fontVariantNumeric:'tabular-nums'}}>{ag.successRate}%</span>
                        </div>
                        <div style={{height:2,background:'rgba(255,255,255,0.06)',borderRadius:1,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${ag.successRate}%`,background:c,borderRadius:1,boxShadow:`0 0 8px ${c}60`}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Tasks */}
            <div className="bottom-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[
                {icon:I.zap,title:'執行中',tasks:data.runningTasks,dot:T.amber,empty:'目前無執行中任務'},
                {icon:I.chk,title:'最近完成',tasks:data.recentCompleted,dot:T.green,empty:'尚無完成紀錄'},
              ].map(s=>(
                <Card key={s.title}>
                  <ST icon={s.icon} title={s.title} badge={s.tasks.length||undefined}/>
                  {s.tasks.length===0
                    ?<div style={{textAlign:'center',padding:'20px 0',color:T.fgMuted,fontSize:13}}>{s.empty}</div>
                    :s.tasks.map((t,i)=>(
                      <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:i<s.tasks.length-1?'1px solid rgba(255,255,255,0.04)':'none',alignItems:'flex-start'}}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:s.dot,display:'inline-block',boxShadow:`0 0 5px ${s.dot}`,flexShrink:0,marginTop:8}}/>
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:13,color:T.fg,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-0.01em'}}>{t.title}</div>
                          <div style={{fontSize:11,color:T.fgMuted,marginTop:2}}>
                            {t.assignee}{t.completedAt&&` · ${new Date(t.completedAt).toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'})}`}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </Card>
              ))}
            </div>

            <p style={{textAlign:'center',color:'rgba(138,143,152,0.35)',fontSize:11,paddingBottom:8,letterSpacing:'0.02em'}}>
              SAGI Hub · Clawd Dashboard · © 2026
            </p>
          </div>
        )}
      </div>

      <style>{`
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes floatBlob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-20px) rotate(1deg)}}
        @keyframes floatBlob2{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px) rotate(-1deg)}}
        @media(prefers-reduced-motion:reduce){*{animation:none!important}}
      `}</style>
    </div>
  )
}
