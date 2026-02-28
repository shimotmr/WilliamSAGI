'use client'

import React, { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import Link from 'next/link'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

// ── Design tokens ──────────────────────────────────────────
const T = {
  bg:        '#070B14',
  surface:   'rgba(255,255,255,0.03)',
  surfaceHov:'rgba(255,255,255,0.055)',
  border:    'rgba(255,255,255,0.08)',
  borderHov: 'rgba(255,255,255,0.14)',
  text:      '#F1F5F9',
  textSub:   '#94A3B8',
  textMuted: '#475569',
  brand:     '#6366F1',
  brandGlow: 'rgba(99,102,241,0.18)',
  green:     '#10B981',
  amber:     '#F59E0B',
  red:       '#EF4444',
  font:      '"Inter",-apple-system,BlinkMacSystemFont,sans-serif',
}

// ── SVG Icons (1.5px stroke, no fill) ─────────────────────
const Ico = {
  list:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="8" y="3" width="13" height="4" rx="1"/><rect x="8" y="10" width="13" height="4" rx="1"/><rect x="8" y="17" width="13" height="4" rx="1"/><line x1="3" y1="5" x2="4" y2="5"/><line x1="3" y1="12" x2="4" y2="12"/><line x1="3" y1="19" x2="4" y2="19"/></svg>,
  zap:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>,
  check:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>,
  trend:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  server:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  bar:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  bot:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V5"/><circle cx="12" cy="4" r="1" fill="currentColor"/><circle cx="8.5" cy="16" r="1" fill="currentColor"/><circle cx="15.5" cy="16" r="1" fill="currentColor"/></svg>,
  dot:     (c: string) => <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:c,flexShrink:0,marginTop:7}}/>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  back:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
}

// ── Types ──────────────────────────────────────────────────
type Agent = { name:string; role:string; total:number; completed:number; successRate:number; isActive:boolean }
type Task  = { title:string; assignee:string; completedAt?:string }
type Data  = { statusCounts:Record<string,number>; totalTasks:number; weekCompleted:number; completionRate:number; agents:Agent[]; recentCompleted:Task[]; runningTasks:Task[]; tokenTrend:{date:string;tokens:number}[] }

// ── Error Boundary ─────────────────────────────────────────
class EB extends React.Component<{children:React.ReactNode},{e:boolean}> {
  state = {e:false}
  static getDerivedStateFromError() { return {e:true} }
  render() { return this.state.e ? <div style={{color:T.textMuted,fontSize:12,padding:'12px 0'}}>載入中…</div> : this.props.children }
}

// ── Card shell ─────────────────────────────────────────────
function Card({children, style={}, glow=false}:{children:React.ReactNode;style?:React.CSSProperties;glow?:boolean}) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        background: hov ? T.surfaceHov : T.surface,
        border: `1px solid ${hov ? T.borderHov : T.border}`,
        borderRadius: 16,
        padding: 20,
        backdropFilter: 'blur(12px)',
        transition: 'all 0.18s ease',
        boxShadow: glow && hov ? `0 0 32px ${T.brandGlow}` : 'none',
        ...style,
      }}
    >{children}</div>
  )
}

