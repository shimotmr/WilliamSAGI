'use client'

import { Plus, Filter, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'

import { StockPrice } from '@/components/trading/StockPrice'

type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'partial'
type OrderType = 'buy' | 'sell'

interface Order {
  id: string
  symbol: string
  name: string
  type: OrderType
  status: OrderStatus
  quantity: number
  price: number
  filledQuantity: number
  orderTime: string
  updateTime?: string
}

/**
 * 下單管理頁面
 */
export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  // Mock 訂單資料
  const orders: Order[] = [
    {
      id: 'ORD001',
      symbol: '2330',
      name: '台積電',
      type: 'buy',
      status: 'pending',
      quantity: 1000,
      price: 595.00,
      filledQuantity: 0,
      orderTime: '09:15:32'
    },
    {
      id: 'ORD002',
      symbol: '2317',
      name: '鴻海',
      type: 'sell',
      status: 'filled',
      quantity: 2000,
      price: 110.00,
      filledQuantity: 2000,
      orderTime: '09:12:15',
      updateTime: '09:18:45'
    },
    {
      id: 'ORD003',
      symbol: '2454',
      name: '聯發科',
      type: 'buy',
      status: 'partial',
      quantity: 500,
      price: 1020.00,
      filledQuantity: 200,
      orderTime: '09:08:22',
      updateTime: '09:25:10'
    },
    {
      id: 'ORD004',
      symbol: '2412',
      name: '中華電',
      type: 'buy',
      status: 'cancelled',
      quantity: 1500,
      price: 122.00,
      filledQuantity: 0,
      orderTime: '09:05:18',
      updateTime: '09:20:33'
    }
  ]

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock size={16} />, text: '待成交', color: 'text-yellow-400' }
      case 'filled':
        return { icon: <CheckCircle size={16} />, text: '已成交', color: 'text-green-400' }
      case 'cancelled':
        return { icon: <XCircle size={16} />, text: '已取消', color: 'text-red-400' }
      case 'partial':
        return { icon: <Clock size={16} />, text: '部分成交', color: 'text-blue-400' }
      default:
        return { icon: <Clock size={16} />, text: '未知', color: 'text-slate-400' }
    }
  }

  const activeOrders = orders.filter(order => order.status === 'pending' || order.status === 'partial')
  const historyOrders = orders.filter(order => order.status === 'filled' || order.status === 'cancelled')

  return (
    <div className="space-y-6">
      {/* 頁面標題與操作 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">下單管理</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-colors">
            <Filter size={16} />
            篩選
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors">
            <Plus size={16} />
            新增委託
          </button>
        </div>
      </div>

      {/* 分頁標籤 */}
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'active'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          進行中 ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          歷史記錄 ({historyOrders.length})
        </button>
      </div>

      {/* 訂單表格 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">訂單編號</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">股票</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">買賣</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">委託價</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">數量</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">狀態</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">時間</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'active' ? activeOrders : historyOrders).map((order) => {
                const statusConfig = getStatusConfig(order.status)
                
                return (
                  <tr key={order.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-300">{order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-100">{order.symbol}</div>
                        <div className="text-sm text-slate-400">{order.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.type === 'buy' 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {order.type === 'buy' ? '買進' : '賣出'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <StockPrice 
                        price={order.price} 
                        showChange={false}
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm">
                        <span className="font-mono text-slate-300">{order.filledQuantity.toLocaleString()}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="font-mono text-slate-400">{order.quantity.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`flex items-center justify-center gap-2 ${statusConfig.color}`}>
                        {statusConfig.icon}
                        <span className="text-sm">{statusConfig.text}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm">
                        <div className="font-mono text-slate-300">{order.orderTime}</div>
                        {order.updateTime && (
                          <div className="font-mono text-slate-500 text-xs">{order.updateTime}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(order.status === 'pending' || order.status === 'partial') && (
                        <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors">
                          取消
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 空狀態 */}
      {(activeTab === 'active' ? activeOrders : historyOrders).length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {activeTab === 'active' ? '目前沒有進行中的委託' : '沒有歷史記錄'}
          </p>
        </div>
      )}
    </div>
  )
}