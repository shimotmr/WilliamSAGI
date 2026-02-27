'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

import { AccountOverviewWithAPI } from '@/components/trading/AccountOverviewWithAPI'
import { PercentageBadge } from '@/components/trading/PercentageBadge'
import { StockPrice } from '@/components/trading/StockPrice'

/**
 * 交易主頁 - 帳戶總覽
 */
export default function TradePage() {
  const [queryClient] = useState(() => new QueryClient())

  // Mock 市場指數資料
  const marketIndices = [
    { name: '加權指數', value: 23845.67, change: 156.32, pct: 0.66 },
    { name: '櫃買指數', value: 268.54, change: -2.18, pct: -0.81 },
    { name: '道瓊', value: 44127.80, change: 312.45, pct: 0.71 },
    { name: '那斯達克', value: 19856.23, change: -45.67, pct: -0.23 },
  ]

  // Mock 熱門股票
  const hotStocks = [
    { symbol: '2330', name: '台積電', price: 598.00, change: 12.00, changePercent: 2.04, volume: 45230000 },
    { symbol: '2317', name: '鴻海', price: 108.50, change: -1.50, changePercent: -1.36, volume: 23450000 },
    { symbol: '2454', name: '聯發科', price: 1025.00, change: 25.00, changePercent: 2.50, volume: 8900000 },
    { symbol: '2412', name: '中華電', price: 123.50, change: 0.50, changePercent: 0.41, volume: 5600000 },
  ]

  // Mock 最近訂單
  const recentOrders = [
    { symbol: '2330', name: '台積電', type: 'buy', status: '已成交', time: '09:15:32' },
    { symbol: '2317', name: '鴻海', type: 'sell', status: '已成交', time: '09:12:15' },
    { symbol: '2454', name: '聯發科', type: 'buy', status: '部分成交', time: '09:08:22' },
  ]

  return (
    <QueryClientProvider client={queryClient}>
    <div className="space-y-8">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">交易總覽</h1>
        <p className="text-slate-400">即時帳戶狀況與市場動態</p>
      </div>

      {/* 帳戶總覽 */}
      <AccountOverviewWithAPI />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* 市場指數 */}
        <div className="xl:col-span-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-green-400" size={20} />
              <h3 className="text-lg font-semibold text-slate-200">市場指數</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {marketIndices.map((index, i) => (
                <div key={i} className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="text-sm text-slate-400 mb-2">{index.name}</div>
                  <div className="space-y-1">
                    <StockPrice 
                      price={index.value} 
                      change={index.change}
                      showChange={false}
                      size="md"
                    />
                    <PercentageBadge value={index.pct} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 最近訂單 */}
        <div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-fit">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="text-blue-400" size={20} />
              <h3 className="text-lg font-semibold text-slate-200">最近訂單</h3>
            </div>
            
            <div className="space-y-4">
              {recentOrders.map((order, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <div className="font-bold text-slate-100 text-sm">{order.symbol}</div>
                    <div className="text-xs text-slate-400">{order.name}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded ${
                      order.type === 'buy' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {order.type === 'buy' ? '買進' : '賣出'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{order.time}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-slate-300 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors">
              查看全部訂單
            </button>
          </div>
        </div>
      </div>

      {/* 熱門股票與快速操作 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* 熱門股票 */}
        <div className="xl:col-span-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="text-orange-400" size={20} />
              <h3 className="text-lg font-semibold text-slate-200">熱門股票</h3>
            </div>
            
            <div className="space-y-3">
              {hotStocks.map((stock, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-bold text-slate-100">{stock.symbol}</div>
                      <div className="text-sm text-slate-400">{stock.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <StockPrice 
                        price={stock.price}
                        change={stock.change}
                        showChange={false}
                        size="sm"
                      />
                    </div>
                    <div>
                      <PercentageBadge value={stock.changePercent} size="sm" />
                    </div>
                    <div className="text-right min-w-[60px]">
                      <div className="text-xs text-slate-400">成交量</div>
                      <div className="font-mono text-slate-300 text-sm">
                        {(stock.volume / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 系統提醒 */}
        <div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-fit">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="text-yellow-400" size={20} />
              <h3 className="text-lg font-semibold text-slate-200">系統提醒</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-blue-400 font-medium">市場開盤</div>
                <div className="text-slate-300 mt-1">台股已於 09:00 正常開盤</div>
              </div>
              
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-green-400 font-medium">連線狀態</div>
                <div className="text-slate-300 mt-1">Shioaji API 連線正常</div>
              </div>
              
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="text-yellow-400 font-medium">待處理</div>
                <div className="text-slate-300 mt-1">1 筆部分成交訂單待處理</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </QueryClientProvider>
  )
}