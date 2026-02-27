'use client'

import { BarChart3, TrendingUp, ShoppingCart, Briefcase, History } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ConnectionStatus } from '@/components/trading/ConnectionStatus'
import { cn } from '@/lib/utils'

/**
 * 交易頁面共用佈局
 * 包含側邊欄導航：總覽/報價/下單/持倉/記錄
 */
export default function TradeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // 導航項目配置
  const navItems = [
    {
      href: '/trade',
      label: '總覽',
      icon: <BarChart3 size={18} />,
      active: pathname === '/trade'
    },
    {
      href: '/trade/quotes',
      label: '報價',
      icon: <TrendingUp size={18} />,
      active: pathname === '/trade/quotes'
    },
    {
      href: '/trade/orders',
      label: '下單',
      icon: <ShoppingCart size={18} />,
      active: pathname === '/trade/orders'
    },
    {
      href: '/trade/positions',
      label: '持倉',
      icon: <Briefcase size={18} />,
      active: pathname === '/trade/positions'
    },
    {
      href: '/trade/history',
      label: '記錄',
      icon: <History size={18} />,
      active: pathname === '/trade/history'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex">
        
        {/* 側邊欄 */}
        <aside className="w-64 bg-slate-900/50 border-r border-slate-800 min-h-screen">
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-100 mb-2">交易系統</h2>
              <ConnectionStatus status="connected" lastUpdate={new Date()} />
            </div>

            {/* 導航選單 */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    item.active
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* 快速操作 */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                快速操作
              </h4>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg">
                  同步帳戶
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg">
                  匯出報表
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* 主內容區域 */}
        <main className="flex-1">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}