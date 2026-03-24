'use client'

import { ExternalLink, TrendingUp, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TRADE_URL = 'https://shioaji.williamhsiao.tw'

export default function TradePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <TrendingUp size={28} className="text-blue-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-100">交易中心已遷移</h1>
          <p className="text-sm text-slate-400">
            交易中心已遷移至獨立平台，提供更完整的即時持倉、委託記錄與下單功能。
          </p>
        </div>
        <a
          href={TRADE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          前往 shioaji.williamhsiao.tw
          <ExternalLink size={14} />
        </a>
        <p className="text-xs text-slate-600">
          此頁面將在未來版本移除
        </p>
      </div>
    </div>
  )
}
