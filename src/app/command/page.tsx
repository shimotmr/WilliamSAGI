"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { CommandDashboard } from './CommandDashboard'
import { TaskList } from './TaskList'
import { CostAnalytics } from './CostAnalytics'

type Tab = 'dashboard' | 'tasks' | 'costs'

export default function CommandCenterPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: '總控台', icon: '📊' },
    { key: 'tasks', label: '任務列表', icon: '📋' },
    { key: 'costs', label: '成本分析', icon: '💰' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0d0d14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg">
              🎯
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Agent 指揮中心</h1>
              <p className="text-xs text-gray-500">WilliamSAGI Command Center</p>
            </div>
          </div>
          <a href="/hub" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← 返回 Hub
          </a>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="border-b border-white/5 bg-[#0d0d14]/60">
        <div className="max-w-[1400px] mx-auto px-6 flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                tab === t.key
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {tab === 'dashboard' && <CommandDashboard />}
        {tab === 'tasks' && <TaskList />}
        {tab === 'costs' && <CostAnalytics />}
      </main>
    </div>
  )
}
