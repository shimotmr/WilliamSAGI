'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ClipboardList, 
  LineChart, 
  FileText, 
  Wrench, 
  Menu, 
  X,
  Bot,
  MessageSquare,
  Settings,
  Brain,
  TrendingUp,
  AlertTriangle,
  Database,
  Mic,
  TestTube,
  FolderKanban,
  Server,
  Cpu,
  GitBranch,
  Beaker,
  Terminal,
  Radio
} from 'lucide-react'

// Icons
const icons = {
  menu: <Menu size={24} />,
  close: <X size={24} />,
}

// 5 major navigation groups
const NAV_GROUPS = [
  {
    label: '🌅 早晨',
    icon: <LineChart size={18} />,
    items: [
      { id: 'dashboard', title: '儀表板', href: '/hub/dashboard', icon: <LayoutDashboard size={18} /> },
    ]
  },
  {
    label: '⚙️ 操作',
    icon: <Settings size={18} />,
    items: [
      { id: 'board', title: '任務看板', href: '/hub/board', icon: <ClipboardList size={18} /> },
      { id: 'monitor', title: '系統監控', href: '/hub/monitor', icon: <Server size={18} /> },
      { id: 'alerts', title: '系統警報', href: '/hub/alerts', icon: <AlertTriangle size={18} /> },
      { id: 'analytics', title: '數據分析', href: '/hub/analytics', icon: <TrendingUp size={18} /> },
    ]
  },
  {
    label: '📈 交易',
    icon: <LineChart size={18} />,
    items: [
      { id: 'trade', title: '交易系統', href: '/hub/trade', icon: <LineChart size={18} /> },
    ]
  },
  {
    label: '📋 報告',
    icon: <FileText size={18} />,
    items: [
      { id: 'reports', title: '報告中心', href: '/hub/reports', icon: <FileText size={18} /> },
    ]
  },
  {
    label: '🔧 工具',
    icon: <Wrench size={18} />,
    items: [
      { id: 'agents', title: 'Agent 中控', href: '/hub/agents', icon: <Bot size={18} /> },
      { id: 'prompts', title: '提示詞庫', href: '/hub/prompts', icon: <Brain size={18} /> },
      { id: 'rules', title: '規則引擎', href: '/hub/rules', icon: <GitBranch size={18} /> },
      { id: 'warroom', title: '作戰室', href: '/hub/warroom', icon: <Terminal size={18} /> },
      { id: 'rag-testing', title: 'RAG 測試', href: '/hub/rag-testing', icon: <Beaker size={18} /> },
      { id: 'growth', title: '成長趨勢', href: '/hub/growth', icon: <TrendingUp size={18} /> },
      { id: 'model-usage', title: '模型用量', href: '/hub/model-usage', icon: <Cpu size={18} /> },
      { id: 'disk-health', title: '磁碟健康', href: '/hub/disk-health', icon: <Database size={18} /> },
      { id: 'chat', title: '對話記錄', href: '/hub/chat', icon: <MessageSquare size={18} /> },
      { id: 'linebot-training', title: 'LINE Bot', href: '/hub/linebot-training', icon: <Mic size={18} /> },
      { id: 'test-realtime', title: '即時測試', href: '/hub/test-realtime', icon: <TestTube size={18} /> },
      { id: 'offline', title: '離線工具', href: '/hub/offline', icon: <Radio size={18} /> },
    ]
  }
]

export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = stored || (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/hub') return pathname === '/hub'
    if (href === '/hub/') return pathname === '/hub'
    return pathname.startsWith(href)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const isHomePage = pathname === '/hub' || pathname === '/hub/'

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-40 bg-card border-r">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b">
          <Link href="/hub" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-base">William Hub</div>
              <div className="text-xs text-muted-foreground">AI Control Center</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-5">
              <div className="px-3 mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.icon}
                <span>{group.label}</span>
              </div>
              <div className="space-y-1">
                {group.items.map(item => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                      isActive(item.href)
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 border-t">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-full py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
          >
            {theme === 'dark' ? '☀️ 淺色模式' : '🌙 深色模式'}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50 bg-card border-b">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-10 h-10 rounded-lg flex items-center justify-center"
        >
          {icons.menu}
        </button>

        <Link href="/hub" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm">William Hub</span>
        </Link>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Main Content */}
      <main className="md:ml-64 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] flex flex-col bg-card">
            <div className="flex items-center justify-between p-4 h-14 border-b">
              <Link href="/hub" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm">William Hub</div>
                  <div className="text-xs text-muted-foreground">AI Control Center</div>
                </div>
              </Link>
              
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
              >
                {icons.close}
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              {NAV_GROUPS.map(group => (
                <div key={group.label} className="mb-5">
                  <div className="px-3 mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.icon}
                    <span>{group.label}</span>
                  </div>
                  <div className="space-y-1">
                    {group.items.map(item => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                          isActive(item.href)
                            ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
