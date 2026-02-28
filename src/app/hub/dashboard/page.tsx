'use client'

import React, { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import Link from 'next/link'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

// ── Design Tokens (glassmorphism on gradient bg) ──────────
const C = {
  font:      '"Inter",-apple-system,BlinkMacSystemFont,sans-serif',
  text:      '#F1F5F9',
  sub:       '#94A3B8',
  muted:     'rgba(100,116,139,0.8)',
  // Card glass
  glass:     'rgba(14,18,30,0.55)',
  glassBdr:  'rgba(255,255,255,0.08)',
  glassShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
  glassHov:  'rgba(20,26,42,0.7)',
  // Accents
  purple:    '#7c3aed',
  purpleGlow:'rgba(124,58,237,0.35)',
  green:     '#10b981',
  greenGlow: 'rgba(16,185,129,0.3)',
  amber:     '#f59e0b',
  amberGlow: 'rgba(245,158,11,0.3)',
  indigo:    '#6366f1',
  indigoGlow:'rgba(99,102,241,0.3)',
  // Status
  statusGreen:'#34d399',
  statusAmber:'#fbbf24',
}

// Agent palette (visible against gradient bg)
const APURPLES = ['#a78bfa','#60a5fa','#34d399','#fbbf24','#f87171','#c084fc','#38bdf8']

// ── Icons ─────────────────────────────────────────────────
const I = {
  list: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="3" y="6" width="18" height="16" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  zap:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>,
  chk:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>,
  pct:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  cpu:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  bar:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  bot:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V5"/><circle cx="12" cy="4" r="1" fill="currentColor"/></svg>,
  back: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  clk:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
}

type Agent = { name:string; role:string; completed:number; successRate:number; isActive:boolean }
type Task  = { title:string; assignee:string; completedAt?:string }
type Data  = { statusCounts:Record<string,number>; totalTasks:number; weekCompleted:number; completionRate:number; agents:Agent[]; recentCompleted:Task[]; runningTasks:Task[]; tokenTrend:{date:string;tokens:number}[] }

class EB extends React.Component<{children:React.ReactNode},{e:boolean}>{
  state={e:false}
  static getDerivedStateFromError(){return{e:true}}
  render(){return this.state.e?<span style={{color:C.muted,fontSize:12}}>—</span>:this.props.children}
}

// Glass card
function G({children,style={},glow=''}:{children:React.ReactNode;style?:React.CSSProperties;glow?:string}){
  const [hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:hov?C.glassHov:C.glass,
      backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
      border:`1px solid ${hov?'rgba(255,255,255,0.13)':C.glassBdr}`,
      borderRadius:16,
      boxShadow:glow&&hov?`${C.glassShadow}, 0 0 40px ${glow}`:`${C.glassShadow}`,
      transition:'all 0.2s ease',
      ...style,
    }}>{children}</div>
  )
}

// Stat card
function Stat({label,value,sub,icon,color,glow}:{label:string;value:string|number;sub:string;icon:React.ReactNode;color:string;glow:string}){
  const [hov,setHov]=useState(false)
  return(
    <G glow={glow} style={{padding:'20px 22px',transform:hov?'translateY(-3px)':'none',cursor:'default'}}
      {...{onMouseEnter:()=>setHov(true),onMouseLeave:()=>setHov(false)}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <div style={{padding:9,borderRadius:10,background:`${color}20`,color,display:'flex',boxShadow:`0 4px 12px ${glow}`}}>{icon}</div>
        <span style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</span>
      </div>
      <div style={{fontSize:34,fontWeight:700,color:C.text,letterSpacing:'-1px',fontVariantNumeric:'tabular-nums',lineHeight:1}}>{value}</div>
      <div style={{fontSize:11,color:C.muted,marginTop:6}}>{sub}</div>
    </G>
  )
}

// Section title
function ST({icon,title,badge}:{icon:React.ReactNode;title:string;badge?:string|number}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
      <span style={{color:C.sub,display:'flex'}}>{icon}</span>
      <span style={{fontWeight:600,fontSize:13,color:C.text}}>{title}</span>
      {badge!=null&&<span style={{marginLeft:'auto',fontSize:11,color:C.statusAmber,background:'rgba(251,191,36,0.12)',borderRadius:20,padding:'2px 9px',fontVariantNumeric:'tabular-nums',border:'1px solid rgba(251,191,36,0.2)'}}>{badge}</span>}
    </div>
  )
}

