import Link from 'next/link'
import { LayoutDashboard, Users, Gamepad2 } from 'lucide-react'

const portals = [
  {
    title: 'SAGI',
    subtitle: '管理介面',
    description: '個人 AI 助理系統，控制塔與數據分析',
    href: '/hub',
    icon: LayoutDashboard,
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    title: 'Portal',
    subtitle: '業務管理',
    description: '客戶管理、銷售追蹤、內部協作平台',
    href: '/portal',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    title: '互動',
    subtitle: '遊戲體驗',
    description: 'AI 驅動的互動體驗與休閒娛樂',
    href: '/showcase',
    icon: Gamepad2,
    gradient: 'from-pink-500 to-rose-600',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold">W</span>
            </div>
            <span className="font-medium">WilliamSAGI</span>
          </div>
          <Link 
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            登入
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="max-w-4xl w-full">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            選擇你的入口
          </h1>
          <p className="text-zinc-400 text-center mb-12">
            三個獨立介面，各自服務不同需求
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portals.map((portal) => (
              <Link
                key={portal.href}
                href={portal.href}
                className="group block p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-white/10 hover:bg-zinc-900 transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${portal.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <portal.icon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-1">{portal.title}</h2>
                <p className="text-sm text-zinc-400 mb-4">{portal.subtitle}</p>
                <p className="text-sm text-zinc-500">
                  {portal.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-6">
        <div className="max-w-5xl mx-auto text-center text-sm text-zinc-500">
          © 2026 WilliamSAGI
        </div>
      </footer>
    </div>
  )
}
