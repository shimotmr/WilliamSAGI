'use client'

import { useEffect, useState } from 'react'
import Breadcrumb from '@/components/Breadcrumb'

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
      { from: 'user', text: 'Blake，我需要一個產品展示頁面，要有 RWD 和 SEO 優化...' },
      { from: 'agent', text: '沒問題！我建議用 Next.js 搭配 Tailwind CSS 來實現。讓我了解一下需求...\n1. 產品圖片輪播和規格表格\n2. 可以聯繫業務的表單\n3. 響應式設計' },
      { from: 'user', text: '太好了，再幫我加上暗黑模式和 i18n 多語系支援。' },
      { from: 'agent', text: '收到！我會加入...\n\n• Hero Section 和產品特色卡片\n🎯 支援中英文切換，響應式設計...\n交付成果：15 個可重用元件，完整設計規範。' },
    ],
  },
  {
    agent: 'Rex',
    color: '#8b5cf6',
    messages: [
      { from: 'user', text: 'Rex，我需要一份競爭對手分析報告，包含市場份額和產品優劣勢。' },
      { from: 'agent', text: '我來整理一下...建議採用以下結構：\n\n📊 市場規模與增長趨勢\n🔍 競品功能對比矩陣\n🤖 AI 功能評估與差距分析\n💡 差異化機會點與策略建議' },
      { from: 'user', text: '請特別關注 AI 功能和定價策略的部分。' },
      { from: 'agent', text: '分析完成！關鍵發現：\n\n🐶🐱 競品對手：市場領導者 FDI 佔有率 23%，主打高性價比\n🐭🐹 定價策略：EEC 價格帶較低，平均售價 4.0 萬元起，毛利率 50%\n\n建議我們採取差異化定位，透過 PDF 報告呈現完整的策略規劃。' },
    ],
  },
  {
    agent: 'Warren',
    color: '#22c55e',
    messages: [
      { from: 'user', text: 'Warren，幫我分析這個股票投資組合的風險和報酬率。' },
      { from: 'agent', text: '沒問題！分析結果如下：\n\n📈 投資組合總報酬：+15.2%\n➗ 波動度(標準差)：3\n\n🤖 AI 投資建議：\n• 科技類股權重可適度增加至 25%，分散風險\n• 增加 Fed 利率決策觀察指標' },
      { from: 'user', text: '請幫我找出投資組合中的風險集中點。' },
      { from: 'agent', text: '風險分析結果：\n\n⬇ 單一產業集中度：最高達 5 檔股票 (約 1,050 股，-2.8%)\n⬆ 產業配置建議：分散至 3 個產業\n⬇ 單一標的權重：1,120 (+6.7%)\n\n👉 建議使用 AI 輔助投資組合再平衡功能。' },
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
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Showcase' }]} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Showcase</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isAdmin ? '管理員視角查看所有任務進度' : 'AI Agent 能力展示與使用範例'}
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
                暫無任務數據
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