// ── Stat card ──────────────────────────────────────────────
function Stat({label, value, sub, icon, color}:{label:string;value:string|number;sub:string;icon:React.ReactNode;color:string}) {
  return (
    <Card glow>
      <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
        <div style={{padding:10,borderRadius:10,background:`${color}18`,color,display:'flex',flexShrink:0}}>{icon}</div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{label}</div>
          <div style={{fontSize:30,fontWeight:700,color:T.text,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{value}</div>
          <div style={{fontSize:11,color:T.textMuted,marginTop:5}}>{sub}</div>
        </div>
      </div>
    </Card>
  )
}

// ── Section header ─────────────────────────────────────────
function Sec({icon, title, badge}:{icon:React.ReactNode;title:string;badge?:string}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
      <span style={{color:T.brand}}>{icon}</span>
      <span style={{fontWeight:600,fontSize:13,color:T.text}}>{title}</span>
      {badge && <span style={{marginLeft:'auto',background:T.brandGlow,color:T.brand,borderRadius:20,padding:'2px 10px',fontSize:11,fontWeight:500}}>{badge}</span>}
    </div>
  )
}

// ── Agent hue pool ─────────────────────────────────────────
const HUE = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#3B82F6','#EC4899']

// ── Main ───────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<Data|null>(null)
  const [ts, setTs] = useState('')

  const load = () => fetch('/api/hub/dashboard').then(r=>r.json())
    .then(d=>{ if(d&&!d.error){setData(d);setTs(new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}))} })
    .catch(()=>{})

  useEffect(()=>{ load(); const t=setInterval(load,30000); return ()=>clearInterval(t) },[])

  const stats = data ? [
    {label:'待執行', value:data.statusCounts['待執行']??0, sub:`共 ${data.totalTasks} 個任務`, color:T.brand,   icon:Ico.list},
    {label:'執行中', value:data.statusCounts['執行中']??0, sub:'Agent 作業中',               color:T.amber,   icon:Ico.zap},
    {label:'已完成', value:data.statusCounts['已完成']??0, sub:`本週 +${data.weekCompleted}`, color:T.green,   icon:Ico.check},
    {label:'完成率', value:`${data.completionRate}%`,       sub:'歷史任務',                    color:'#A78BFA', icon:Ico.trend},
  ] : []

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:1320,margin:'0 auto',padding:'28px 24px'}}>

        {/* ── Page header ── */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:28}}>
          <div>
            <Link href="/hub" style={{display:'inline-flex',alignItems:'center',gap:5,color:T.textMuted,fontSize:12,textDecoration:'none',marginBottom:10,transition:'color 0.15s'}}
              onMouseEnter={e=>(e.currentTarget.style.color=T.text)}
              onMouseLeave={e=>(e.currentTarget.style.color=T.textMuted)}>
              {Ico.back} Hub
            </Link>
            <h1 style={{fontSize:24,fontWeight:700,letterSpacing:'-0.6px',margin:0}}>Clawd Dashboard</h1>
            <p style={{color:T.textSub,fontSize:13,margin:'4px 0 0'}}>系統即時監控 · 每 30 秒自動更新</p>
          </div>
          {ts && (
            <div style={{display:'flex',alignItems:'center',gap:6,color:T.textMuted,fontSize:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'7px 13px'}}>
              {Ico.refresh}<span style={{color:T.textSub}}>更新於</span> {ts}
            </div>
          )}
        </div>

        {!data ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:320,color:T.textMuted,gap:10}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.brand} strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            載入中…
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>

            {/* Stats row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {stats.map(s=><Stat key={s.label} {...s}/>)}
            </div>

            {/* Row 2 */}
            <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:12}}>
              {/* System */}
              <Card>
                <Sec icon={Ico.server} title="系統狀態"/>
                <EB>
                  {[
                    {k:'閘道器',v:'Running :18789'},
                    {k:'任務總數',v:`${data.totalTasks.toLocaleString()}`},
                    {k:'Agent 數',v:`${data.agents.length}`},
                    {k:'本週完成',v:`${data.weekCompleted}`},
                  ].map((r,i)=>(
                    <div key={r.k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<3?`1px solid ${T.border}`:'none'}}>
                      <span style={{color:T.textSub,fontSize:13}}>{r.k}</span>
                      <span style={{fontWeight:600,fontSize:13,fontVariantNumeric:'tabular-nums'}}>{r.v}</span>
                    </div>
                  ))}
                </EB>
                <div style={{marginTop:14,display:'flex',alignItems:'center',gap:6}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:T.green,display:'inline-block',boxShadow:`0 0 6px ${T.green}`}}/>
                  <span style={{fontSize:12,color:T.green}}>系統正常</span>
                </div>
              </Card>

              {/* Token trend */}
              <Card>
                <Sec icon={Ico.bar} title="Token 消耗趨勢（近 7 天）"/>
                <EB>
                  {data.tokenTrend.length>0 ? (
                    <Line
                      data={{
                        labels: data.tokenTrend.map(d=>d.date.slice(5)),
                        datasets:[{
                          label:'Tokens',
                          data: data.tokenTrend.map(d=>d.tokens),
                          borderColor: T.brand,
                          backgroundColor: `${T.brand}18`,
                          fill: true, tension: 0.4,
                          pointRadius: 4,
                          pointBackgroundColor: T.brand,
                          pointBorderColor: T.bg,
                          pointBorderWidth: 2,
                        }]
                      }}
                      options={{
                        responsive:true, maintainAspectRatio:false,
                        plugins:{legend:{display:false},tooltip:{backgroundColor:'#1E2030',borderColor:T.border,borderWidth:1,titleColor:T.text,bodyColor:T.textSub}},
                        scales:{
                          x:{grid:{color:T.border},ticks:{color:T.textMuted,font:{size:10,family:'Inter'}}},
                          y:{grid:{color:T.border},ticks:{color:T.textMuted,font:{size:10,family:'Inter'}}},
                        }
                      }}
                      height={170}
                    />
                  ) : (
                    <div style={{height:170,display:'flex',alignItems:'center',justifyContent:'center',color:T.textMuted,fontSize:13}}>尚無資料</div>
                  )}
                </EB>
              </Card>
            </div>

            {/* Agents */}
            {data.agents.length>0 && (
              <Card>
                <Sec icon={Ico.bot} title="Agent 狀態" badge={`${data.agents.filter(a=>a.isActive).length} 活躍`}/>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:10}}>
                  {data.agents.slice(0,8).map((ag,i)=>{
                    const c = HUE[i%HUE.length]
                    return (
                      <div key={ag.name} style={{background:`${c}0d`,border:`1px solid ${c}28`,borderRadius:12,padding:'14px 14px 12px',transition:'all 0.18s'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                          <div style={{width:34,height:34,borderRadius:9,background:c,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#fff',flexShrink:0,letterSpacing:'-0.3px'}}>
                            {ag.name.slice(0,1).toUpperCase()}
                          </div>
                          <div style={{minWidth:0,flex:1}}>
                            <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.name}</div>
                            <div style={{color:T.textMuted,fontSize:11,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.role||ag.name}</div>
                          </div>
                          {ag.isActive && <div style={{width:7,height:7,borderRadius:'50%',background:T.green,flexShrink:0,boxShadow:`0 0 5px ${T.green}`}}/>}
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textMuted,marginBottom:6}}>
                          <span>完成 {ag.completed}</span>
                          <span style={{fontVariantNumeric:'tabular-nums'}}>{ag.successRate}%</span>
                        </div>
                        <div style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${ag.successRate}%`,background:c,borderRadius:2,transition:'width 0.7s ease'}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Tasks row */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {/* Running */}
              <Card>
                <Sec icon={Ico.zap} title="執行中任務" badge={`${data.runningTasks.length}`}/>
                {data.runningTasks.length===0
                  ? <div style={{textAlign:'center',color:T.textMuted,fontSize:13,padding:'20px 0'}}>目前無執行中任務</div>
                  : data.runningTasks.map((t,i)=>(
                    <div key={i} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:i<data.runningTasks.length-1?`1px solid ${T.border}`:'none',alignItems:'flex-start'}}>
                      {Ico.dot(T.amber)}
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:T.text}}>{t.title}</div>
                        <div style={{color:T.textMuted,fontSize:11,marginTop:2}}>{t.assignee}</div>
                      </div>
                    </div>
                  ))
                }
              </Card>

              {/* Recent */}
              <Card>
                <Sec icon={Ico.check} title="最近完成任務"/>
                {data.recentCompleted.length===0
                  ? <div style={{textAlign:'center',color:T.textMuted,fontSize:13,padding:'20px 0'}}>尚無完成紀錄</div>
                  : data.recentCompleted.map((t,i)=>(
                    <div key={i} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:i<data.recentCompleted.length-1?`1px solid ${T.border}`:'none',alignItems:'flex-start'}}>
                      {Ico.dot(T.green)}
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:T.text}}>{t.title}</div>
                        <div style={{color:T.textMuted,fontSize:11,marginTop:2}}>
                          {t.assignee}{t.completedAt && ` · ${new Date(t.completedAt).toLocaleDateString('zh-TW')}`}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </Card>
            </div>

            <div style={{textAlign:'center',color:T.textMuted,fontSize:12,paddingBottom:12}}>
              William Hub · Clawd Dashboard · © 2026
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform:rotate(360deg) } }
          @media(max-width:900px){
            .g4{grid-template-columns:repeat(2,1fr)!important}
            .g2l{grid-template-columns:1fr!important}
            .g2{grid-template-columns:1fr!important}
          }
          * { box-sizing:border-box }
          a { color:inherit }
        `}</style>
      </div>
    </div>
  )
}
