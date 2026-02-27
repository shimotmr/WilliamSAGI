'use client'

import { useState } from 'react'

import OrderForm from '@/components/trading/OrderForm'
import OrderHistory from '@/components/trading/OrderHistory'

export default function OrderPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleOrderSubmit = () => {
    // 下單成功後刷新委託記錄
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="px-4 py-6 sm:container sm:mx-auto">
        {/* 頁面標題 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-100">股票下單</h1>
          <p className="text-slate-400 mt-1">建立委託單並管理您的交易</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* 左側：下單表單 */}
          <div className="space-y-6">
            <OrderForm onOrderSubmit={handleOrderSubmit} />
          </div>

          {/* 右側：委託記錄 */}
          <div className="space-y-6">
            <OrderHistory key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  )
}