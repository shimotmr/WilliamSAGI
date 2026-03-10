import Link from 'next/link'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Zap,
  Shield,
  Workflow
} from 'lucide-react'

const features = [
  {
    title: '儀表板',
    description: '整合所有數據，实时监控关键指标',
    href: '/hub',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: '每日報告',
    description: '自动化产出，定期生成详细报告',
    href: '/daily',
    icon: Calendar,
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Portal',
    description: '工作入口，集中管理业务流程',
    href: '/portal',
    icon: Users,
    color: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Digest',
    description: '信息聚合，智能整理每日要点',
    href: '/digest',
    icon: FileText,
    color: 'from-orange-500 to-amber-500',
  },
  {
    title: 'Control Tower',
    description: '指挥中心，全面掌控系统状态',
    href: '/control-tower',
    icon: BarChart3,
    color: 'from-red-500 to-rose-500',
  },
  {
    title: 'Status',
    description: '系统状态，监控服务运行情况',
    href: '/status',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
  },
]

const stats = [
  { value: '99.9%', label: '正常运行时间' },
  { value: '<100ms', label: '响应延迟' },
  { value: '24/7', label: '监控覆盖' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">WilliamSAGI</span>
          </div>
          <Link 
            href="/login"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            登入
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            AI 助理系統
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            個人效率平台 · 整合 AI 能力與工作流程
          </p>
          <div className="flex items-center justify-center gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8">功能導航</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group p-6 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-white/10 hover:bg-zinc-900 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-indigo-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-zinc-500">
          <div>© 2026 WilliamSAGI</div>
          <div className="flex items-center gap-4">
            <Link href="/status" className="hover:text-zinc-300 transition-colors">
              系統狀態
            </Link>
            <span className="text-zinc-700">|</span>
            <span>Build with AI</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
