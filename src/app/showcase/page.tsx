'use client'

import { useEffect, useState } from 'react'

interface Task {
  id: string
  title: string
  assignee: string
  priority: string
  status?: string
  description?: string
  updated_at?: string
}

interface ShowcaseData {
  role: string
  tasks: Task[]
  error?: string
}

const conversations = [
  {
    agent: 'Blake',
    color: '#0ea5e9',
    messages: [
      { from: 'user', text: 'Blake，幫我建一個公司官網，要有 RWD 和 SEO 優化。' },
      { from: 'agent', text: '沒問題！我會使用 Next.js 框架搭配 Tailwind CSS 來建構。先確認幾個需求：\n1. 需要哪些頁面？首頁、關於我們、產品、聯絡？\n2. 是否需要多語系支援？\n3. 色系偏好？' },
      { from: 'user', text: '全部都要，多語系要中英文，色系用公司的紅色主題。' },
      { from: 'agent', text: '收到！我已開始建構：\n✅ 專案架構已建立\n✅ 首頁 Hero Section 完成\n🔄 正在處理多語系 i18n 設定...\n預計 15 分鐘內完成初版部署。' },
    ],
  },
  {
    agent: 'Rex',
    color: '#8b5cf6',
    messages: [
      { from: 'user', text: 'Rex，分析一下東南亞自動化設備市場的現況和趨勢。' },
      { from: 'agent', text: '正在蒐集資料中...我會從以下幾個面向分析：\n📊 市場規模與成長率\n🏭 主要競爭者格局\n📈 技術趨勢（AI、IoT 整合）\n🌏 各國政策與投資環境' },
      { from: 'user', text: '重點放在越南和泰國的機會。' },
      { from: 'agent', text: '分析完成！關鍵發現：\n\n🇻🇳 越南：製造業 FDI 年增 23%，自動化需求缺口大\n🇹🇭 泰國：EEC 政策推動，工業 4.0 補貼可達 50%\n\n建議優先進入越南市場，已產出完整 PDF 報告供下載。' },
    ],
  },
  {
    agent: 'Warren',
    color: '#22c55e',
    messages: [
      { from: 'user', text: 'Warren，今天台股有什麼值得關注的交易機會？' },
      { from: 'agent', text: '早安！根據我的分析：\n\n📈 多方訊號：\n• 台積電(2330) 突破月線，外資連 3 日買超\n• AI 族群量能持續放大\n\n📉 風險提醒：\n• 美債殖利率攀升，留意資金撤出\n• 今晚有 Fed 會議紀要' },
      { from: 'user', text: '台積電可以進場嗎？建議的策略？' },
      { from: 'agent', text: '建議策略：\n\n🎯 進場價位：回測 5 日線（約 1,050）分批布局\n📊 部位配置：總資金 15%，分 3 批進場\n🛡️ 停損設定：跌破 1,020（-2.8%）\n🎯 目標價位：1,120（+6.7%）\n\n⚠️ 這是 AI 分析建議，投資決策請自行評估風險。' },
    ],
  },
]

const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  high: { label: '高', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  medium: { label: '中', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
  low: { label: '低', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
}

export default function ShowcasePage() {
  const [data, setData] = useState<ShowcaseData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/showcase')
      .then(res => res.json())
      .then(setData)
      .catch(() => setData({ role: 'guest', tasks: [] }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent" style={{ borderColor: 'var(--primary-500)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const isAdmin = data?.role === 'admin'

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Showcase</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isAdmin ? '目前執行中的真實任務' : 'AI 代理人對話示範'}
          </p>
          <span
            className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: isAdmin ? 'var(--primary-100, #fee2e2)' : 'var(--surface-2)',
              color: isAdmin ? 'var(--primary-600, #dc2626)' : 'var(--text-secondary)',
            }}
          >
            {isAdmin ? 'Admin' : 'Visitor'}
          </span>
        </div>

        {isAdmin ? (
          /* Admin: Task Cards */
          <div className="grid gap-4 sm:grid-cols-2">
            {data?.tasks?.map(task => {
              const p = priorityConfig[task.priority] ?? priorityConfig.medium
              return (
                <div key={task.id} className="card p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-snug flex-1">{task.title}</h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${p.bg} ${p.text}`}>
                      {p.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {task.assignee ?? '未指派'}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      #{task.id}
                    </span>
                  </div>
                  {task.status && (
                    <span
                      className="self-start px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: 'var(--secondary-100, #dcfce7)', color: 'var(--secondary-700, #15803d)' }}
                    >
                      {task.status}
                    </span>
                  )}
                </div>
              )
            })}
            {(!data?.tasks || data.tasks.length === 0) && (
              <p className="col-span-2 text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                目前沒有執行中的任務
              </p>
            )}
          </div>
        ) : (
          /* Non-admin: Conversation bubbles */
          <div className="flex flex-col gap-10">
            {conversations.map(conv => (
              <div key={conv.agent} className="card p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: conv.color }}
                  >
                    {conv.agent[0]}
                  </div>
                  <span className="font-semibold text-sm">{conv.agent}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: conv.color + '20', color: conv.color }}
                  >
                    AI Agent
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {conv.messages.map((msg, i) => {
                    const isAgent = msg.from === 'agent'
                    return (
                      <div key={i} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line"
                          style={
                            isAgent
                              ? { background: 'var(--surface-2)', color: 'var(--text-primary)' }
                              : { background: conv.color, color: '#fff' }
                          }
                        >
                          {msg.text}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
