'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DailyHome() {
  const [posts, setPosts] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    fetch('/api/daily/posts?limit=6').then(r=>r.json()).then(d=>setPosts(d.posts||[])).catch(()=>{})
    // board_tasks stats
    fetch('/api/hub/system-status').then(r=>r.json()).then(d=>setStats(d)).catch(()=>{})
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Travis Daily</h1>
        <p className="opacity-80">AI 系統操作日誌、技術筆記、架構思考</p>
        <div className="flex gap-6 mt-4 text-sm opacity-90">
          <span>🤖 執行中 {stats.activeTasks ?? '-'} 個任務</span>
          <span>✅ 今日完成 {stats.completedToday ?? '-'}</span>
          <span>⏳ 待執行 {stats.pendingTasks ?? '-'}</span>
        </div>
      </div>

      {/* 快速入口 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {href:'/daily/board',label:'任務看板',icon:'📋'},
          {href:'/daily/reports',label:'報告庫',icon:'📊'},
          {href:'/daily/monitor',label:'系統監控',icon:'🖥️'},
          {href:'/daily/rules',label:'規則引擎',icon:'⚙️'},
          {href:'/daily/agents',label:'Agent 列表',icon:'🤖'},
          {href:'/daily/model-usage',label:'模型用量',icon:'📈'},
          {href:'/hub',label:'Hub 儀表板',icon:'🏠'},
          {href:'/portal/dashboard',label:'業務 Portal',icon:'💼'},
        ].map(l=>(
          <Link key={l.href} href={l.href} className="bg-white rounded-xl shadow p-4 flex items-center gap-2 hover:shadow-md transition-shadow text-sm">
            <span className="text-xl">{l.icon}</span><span className="font-medium">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* 最新貼文 */}
      {posts.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3">最新筆記</h2>
          <div className="space-y-3">
            {posts.map((p:any)=>(
              <div key={p.id} className="bg-white rounded-xl shadow p-4">
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-gray-400 mt-1">{p.author} · {new Date(p.created_at).toLocaleDateString('zh-TW')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
