import Link from 'next/link'
import Button from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-2xl text-center space-y-8">
        {/* Logo */}
        <div className="text-6xl">🤖</div>
        
        {/* Title */}
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          WilliamSAGI
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-slate-300">
          AI 助理系統 · 個人效率平台
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold">儀表板</h3>
            <p className="text-sm text-slate-400">整合所有數據</p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold">每日報告</h3>
            <p className="text-sm text-slate-400">自動化產出</p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-semibold">協作中心</h3>
            <p className="text-sm text-slate-400">團隊同步</p>
          </div>
        </div>
        
        {/* CTA */}
        <div className="pt-8 space-y-4">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-6">
              登入系統
            </Button>
          </Link>
          <p className="text-sm text-slate-500">
            登入後使用完整功能
          </p>
        </div>
        
        {/* Footer */}
        <div className="pt-12 text-sm text-slate-600">
          © 2026 WilliamSAGI · Build with AI
        </div>
      </div>
    </div>
  )
}
