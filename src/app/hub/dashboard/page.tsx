'use client'

import React, { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import Link from 'next/link'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

// ── Tokens ────────────────────────────────────────────────────
const C = {
  bg:        '#080D18',
  panel:     '#0D1425',
  surface:   'rgba(248,250,252,0.03)',
  surfaceHov:'rgba(248,250,252,0.05)',
  border:    'rgba(148,163,184,0.1)',
  borderHov: 'rgba(148,163,184,0.2)',
  text:      '#F8FAFC',
  sub:       '#94A3B8',
  muted:     '#475569',
  brand:     '#818CF8',
  brandDim:  'rgba(129,140,248,0.12)',
  brandGlow: 'rgba(129,140,248,0.2)',
  green:     '#34D399',
  amber:     '#FCD34D',
  red:       '#F87171',
  purple:    '#C084FC',
  font:      '"Inter",-apple-system,BlinkMacSystemFont,sans-serif',
}

// ── Agent color map ────────────────────────────────────────────
const ACOLS = ['#818CF8','#34D399','#FCD34D','#F87171','#C084FC','#38BDF8','#FB923C']

// ── SVGs ──────────────────────────────────────────────────────
const I = {
  pending: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M3 6h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/><path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  zap:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>,
  check:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>,
  rate:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  cpu:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  bot:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V5"/><circle cx="12" cy="4" r="1" fill="currentColor"/></svg>,
  clock:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  back:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
}

type Agent = { name:string; role:string; completed:number; successRate:number; isActive:boolean }
type Task  = { title:string; assignee:string; completedAt?:string }
type Data  = { statusCounts:Record<string,number>; totalTasks:number; weekCompleted:number; completionRate:number; agents:Agent[]; recentCompleted:Task[]; runningTasks:Task[]; tokenTrend:{date:string;tokens:number}[] }

class EB extends React.Component<{children:React.ReactNode},{e:boolean}>{
  state={e:false}
  static getDerivedStateFromError(){return{e:true}}
  render(){return this.state.e?<div style={{color:C.muted,fontSize:12,padding:'8px 0'}}>—</div>:this.props.children}
}

// ── Stat card ─────────────────────────────────────────────────
function Stat({label,value,sub,icon,color}:{label:string;value:string|number;sub:string;icon:React.ReactNode;color:string}){
  const [hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:hov?C.surfaceHov:C.surface,
      border:`1px solid ${hov?C.borderHov:C.border}`,
      borderRadius:12,padding:'18px 20px',
      transform:hov?'translateY(-2px)':'none',
      boxShadow:hov?`0 8px 24px rgba(0,0,0,0.3)`:C.surface,
      transition:'all 0.18s ease',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
        <span style={{color}}>{icon}</span>
        <span style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</span>
      </div>
      <div style={{fontSize:32,fontWeight:700,color:C.text,letterSpacing:'-0.8px',fontVariantNumeric:'tabular-nums',lineHeight:1}}>{value}</div>
      <div style={{fontSize:11,color:C.muted,marginTop:6}}>{sub}</div>
    </div>
  )
}

// ── Section title ─────────────────────────────────────────────
function ST({icon,title,badge}:{icon:React.ReactNode;title:string;badge?:string|number}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:16}}>
      <span style={{color:C.brand,display:'flex'}}>{icon}</span>
      <span style={{fontWeight:600,fontSize:13,color:C.text}}>{title}</span>
      {badge!=null&&<span style={{marginLeft:'auto',fontSize:11,color:C.brand,background:C.brandDim,borderRadius:20,padding:'2px 9px',fontVariantNumeric:'tabular-nums'}}>{badge}</span>}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────
function Panel({children,style={}}:{children:React.ReactNode;style?:React.CSSProperties}){
  return(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'18px 20px',...style}}>
      {children}
    </div>
  )
}

