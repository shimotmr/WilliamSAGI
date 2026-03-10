import Link from 'next/link'
import { 
  LayoutDashboard, 
  Calendar, 
  Briefcase, 
  BarChart3,
  Sparkles,
  ArrowRight,
  Zap
} from 'lucide-react'
import Button from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-slate-950 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl pointer-events-none" />
      
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-semibold">WilliamSAGI</span>
            </div>
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                登入
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-16">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>AI 驅動的個人效率平台</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              WilliamSAGI
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              整合 AI 助理、自動化報告與工作流程管理，
              <br className="hidden md:block" />
              讓每一天都更高效、更智能
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link href="/login">
                <Button className="text-lg px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0">
                  開始使用
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/hub">
                <Button variant="outline" className="text-lg px-8 py-6 border-slate-700 hover:bg-slate-800">
                  瀏覽功能
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hub */}
            <Link href="/hub" className="group">
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-blue-500/50 transition-all hover:bg-slate-900/80">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  Hub
                </h3>
                <p className="text-slate-400 text-sm">
                  個人效率中心，整合所有工具與資訊
                </p>
              </div>
            </Link>

            {/* Daily */}
            <Link href="/daily" className="group">
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-purple-500/50 transition-all hover:bg-slate-900/80">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                  Daily
                </h3>
                <p className="text-slate-400 text-sm">
                  每日自動化報告，掌握重要資訊
                </p>
              </div>
            </Link>

            {/* Portal */}
            <Link href="/portal" className="group">
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-pink-500/50 transition-all hover:bg-slate-900/80">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-pink-400 transition-colors">
                  Portal
                </h3>
                <p className="text-slate-400 text-sm">
                  工作入口，快速存取常用工具
                </p>
              </div>
            </Link>

            {/* Dashboard */}
            <Link href="/dashboard" className="group">
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-cyan-500/50 transition-all hover:bg-slate-900/80">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                  Dashboard
                </h3>
                <p className="text-slate-400 text-sm">
                  數據儀表板，視覺化關鍵指標
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-slate-700/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-slate-400 text-sm mt-2">AI 助理服務</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  自動化
                </div>
                <div className="text-slate-400 text-sm mt-2">報告產出</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  即時
                </div>
                <div className="text-slate-400 text-sm mt-2">數據同步</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  多平台
                </div>
                <div className="text-slate-400 text-sm mt-2">裝置支援</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/50">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-slate-400">© 2026 WilliamSAGI</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span>Build with AI</span>
                <span>•</span>
                <span>Powered by Next.js</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
