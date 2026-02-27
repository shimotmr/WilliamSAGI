// src/lib/agents-data.ts

export interface Agent {
  id: string
  name: string
  role: string
  description: string
  expertise: string[]
  model: string
  status: 'online' | 'offline' | 'busy'
  avatar: string
  avatarPosition?: string // 用於調整頭像裁切位置
  recentTasks?: string[]
}

export const agents: Agent[] = [
  {
    id: 'travis',
    name: 'Travis',
    role: 'Manager',
    description: 'William 的主要 AI 助手，負責協調其他 agents、處理複雜任務、做出決策。',
    expertise: ['任務編排', '決策制定', '系統監控', '記憶管理'],
    model: 'Claude Sonnet 4.6',
    status: 'online',
    avatar: '/avatars/travis.png',
    avatarPosition: 'center center',
    recentTasks: [
      '協調網站修復任務',
      '每日記憶備份',
      '業績報表監控'
    ]
  },
  {
    id: 'warren',
    name: 'Warren',
    role: 'Trader',
    description: '專注於數據分析、交易決策、風險管理。',
    expertise: ['數據分析', '交易策略', '風險管理', '趨勢預測'],
    model: 'MiniMax M2.5',
    status: 'online',
    avatar: '/avatars/warren.png',
    avatarPosition: 'center 30%',
    recentTasks: [
      '週度 Pipeline 風險分析',
      'Funnel 報表同步',
      '業績達成率監控'
    ]
  },
  {
    id: 'blake',
    name: 'Blake',
    role: 'Builder',
    description: '負責程式開發、bug 修復、功能實作。',
    expertise: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    model: 'MiniMax M2.5',
    status: 'online',
    avatar: '/avatars/blake.png',
    avatarPosition: 'center 35%',
    recentTasks: [
      '實作 Agent 詳情頁',
      '修復頭像裁切問題',
      'Vercel 部署優化'
    ]
  },
  {
    id: 'griffin',
    name: 'Griffin',
    role: 'Guardian',
    description: '負責功能測試、內容審查、連結驗證、品質把關。',
    expertise: ['功能測試', '內容審查', 'Bug 追蹤', '品質控制'],
    model: 'MiniMax M2.5',
    status: 'online',
    avatar: '/avatars/griffin.png',
    avatarPosition: 'center 25%',
    recentTasks: [
      '每日網站巡檢',
      'Vercel 部署驗證',
      '功能完整性測試'
    ]
  },
  {
    id: 'rex',
    name: 'Rex',
    role: 'Thinker',
    description: '負責深度研究、技能發掘、市場調查。',
    expertise: ['深度研究', '技能評估', '市場分析', '趨勢追蹤'],
    model: 'MiniMax M2.5',
    status: 'online',
    avatar: '/avatars/rex.png',
    avatarPosition: 'center 30%',
    recentTasks: [
      '每日掃描錯誤日誌',
      '尋找合適的 Skills',
      '技術趨勢研究'
    ]
  },
  {
    id: 'oscar',
    name: 'Oscar',
    role: 'Operator',
    description: '負責郵件處理、行程管理、文件整理。',
    expertise: ['郵件管理', '行程安排', '文件整理', '提醒通知'],
    model: 'MiniMax M2.5',
    status: 'online',
    avatar: '/avatars/oscar.png',
    avatarPosition: 'center 35%',
    recentTasks: [
      '早晨郵件摘要',
      'Zimbra 簽核檢查',
      '行事曆同步'
    ]
  }
]

export function getAgent(id: string): Agent | undefined {
  return agents.find(a => a.id === id)
}
