'use client'

import { Calendar, Filter, Download, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'

import { StockPrice } from '@/components/trading/StockPrice'

type TransactionType = 'buy' | 'sell' | 'dividend'

interface Transaction {
  id: string
  date: string
  time: string
  symbol: string
  name: string
  type: TransactionType
  quantity: number
  price: number
  amount: number
  fee: number
  tax: number
  netAmount: number
}

/**
 * 交易記錄頁面
 */
export default function HistoryPage() {
  const [dateFilter, setDateFilter] = useState('7d')
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')

  // Mock 交易記錄
  const transactions: Transaction[] = [
    {
      id: 'TXN001',
      date: '2024-02-17',
      time: '09:18:45',
      symbol: '2317',
      name: '鴻海',
      type: 'sell',
      quantity: 2000,
      price: 110.00,
      amount: 220000,
      fee: 110,
      tax: 660,
      netAmount: 219230
    },
    {
      id: 'TXN002', 
      date: '2024-02-16',
      time: '13:45:12',
      symbol: '2330',
      name: '台積電',
      type: 'buy',
      quantity: 1000,
      price: 595.00,
      amount: 595000,
      fee: 595,
      tax: 0,
      netAmount: -595595
    },
    {
      id: 'TXN003',
      date: '2024-02-16',
      time: '10:30:25',
      symbol: '2454',
      name: '聯發科',
      type: 'buy',
      quantity: 500,
      price: 1020.00,
      amount: 510000,
      fee: 510,
      tax: 0,
      netAmount: -510510
    },
    {
      id: 'TXN004',
      date: '2024-02-15',
      time: '14:25:18',
      symbol: '2412',
      name: '中華電',
      type: 'sell',
      quantity: 1000,
      price: 125.00,
      amount: 125000,
      fee: 125,
      tax: 375,
      netAmount: 124500
    },
    {
      id: 'TXN005',
      date: '2024-02-14',
      time: '11:15:33',
      symbol: '2330',
      name: '台積電',
      type: 'dividend',
      quantity: 2000,
      price: 2.75,
      amount: 5500,
      fee: 0,
      tax: 0,
      netAmount: 5500
    }
  ]

  const getTypeConfig = (type: TransactionType) => {
    switch (type) {
      case 'buy':
        return { text: '買進', color: 'bg-red-500/20 text-red-400' }
      case 'sell':
        return { text: '賣出', color: 'bg-green-500/20 text-green-400' }
      case 'dividend':
        return { text: '配息', color: 'bg-blue-500/20 text-blue-400' }
    }
  }

  const filteredTransactions = transactions.filter(txn => {
    if (typeFilter !== 'all' && txn.type !== typeFilter) return false
    
    const txnDate = new Date(txn.date)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24))
    
    switch (dateFilter) {
      case '1d': return daysDiff <= 1
      case '7d': return daysDiff <= 7
      case '30d': return daysDiff <= 30
      case '90d': return daysDiff <= 90
      default: return true
    }
  })

  const totalNetAmount = filteredTransactions.reduce((sum, txn) => sum + txn.netAmount, 0)

  return (
    <div className="space-y-6">
      {/* 頁面標題與操作 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">交易記錄</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-colors">
            <Download size={16} />
            匯出
          </button>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-900/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="text-slate-400" size={16} />
          <span className="text-sm text-slate-400">時間範圍：</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm"
          >
            <option value="1d">今日</option>
            <option value="7d">近7天</option>
            <option value="30d">近30天</option>
            <option value="90d">近90天</option>
            <option value="all">全部</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={16} />
          <span className="text-sm text-slate-400">交易類型：</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm"
          >
            <option value="all">全部</option>
            <option value="buy">買進</option>
            <option value="sell">賣出</option>
            <option value="dividend">配息</option>
          </select>
        </div>

        <div className="ml-auto">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">淨損益：</span>
            <StockPrice 
              price={Math.abs(totalNetAmount)}
              change={totalNetAmount}
              showChange={false}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* 交易記錄表格 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                  <div className="flex items-center gap-2">
                    日期/時間
                    <ArrowUpDown size={14} className="cursor-pointer hover:text-slate-300" />
                  </div>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">股票</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">類型</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">數量</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">成交價</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">成交金額</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">手續費</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">交易稅</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">淨額</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const typeConfig = getTypeConfig(transaction.type)
                
                return (
                  <tr key={transaction.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-slate-300">{transaction.date}</div>
                        <div className="font-mono text-slate-500 text-xs">{transaction.time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-100">{transaction.symbol}</div>
                        <div className="text-sm text-slate-400">{transaction.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig.color}`}>
                        {typeConfig.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-slate-300">
                        {transaction.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-slate-300">
                        {transaction.price.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-bold text-slate-100">
                        {transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-slate-400 text-sm">
                        {transaction.fee.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-slate-400 text-sm">
                        {transaction.tax.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <StockPrice 
                        price={Math.abs(transaction.netAmount)}
                        change={transaction.netAmount}
                        showChange={false}
                        size="sm"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 空狀態 */}
      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">找不到符合條件的交易記錄</p>
        </div>
      )}

      {/* 統計摘要 */}
      {filteredTransactions.length > 0 && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">共 {filteredTransactions.length} 筆交易</span>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">總手續費：</span>
                <span className="font-mono text-slate-300">
                  {filteredTransactions.reduce((sum, txn) => sum + txn.fee, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">總交易稅：</span>
                <span className="font-mono text-slate-300">
                  {filteredTransactions.reduce((sum, txn) => sum + txn.tax, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}