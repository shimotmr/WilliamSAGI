'use client'

import { BarChart3, TrendingUp, ShoppingCart, Briefcase, History, ClipboardList, Wallet } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export default function TradeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/hub/trade',          label: '總覽', icon: <BarChart3 size={18} /> },
    { href: '/hub/trade/quotes',   label: '行情', icon: <TrendingUp size={18} /> },
    { href: '/hub/trade/order',    label: '下單', icon: <ShoppingCart size={18} /> },
    { href: '/hub/trade/positions',label: '持倉', icon: <Briefcase size={18} /> },
    { href: '/hub/trade/orders',   label: '委託', icon: <ClipboardList size={18} /> },
    { href: '/hub/trade/history',  label: '損益', icon: <History size={18} /> },
  ]

  const isActive = (href: string) => {
    if (href === '/hub/trade') return pathname === '/hub/trade'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex flex-col md:flex-row">

        {/* 桌面側邊欄 */}
        <aside className="hidden md:block w-56 lg:w-64 bg-slate-900/50 border-r border-slate-800 min-h-screen shrink-0">
          <div className="p-4 lg:p-6">
            <div className="mb-6">
              <h2 className="text-lg lg:text-xl font-bold text-slate-100 mb-1">永豐金交易</h2>
              <p className="text-xs text-slate-500">Shioaji API · 即時連線</p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  )}>
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* 主內容 */}
        <main className="flex-1 pb-20 md:pb-0">
          <div className="p-4 md:p-6">{children}</div>
        </main>

        {/* 手機底部導航 */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 safe-area-inset-bottom">
          <div className="flex justify-around items-center h-16 px-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg text-[10px] font-medium transition-colors min-w-[44px]',
                  isActive(item.href) ? 'text-blue-400' : 'text-slate-500 active:text-slate-300'
                )}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