// ── Task row ──────────────────────────────────────────────────
function TRow({t,dot,last}:{t:Task;dot:string;last:boolean}){
  return(
    <div style={{display:'flex',gap:10,padding:'9px 0',borderBottom:last?'none':`1px solid ${C.border}`,alignItems:'flex-start'}}>
      <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:dot,flexShrink:0,marginTop:7}}/>
      <div style={{minWidth:0,flex:1}}>
        <div style={{fontSize:13,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
        <div style={{fontSize:11,color:C.muted,marginTop:2,display:'flex',alignItems:'center',gap:5}}>
          {t.assignee}
          {t.completedAt&&<><span>·</span>{new Date(t.completedAt).toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'})}</>}
        </div>
      </div>
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
    {label:'待執行',value:data.statusCounts['待執行']??0,sub:`共 ${data.totalTasks} 個任務`,color:C.brand,icon:I.pending},
    {label:'執行中',value:data.statusCounts['執行中']??0,sub:'正在作業中',color:C.amber,icon:I.zap},
    {label:'已完成',value:data.statusCounts['已完成']??0,sub:`本週 +${data.weekCompleted}`,color:C.green,icon:I.check},
    {label:'完成率',value:`${data.completionRate}%`,sub:'歷史統計',color:C.purple,icon:I.rate},
  ]:[]

  return(
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:C.font,color:C.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* dot grid overlay */}
      <div style={{position:'fixed',inset:0,backgroundImage:'radial-gradient(circle,rgba(148,163,184,0.05) 1px,transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none',zIndex:0}}/>
      {/* ambient glow */}
      <div style={{position:'fixed',top:'-10%',right:'5%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%)',pointerEvents:'none',zIndex:0}}/>

      <div style={{position:'relative',zIndex:1,maxWidth:1320,margin:'0 auto',padding:'28px 24px'}}>

        {/* header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:28}}>
          <div>
            <Link href="/hub" style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:C.muted,textDecoration:'none',marginBottom:10}}>
              {I.back} Hub
            </Link>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:'-0.5px',margin:0,color:C.text}}>Clawd Dashboard</h1>
            <p style={{fontSize:13,color:C.muted,margin:'4px 0 0'}}>系統即時監控 · 自動更新</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {data&&<span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.green}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:C.green,display:'inline-block',boxShadow:`0 0 6px ${C.green}`,animation:'pulse 2s infinite'}}/>
              系統正常
            </span>}
            {ts&&<div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.muted,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:'6px 12px'}}>
              {I.clock} {ts}
            </div>}
          </div>
        </div>

        {!data?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:360,color:C.muted,gap:10}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.brand} strokeWidth="2" style={{animation:'spin 0.8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            載入中…
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>

            {/* stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {stats.map(s=><Stat key={s.label} {...s}/>)}
            </div>

            {/* row 2: system + chart */}
            <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:12}}>
              <Panel>
                <ST icon={I.cpu} title="系統概況"/>
                <EB>
                  {[
                    {k:'閘道器',v:'online :18789',c:C.green},
                    {k:'總任務數',v:data.totalTasks.toLocaleString(),c:C.text},
                    {k:'Agent 數量',v:String(data.agents.length),c:C.text},
                    {k:'本週完成',v:String(data.weekCompleted),c:C.green},
                  ].map((r,i)=>(
                    <div key={r.k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<3?`1px solid ${C.border}`:'none'}}>
                      <span style={{fontSize:13,color:C.sub}}>{r.k}</span>
                      <span style={{fontSize:13,fontWeight:600,color:r.c,fontVariantNumeric:'tabular-nums'}}>{r.v}</span>
                    </div>
                  ))}
                </EB>
              </Panel>

              <Panel>
                <ST icon={I.chart} title="Token 消耗 — 近 7 天"/>
                <EB>
                  {data.tokenTrend.length>0?(
                    <Line
                      data={{
                        labels:data.tokenTrend.map(d=>d.date.slice(5)),
                        datasets:[{
                          label:'Tokens',data:data.tokenTrend.map(d=>d.tokens),
                          borderColor:C.brand,backgroundColor:'rgba(129,140,248,0.06)',
                          fill:true,tension:0.4,pointRadius:3,pointBackgroundColor:C.brand,
                          pointBorderColor:C.bg,pointBorderWidth:2,
                        }]
                      }}
                      options={{
                        responsive:true,maintainAspectRatio:false,
                        plugins:{legend:{display:false},tooltip:{backgroundColor:'#1E293B',borderColor:C.border,borderWidth:1,titleColor:C.text,bodyColor:C.sub,padding:10}},
                        scales:{
                          x:{grid:{color:'rgba(148,163,184,0.06)'},ticks:{color:C.muted,font:{size:11,family:'Inter'}}},
                          y:{grid:{color:'rgba(148,163,184,0.06)'},ticks:{color:C.muted,font:{size:11,family:'Inter'}}},
                        }
                      }}
                      height={165}
                    />
                  ):(
                    <div style={{height:165,display:'flex',alignItems:'center',justifyContent:'center',color:C.muted,fontSize:13}}>尚無資料</div>
                  )}
                </EB>
              </Panel>
            </div>

            {/* agents */}
            {data.agents.length>0&&(
              <Panel>
                <ST icon={I.bot} title="Agent 概況" badge={data.agents.filter(a=>a.isActive).length+' 活躍'}/>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
                  {data.agents.slice(0,8).map((ag,i)=>{
                    const c=ACOLS[i%ACOLS.length]
                    return(
                      <div key={ag.name} style={{background:`${c}0c`,border:`1px solid ${c}22`,borderRadius:10,padding:'14px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                          <div style={{width:32,height:32,borderRadius:8,background:c,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#080D18',flexShrink:0}}>
                            {ag.name.slice(0,1).toUpperCase()}
                          </div>
                          <div style={{minWidth:0,flex:1}}>
                            <div style={{fontWeight:600,fontSize:13,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.name}</div>
                            <div style={{fontSize:11,color:C.muted,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.role}</div>
                          </div>
                          {ag.isActive&&<div style={{width:6,height:6,borderRadius:'50%',background:C.green,boxShadow:`0 0 4px ${C.green}`,flexShrink:0}}/>}
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:5}}>
                          <span>完成 {ag.completed}</span>
                          <span style={{fontVariantNumeric:'tabular-nums'}}>{ag.successRate}%</span>
                        </div>
                        <div style={{height:2,background:'rgba(255,255,255,0.06)',borderRadius:1,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${ag.successRate}%`,background:c,borderRadius:1}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Panel>
            )}

            {/* tasks */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Panel>
                <ST icon={I.zap} title="執行中" badge={data.runningTasks.length}/>
                {data.runningTasks.length===0
                  ?<div style={{textAlign:'center',padding:'20px 0',color:C.muted,fontSize:13}}>目前無執行中任務</div>
                  :data.runningTasks.map((t,i)=><TRow key={i} t={t} dot={C.amber} last={i===data.runningTasks.length-1}/>)
                }
              </Panel>
              <Panel>
                <ST icon={I.check} title="最近完成"/>
                {data.recentCompleted.length===0
                  ?<div style={{textAlign:'center',padding:'20px 0',color:C.muted,fontSize:13}}>尚無完成紀錄</div>
                  :data.recentCompleted.map((t,i)=><TRow key={i} t={t} dot={C.green} last={i===data.recentCompleted.length-1}/>)
                }
              </Panel>
            </div>

            <div style={{textAlign:'center',color:C.muted,fontSize:11,paddingBottom:8,letterSpacing:'0.02em'}}>
              SAGI Hub · Clawd Dashboard · © 2026
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
