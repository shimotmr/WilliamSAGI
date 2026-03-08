'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const sections = [
  { href: '/portal/humanoid/docs', label: '技術文件庫', icon: '', desc: 'SDK 文檔、API 參考、整合指南', status: 'live' },
  { href: '/portal/humanoid/research', label: '研究報告', icon: '', desc: 'VLA 模型、演算法研究、市場分析', status: 'live' },
  { href: '/portal/humanoid/projects', label: '專案追蹤', icon: '', desc: '里程碑、進度、任務看板', status: 'coming' },
  { href: '/portal/humanoid/experiments', label: '實驗數據', icon: '', desc: '測試記錄、演算法比較、數據分析', status: 'coming' },
  { href: '/portal/humanoid/vla', label: 'VLA 模型研究', icon: '', desc: 'Vision-Language-Action 模型整理', status: 'coming' },
]

export default function HumanoidPage() {
  const [reports, setReports] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/portal/humanoid').then(r => r.json()).then(d => setReports(d.reports || []))
  }, [])

  return (
    <div className="p-6 space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl"></span>
          <div>
            <h1 className="text-3xl font-bold">人形機器人專區</h1>
            <p className="opacity-70 text-sm mt-1">Humanoid Robot Research & Development Hub</p>
          </div>
        </div>
        <div className="flex gap-6 mt-4 text-sm opacity-80">
          <span> {reports.length} 份研究資料</span>
          <span> 天工 2.0 SDK 文件</span>
          <span> 宇樹、Agility Robotics 研究中</span>
        </div>
      </div>

      {/* 功能區塊 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(s => (
          <Link key={s.href} href={s.href}
            className={`relative bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow ${s.status === 'coming' ? 'opacity-70' : ''}`}>
            {s.status === 'coming' && (
              <span className="absolute top-3 right-3 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">即將推出</span>
            )}
            <div className="text-4xl mb-3">{s.icon}</div>
            <h2 className="font-semibold mb-1">{s.label}</h2>
            <p className="text-sm text-gray-500">{s.desc}</p>
          </Link>
        ))}
      </div>

      {/* 最新研究資料 */}
      {reports.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-5 py-3 border-b flex justify-between items-center">
            <h2 className="font-semibold">最新研究資料</h2>
            <Link href="/portal/humanoid/research" className="text-xs text-blue-600 hover:underline">查看全部 →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {reports.slice(0, 5).map(r => (
              <Link key={r.id} href={`/hub/reports/${r.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-gray-400">{r.author} · {r.type}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('zh-TW')}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
