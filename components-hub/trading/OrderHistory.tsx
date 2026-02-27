'use client'

import { Clock, CheckCircle, XCircle, MoreVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'

type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'partial'
type OrderAction = 'buy' | 'sell'

interface Order {
  id: string
  symbol: string
  name: string
  action: OrderAction
  status: OrderStatus
  orderType: 'limit' | 'market'
  quantity: number
  price: number
  filledQuantity: number
  filledPrice?: number
  orderTime: string
  updateTime?: string
  totalAmount: number
}

// Mock 委託記錄資料
const mockOrders: Order[] = [
  {
    id: 'ORD20260217001',
    symbol: '2330',
    name: '台積電',
    action: 'buy',
    status: 'pending',
    orderType: 'limit',
    quantity: 1000,
    price: 985.00,
    filledQuantity: 0,
    orderTime: '2026-02-17 09:15:32',
    totalAmount: 986395
  },
  {
    id: 'ORD20260217002',
    symbol: '2454',
    name: '聯發科',
    action: 'sell',
    status: 'filled',
    orderType: 'limit',
    quantity: 2000,
    price: 1285.00,
    filledQuantity: 2000,
    filledPrice: 1287.00,
    orderTime: '2026-02-17 09:08:15',
    updateTime: '2026-02-17 09:12:34',
    totalAmount: 2571218
  },
  {
    id: 'ORD20260217003',
    symbol: '2881',
    name: '富邦金',
    action: 'buy',
    status: 'partial',
    orderType: 'limit',
    quantity: 5000,
    price: 85.6,
    filledQuantity: 2000,
    filledPrice: 85.6,
    orderTime: '2026-02-17 08:45:22',
    updateTime: '2026-02-17 09:05:18',
    totalAmount: 428850
  },
  {
    id: 'ORD20260217004',
    symbol: '2317',
    name: '鴻海',
    action: 'buy',
    status: 'cancelled',
    orderType: 'market',
    quantity: 3000,
    price: 178.50,
    filledQuantity: 0,
    orderTime: '2026-02-17 08:30:15',
    updateTime: '2026-02-17 08:35:45',
    totalAmount: 535950
  },
  {
    id: 'ORD20260216005',
    symbol: '2412',
    name: '中華電',
    action: 'sell',
    status: 'filled',
    orderType: 'limit',
    quantity: 1000,
    price: 132.00,
    filledQuantity: 1000,
    filledPrice: 132.50,
    orderTime: '2026-02-16 14:25:18',
    updateTime: '2026-02-16 14:28:42',
    totalAmount: 131904
  }
]

export default function OrderHistory() {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today')
  const [showActions, setShowActions] = useState<string | null>(null)

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock size={14} />, text: '待成交', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' }
      case 'filled':
        return { icon: <CheckCircle size={14} />, text: '已成交', color: 'text-green-400', bgColor: 'bg-green-400/10' }
      case 'cancelled':
        return { icon: <XCircle size={14} />, text: '已取消', color: 'text-red-400', bgColor: 'bg-red-400/10' }
      case 'partial':
        return { icon: <Clock size={14} />, text: '部分成交', color: 'text-blue-400', bgColor: 'bg-blue-400/10' }
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const handleCancelOrder = (orderId: string) => {
    // Mock API 取消委託
    // TODO: 實現真實的取消委託API調用
    setShowActions(null)
  }

  // 根據分頁篩選訂單
  const filteredOrders = mockOrders.filter(order => {
    const orderDate = new Date(order.orderTime)
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    switch (activeTab) {
      case 'today':
        return orderDate.toDateString() === today.toDateString()
      case 'week':
        return orderDate >= weekAgo
      case 'month':
        return orderDate >= monthAgo
      default:
        return true
    }
  })

  const pendingOrders = filteredOrders.filter(order => order.status === 'pending' || order.status === 'partial')

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {/* 標題與分頁 */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-100">委託記錄</h2>
          <div className="text-sm text-slate-400">
            {filteredOrders.length} 筆委託
          </div>
        </div>

        <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'today'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            今日
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            本週
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            本月
          </button>
        </div>
      </div>

      {/* 委託列表 */}
      <div className="divide-y divide-slate-800">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-400">暫無委託記錄</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status)
            
            return (
              <div key={order.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between">
                  {/* 左側資訊 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-100">{order.symbol}</span>
                        <span className="text-slate-400 text-sm">{order.name}</span>
                      </div>
                      
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusConfig.bgColor}`}>
                        {statusConfig.icon}
                        <span className={`text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.text}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 block">方向</span>
                        <span className={`font-medium ${
                          order.action === 'buy' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {order.action === 'buy' ? '買進' : '賣出'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-slate-500 block">數量</span>
                        <span className="text-slate-300 font-mono">
                          {order.filledQuantity > 0 ? (
                            <>
                              <span className="text-blue-400">{order.filledQuantity.toLocaleString()}</span>
                              <span className="text-slate-500"> / </span>
                              <span>{order.quantity.toLocaleString()}</span>
                            </>
                          ) : (
                            order.quantity.toLocaleString()
                          )}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-slate-500 block">價格</span>
                        <div className="font-mono">
                          {order.status === 'filled' && order.filledPrice ? (
                            <span className="text-slate-300">{order.filledPrice.toFixed(2)}</span>
                          ) : order.orderType === 'market' ? (
                            <span className="text-slate-400">市價</span>
                          ) : (
                            <span className="text-slate-300">{order.price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-slate-500 block">金額</span>
                        <span className="text-slate-300 font-mono">
                          {order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-slate-500">
                        <span>委託: {formatTime(order.orderTime)}</span>
                        {order.updateTime && (
                          <span className="ml-3">更新: {formatTime(order.updateTime)}</span>
                        )}
                      </div>
                      
                      <div className="text-xs font-mono text-slate-500">
                        {order.id}
                      </div>
                    </div>
                  </div>

                  {/* 右側操作 */}
                  {(order.status === 'pending' || order.status === 'partial') && (
                    <div className="relative ml-4">
                      <button
                        onClick={() => setShowActions(showActions === order.id ? null : order.id)}
                        className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {showActions === order.id && (
                        <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 min-w-[120px]">
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                          >
                            <Trash2 size={14} />
                            取消委託
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 底部統計 */}
      {pendingOrders.length > 0 && (
        <div className="bg-slate-800/30 border-t border-slate-700 px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              進行中的委託: {pendingOrders.length} 筆
            </span>
            <span className="text-slate-400">
              總委託金額: {pendingOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}