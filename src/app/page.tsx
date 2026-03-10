import Link from 'next/link'
import { LayoutDashboard, Users, Gamepad2 } from 'lucide-react'

const portals = [
  {
    title: 'SAGI',
    subtitle: '管理介面',
    href: '/hub',
    icon: LayoutDashboard,
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    title: 'Portal',
    subtitle: '業務管理',
    href: '/portal',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    title: '互動',
    subtitle: '遊戲體驗',
    href: '/showcase',
    icon: Gamepad2,
    gradient: 'from-pink-500 to-rose-600',
  },
]

export default function Home() {
  return (
    <div className="h-dvh bg-[#0a0a0b] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/5 shrink-0">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
          選擇你的入口
        </h1>
        <p className="text-zinc-500 text-sm text-center mb-6">
          三個獨立介面，各自服務不同需求
        </p>

        <div className="w-full max-w-md flex flex-col gap-3">
          {portals.map((portal) => (
            <Link
              key={portal.href}
              href={portal.href}
              className="group flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-xl hover:border-white/10 hover:bg-zinc-900 transition-all"
            >
              <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${portal.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <portal.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight">{portal.title}</h2>
                <p className="text-sm text-zinc-400">{portal.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 py-3 px-6">
        <div className="text-center text-xs text-zinc-600">
          © 2026 WilliamSAGI
        </div>
      </footer>
    </div>
  )
}