export default function DashboardPage(){
  const [data,setData]=useState<Data|null>(null)
  const [ts,setTs]=useState('')

  const load=()=>fetch('/api/hub/dashboard').then(r=>r.json())
    .then(d=>{if(d&&!d.error){setData(d);setTs(new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}))}})
    .catch(()=>{})

  useEffect(()=>{load();const t=setInterval(load,30000);return()=>clearInterval(t)},[])

  const stats=data?[
    {label:'待執行',value:data.statusCounts['待執行']??0,sub:`共 ${data.totalTasks} 個`,color:C.indigo,glow:C.indigoGlow,icon:I.list},
    {label:'執行中',value:data.statusCounts['執行中']??0,sub:'作業中',color:C.amber,glow:C.amberGlow,icon:I.zap},
    {label:'已完成',value:data.statusCounts['已完成']??0,sub:`本週 +${data.weekCompleted}`,color:C.green,glow:C.greenGlow,icon:I.chk},
    {label:'完成率',value:`${data.completionRate}%`,sub:'歷史統計',color:'#a78bfa',glow:C.purpleGlow,icon:I.pct},
  ]:[]

  return(
    <div style={{minHeight:'100vh',fontFamily:C.font,color:C.text,background:'#080c16',position:'relative',overflow:'hidden'}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Background gradient mesh */}
      <div style={{position:'fixed',inset:0,background:'radial-gradient(ellipse 70% 55% at 15% 25%, rgba(88,28,220,0.28) 0%, transparent 55%), radial-gradient(ellipse 55% 45% at 85% 75%, rgba(99,102,241,0.18) 0%, transparent 50%), radial-gradient(ellipse 45% 40% at 55% 5%, rgba(139,92,246,0.12) 0%, transparent 45%)',pointerEvents:'none',zIndex:0}}/>

      <div style={{position:'relative',zIndex:1,maxWidth:1320,margin:'0 auto',padding:'28px 24px'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:28}}>
          <div>
            <Link href="/hub" style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:C.muted,textDecoration:'none',marginBottom:10}}>
              {I.back} Hub
            </Link>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:'-0.5px',margin:0,color:C.text}}>Clawd Dashboard</h1>
            <p style={{fontSize:13,color:C.muted,margin:'4px 0 0'}}>系統即時監控 · Agent 作業中心</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {data&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.statusGreen}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:C.statusGreen,boxShadow:`0 0 8px ${C.statusGreen}`,display:'inline-block',animation:'pulse 2s infinite'}}/>
              系統正常
            </div>}
            {ts&&<G style={{padding:'7px 12px'}}>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:C.sub}}>
                {I.clk} {ts}
              </div>
            </G>}
          </div>
        </div>

        {!data?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:360,color:C.muted,gap:10}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" style={{animation:'spin 0.8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            載入中…
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>

            {/* Stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {stats.map(s=><Stat key={s.label} {...s}/>)}
            </div>

            {/* Row 2 */}
            <div style={{display:'grid',gridTemplateColumns:'290px 1fr',gap:12}}>
              {/* System */}
              <G style={{padding:'20px 22px'}}>
                <ST icon={I.cpu} title="系統概況"/>
                <EB>
                  {[
                    {k:'閘道器',v:'online :18789',vc:C.statusGreen},
                    {k:'總任務',v:data.totalTasks.toLocaleString(),vc:C.text},
                    {k:'Agent',v:String(data.agents.length),vc:C.text},
                    {k:'本週完成',v:String(data.weekCompleted),vc:C.statusGreen},
                  ].map((r,i)=>(
                    <div key={r.k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<3?`1px solid rgba(255,255,255,0.05)`:'none'}}>
                      <span style={{fontSize:13,color:C.muted}}>{r.k}</span>
                      <span style={{fontSize:13,fontWeight:600,color:r.vc,fontVariantNumeric:'tabular-nums'}}>{r.v}</span>
                    </div>
                  ))}
                </EB>
              </G>

              {/* Token chart */}
              <G style={{padding:'20px 22px'}}>
                <ST icon={I.bar} title="Token 消耗 — 近 7 天"/>
                <EB>
                  {data.tokenTrend.length>0?(
                    <Line
                      data={{
                        labels:data.tokenTrend.map(d=>d.date.slice(5)),
                        datasets:[{
                          label:'Tokens',data:data.tokenTrend.map(d=>d.tokens),
                          borderColor:'#a78bfa',backgroundColor:'rgba(167,139,250,0.08)',
                          fill:true,tension:0.45,pointRadius:4,
                          pointBackgroundColor:'#a78bfa',pointBorderColor:'rgba(14,18,30,0.8)',pointBorderWidth:2,
                        }]
                      }}
                      options={{
                        responsive:true,maintainAspectRatio:false,
                        plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(14,18,30,0.9)',borderColor:'rgba(255,255,255,0.1)',borderWidth:1,titleColor:C.text,bodyColor:C.sub,padding:12,cornerRadius:10}},
                        scales:{
                          x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:C.muted,font:{size:11,family:'Inter'}}},
                          y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:C.muted,font:{size:11,family:'Inter'}}},
                        }
                      }}
                      height={168}
                    />
                  ):(
                    <div style={{height:168,display:'flex',alignItems:'center',justifyContent:'center',color:C.muted,fontSize:13}}>尚無資料</div>
                  )}
                </EB>
              </G>
            </div>

            {/* Agents */}
            {data.agents.length>0&&(
              <G style={{padding:'20px 22px'}}>
                <ST icon={I.bot} title="Agent 狀態" badge={data.agents.filter(a=>a.isActive).length+' 活躍'}/>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:10}}>
                  {data.agents.slice(0,8).map((ag,i)=>{
                    const c=APURPLES[i%APURPLES.length]
                    return(
                      <div key={ag.name} style={{background:`${c}10`,border:`1px solid ${c}28`,borderRadius:12,padding:'14px 16px',transition:'all 0.18s'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                          <div style={{width:34,height:34,borderRadius:9,background:c,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#080c16',flexShrink:0,boxShadow:`0 4px 12px ${c}40`}}>
                            {ag.name.slice(0,1).toUpperCase()}
                          </div>
                          <div style={{minWidth:0,flex:1}}>
                            <div style={{fontWeight:600,fontSize:13,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.name}</div>
                            <div style={{fontSize:11,color:C.muted,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.role}</div>
                          </div>
                          {ag.isActive&&<span style={{width:6,height:6,borderRadius:'50%',background:C.statusGreen,boxShadow:`0 0 5px ${C.statusGreen}`,flexShrink:0,display:'inline-block'}}/>}
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:6}}>
                          <span>完成 {ag.completed}</span>
                          <span style={{fontVariantNumeric:'tabular-nums'}}>{ag.successRate}%</span>
                        </div>
                        <div style={{height:2,background:'rgba(255,255,255,0.07)',borderRadius:1,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${ag.successRate}%`,background:c,borderRadius:1,boxShadow:`0 0 6px ${c}60`,transition:'width 0.8s ease'}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </G>
            )}

            {/* Tasks */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <G style={{padding:'20px 22px'}}>
                <ST icon={I.zap} title="執行中" badge={data.runningTasks.length}/>
                {data.runningTasks.length===0
                  ?<div style={{textAlign:'center',padding:'20px 0',color:C.muted,fontSize:13}}>目前無執行中任務</div>
                  :data.runningTasks.map((t,i)=>(
                    <div key={i} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:i<data.runningTasks.length-1?`1px solid rgba(255,255,255,0.05)`:'none',alignItems:'flex-start'}}>
                      <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',background:C.statusAmber,boxShadow:`0 0 6px ${C.statusAmber}`,flexShrink:0,marginTop:8}}/>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:13,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>{t.assignee}</div>
                      </div>
                    </div>
                  ))
                }
              </G>
              <G style={{padding:'20px 22px'}}>
                <ST icon={I.chk} title="最近完成"/>
                {data.recentCompleted.length===0
                  ?<div style={{textAlign:'center',padding:'20px 0',color:C.muted,fontSize:13}}>尚無完成紀錄</div>
                  :data.recentCompleted.map((t,i)=>(
                    <div key={i} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:i<data.recentCompleted.length-1?`1px solid rgba(255,255,255,0.05)`:'none',alignItems:'flex-start'}}>
                      <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',background:C.statusGreen,boxShadow:`0 0 6px ${C.statusGreen}`,flexShrink:0,marginTop:8}}/>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:13,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                          {t.assignee}{t.completedAt&&` · ${new Date(t.completedAt).toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'})}`}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </G>
            </div>

            <p style={{textAlign:'center',color:'rgba(71,85,105,0.5)',fontSize:11,paddingBottom:8,letterSpacing:'0.02em'}}>
              SAGI Hub · Clawd Dashboard · © 2026
            </p>
          </div>
        )}
      </div>

      <style>{`
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
      `}</style>
    </div>
  )
}
