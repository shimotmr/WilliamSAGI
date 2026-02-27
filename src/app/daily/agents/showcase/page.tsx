'use client'

import { ArrowLeft, Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import { showcaseAgents, type ShowcaseAgent } from '@/lib/showcase-agents-data'
// 

type ViewMode = 'office' | 'agent' | 'team'

// Agent 場景配色
const agentScenes: Record<string, { gradient: string; dialogues: string[] }> = {
  travis: {
    gradient: 'from-blue-900 via-blue-700 to-amber-600',
    dialogues: [
      '全員就位，任務開始。',
      '各系統運行正常，效率預估 92%。',
      '今日任務達成率 95%，各位辛苦了。',
      '正在協調資源...報告已收到。'
    ]
  },
  blake: {
    gradient: 'from-gray-900 via-gray-800 to-green-600',
    dialogues: [
      '沒有我寫不出來的程式，只有還沒想到的架構。',
      'Debug 中...這個 bug 藏得真深。',
      'Build 成功，所有測試通過！',
      '功能開發完成，等 Griffin 審查。'
    ]
  },
  rex: {
    gradient: 'from-teal-600 via-blue-500 to-sky-400',
    dialogues: [
      '答案永遠藏在下一頁。',
      '這個趨勢很有意思...交叉驗證中。',
      '深度研究報告完成，已發送。',
      '整理昨日收集的動態...共 12 則值得關注。'
    ]
  },
  oscar: {
    gradient: 'from-amber-700 via-orange-400 to-yellow-200',
    dialogues: [
      '細節決定成敗，流程確保品質。',
      '行事曆已更新，下一個會議在 14:00。',
      '所有文件已歸檔，報告已發送。',
      '正在整理待辦事項...優先級已排序。'
    ]
  },
  warren: {
    gradient: 'from-gray-800 via-gray-700 to-amber-500',
    dialogues: [
      '數據不會說謊，但會被誤讀。',
      '發現機會！正在計算風險收益比...',
      '今日交易完成，收益率 +3.2%。',
      '市場平穩，等待最佳進場時機。'
    ]
  },
  griffin: {
    gradient: 'from-gray-900 via-gray-600 to-red-600',
    dialogues: [
      '通過我的審查，才算真正完成。',
      '正在審查 PR...發現 2 個潛在問題。',
      '代碼審查完成，品質達標。',
      '系統穩定，無異常。'
    ]
  }
}

// 打字機效果 hook
function useTypewriter(text: string, speed: number = 50) {
  const [displayed, setDisplayed] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setIsComplete(false)
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        setIsComplete(true)
        clearInterval(timer)
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return { displayed, isComplete }
}

export default function AgentShowcasePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('office')
  const [selectedAgent, setSelectedAgent] = useState<ShowcaseAgent | null>(null)
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0)
  const [showInfo, setShowInfo] = useState(false)

  // 切換到 Agent 場景
  const enterAgentScene = (agent: ShowcaseAgent) => {
    setSelectedAgent(agent)
    setViewMode('agent')
    setCurrentDialogueIndex(0)
    setShowInfo(false)
  }

  // 切換到下一個 Agent
  const nextAgent = () => {
    if (!selectedAgent) return
    const currentIndex = showcaseAgents.findIndex(a => a.id === selectedAgent.id)
    const nextIndex = (currentIndex + 1) % showcaseAgents.length
    enterAgentScene(showcaseAgents[nextIndex])
  }

  // 台詞輪播
  useEffect(() => {
    if (viewMode !== 'agent' || !selectedAgent) return
    const dialogues = agentScenes[selectedAgent.id]?.dialogues || []
    const timer = setInterval(() => {
      setCurrentDialogueIndex(prev => (prev + 1) % dialogues.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [viewMode, selectedAgent])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-purple-50 to-pink-100">
      {/* 視圖 1: 辦公室總覽 */}
      {viewMode === 'office' && (
        <OfficeView 
          onAgentClick={enterAgentScene}
          onTeamView={() => setViewMode('team')}
        />
      )}

      {/* 視圖 2: Agent 場景 (Galgame 模式) */}
      {viewMode === 'agent' && selectedAgent && (
        <AgentScene
          agent={selectedAgent}
          dialogueIndex={currentDialogueIndex}
          showInfo={showInfo}
          onToggleInfo={() => setShowInfo(!showInfo)}
          onBack={() => setViewMode('office')}
          onNext={nextAgent}
        />
      )}

      {/* 視圖 3: 團隊集合 */}
      {viewMode === 'team' && (
        <TeamView
          onAgentClick={enterAgentScene}
          onBack={() => setViewMode('office')}
        />
      )}
    </div>
  )
}

// 視圖 1: 辦公室總覽
function OfficeView({ 
  onAgentClick,
  onTeamView
}: { 
  onAgentClick: (agent: ShowcaseAgent) => void
  onTeamView: () => void
}) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100" />
      <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
      <div className="absolute top-40 right-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-40 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />

      {/* 內容 */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 標題 */}
        <div className="text-center mb-12 animate-fadeIn">
          <Link 
            href="/agents"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">返回</span>
          </Link>
          <h1 className="text-6xl md:text-7xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
            Travis AI Office
          </h1>
          <p className="text-xl text-gray-700 font-medium">
            ✨ 點擊任意工作站，進入 Agent 的工作場景 ✨
          </p>
        </div>

        {/* Agent 工作站網格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-8">
          {showcaseAgents.map((agent, index) => (
            <div
              key={agent.id}
              onClick={() => onAgentClick(agent)}
              className="group relative bg-white rounded-3xl p-6 cursor-pointer
                         transform hover:scale-110 transition-all duration-300
                         hover:shadow-2xl hover:z-10 border-4 border-transparent hover:border-purple-400
                         animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* 狀態燈 */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 font-bold">IDLE</span>
              </div>

              {/* 頭像 */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 
                             shadow-lg group-hover:shadow-2xl transition-shadow relative">
                {agent.maleImage ? (
                  <img
                    src={agent.maleImage}
                    alt={agent.name}
                    
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${agent.gradient}`} />
                )}
                {/* Hover 遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent 
                               opacity-0 group-hover:opacity-100 transition-opacity
                               flex items-end justify-center pb-4">
                  <span className="text-white font-bold text-sm">點擊進入 →</span>
                </div>
              </div>

              {/* 名稱 */}
              <h3 className="text-xl font-black text-center mb-1" style={{ color: agent.color }}>
                {agent.name}
              </h3>
              <p className="text-sm text-gray-600 text-center font-medium">
                {agent.title}
              </p>
            </div>
          ))}
        </div>

        {/* 團隊集合按鈕 */}
        <div className="text-center animate-fadeIn animation-delay-1000">
          <button
            onClick={onTeamView}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500
                       text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600
                       transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
          >
            <Users className="w-6 h-6" />
            <span>查看全員集合</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// 視圖 2: Agent 場景
function AgentScene({
  agent,
  dialogueIndex,
  showInfo,
  onToggleInfo,
  onBack,
  onNext
}: {
  agent: ShowcaseAgent
  dialogueIndex: number
  showInfo: boolean
  onToggleInfo: () => void
  onBack: () => void
  onNext: () => void
}) {
  const scene = agentScenes[agent.id]
  const currentDialogue = scene?.dialogues[dialogueIndex] || agent.quote
  const { displayed } = useTypewriter(currentDialogue, 40)

  return (
    <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${scene?.gradient || agent.gradient}`}>
      {/* 返回按鈕 */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full
                   hover:bg-white transition-all shadow-lg flex items-center gap-2 font-bold text-gray-700"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回辦公室</span>
      </button>

      {/* 角色立繪 */}
      <div className="absolute left-0 bottom-0 w-1/2 h-full flex items-end justify-start p-8 animate-slideInLeft">
        <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
          {agent.maleImage ? (
            <img
                    src={agent.maleImage}
                    alt={agent.name}
                    
                    className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${agent.gradient}`} />
          )}
        </div>
      </div>

      {/* 右側資訊面板 */}
      <div className={`absolute right-0 top-0 h-full w-full md:w-1/2 flex items-center justify-center p-8
                       transition-all duration-500 ${showInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl max-w-md w-full animate-slideInRight">
          <h2 className="text-3xl font-black mb-2" style={{ color: agent.color }}>{agent.name}</h2>
          <p className="text-lg font-bold text-gray-700 mb-4">{agent.title}</p>
          
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">經典台詞</h3>
            <p className="text-gray-800 italic">「{agent.quote}」</p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">能力值</h3>
            <div className="space-y-3">
              {agent.skills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-sm font-bold" style={{ color: agent.color }}>{skill.value}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${skill.value}%`, backgroundColor: agent.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed">{agent.description}</p>
        </div>
      </div>

      {/* Galgame 對話框 (底部) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 animate-slideUp">
        <div className="max-w-4xl mx-auto">
          <div className="dialogue-box bg-white/95 backdrop-blur-md rounded-r-3xl border-l-4 shadow-2xl p-6"
               style={{ borderColor: agent.color }}>
            {/* 名稱標籤 */}
            <div className="name-tag mb-3 inline-block px-4 py-1 rounded-full font-bold text-white text-sm"
                 style={{ backgroundColor: agent.color }}>
              {agent.name}
            </div>
            
            {/* 對話文字 (打字機效果) */}
            <p className="text-lg text-gray-800 leading-relaxed min-h-[2em]">
              {displayed}
              <span className="inline-block w-2 h-5 bg-gray-800 ml-1 animate-blink" />
            </p>
          </div>
        </div>
      </div>

      {/* 底部選項按鈕 */}
      <div className="absolute bottom-6 right-6 flex gap-3 z-10">
        <button
          onClick={onToggleInfo}
          className="px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full font-bold
                     hover:bg-white transition-all shadow-lg hover:scale-105"
          style={{ color: agent.color }}
        >
          {showInfo ? '隱藏資訊' : '查看詳細資料'}
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-full font-bold text-white
                     hover:scale-105 transition-all shadow-lg flex items-center gap-2"
          style={{ backgroundColor: agent.color }}
        >
          <span>下一位</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// 視圖 3: 團隊集合
function TeamView({
  onAgentClick,
  onBack
}: {
  onAgentClick: (agent: ShowcaseAgent) => void
  onBack: () => void
}) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
      {/* 返回按鈕 */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 px-4 py-2 bg-white rounded-full
                   hover:bg-gray-50 transition-all shadow-lg flex items-center gap-2 font-bold"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回辦公室</span>
      </button>

      {/* 標題 */}
      <div className="text-center pt-20 pb-12">
        <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          Travis AI Team
        </h1>
        <p className="text-xl text-gray-700 font-medium">六位專業 Agent，隨時待命</p>
      </div>

      {/* 角色陣列 */}
      <div className="flex flex-wrap justify-center items-end gap-4 px-4 pb-20">
        {showcaseAgents.map((agent, index) => (
          <div
            key={agent.id}
            onClick={() => onAgentClick(agent)}
            onMouseEnter={() => setHoveredAgent(agent.id)}
            onMouseLeave={() => setHoveredAgent(null)}
            className="relative cursor-pointer transition-all duration-300 animate-fadeIn"
            style={{ 
              animationDelay: `${index * 100}ms`,
              transform: hoveredAgent === agent.id ? 'scale(1.15) translateY(-20px)' : 'scale(1)'
            }}
          >
            {/* 立繪 */}
            <div className="w-40 md:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl 
                           hover:shadow-2xl transition-shadow relative border-4 border-white">
              {agent.maleImage ? (
                <img
                    src={agent.maleImage}
                    alt={agent.name}
                    
                    className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${agent.gradient}`} />
              )}
            </div>

            {/* 名稱標籤 */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-bold text-white text-sm shadow-lg whitespace-nowrap"
                 style={{ backgroundColor: agent.color }}>
              {agent.name}
            </div>

            {/* Hover 台詞氣泡 */}
            {hoveredAgent === agent.id && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white rounded-2xl p-3 shadow-xl
                             min-w-[200px] max-w-[250px] text-center animate-fadeIn">
                <p className="text-sm text-gray-800 font-medium">「{agent.quote}」</p>
                {/* 三角形 */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
