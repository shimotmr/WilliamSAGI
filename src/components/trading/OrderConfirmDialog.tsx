'use client'

import { AlertTriangle, X } from 'lucide-react'

interface OrderFormData {
  symbol: string
  stockName: string
  action: 'buy' | 'sell'
  orderType: 'limit' | 'market'
  shareType: 'lot' | 'odd'
  price: number
  quantity: number
}

interface StockData {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  volume: number
}

interface EstimateData {
  amount: number
  commission: number
  tax: number
  total: number
}

interface OrderConfirmDialogProps {
  orderData: OrderFormData
  currentStock: StockData
  estimate: EstimateData
  onConfirm: () => void
  onCancel: () => void
}

export default function OrderConfirmDialog({
  orderData,
  currentStock,
  estimate,
  onConfirm,
  onCancel
}: OrderConfirmDialogProps) {
  const isLargeAmount = estimate.total > 500000 // 大於50萬的交易
  const actualPrice = orderData.orderType === 'market' ? currentStock.currentPrice : orderData.price
  const totalShares = orderData.shareType === 'lot' ? orderData.quantity * 1000 : orderData.quantity

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full shadow-xl">
        {/* 標題 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-100">確認下單</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容 */}
        <div className="p-6 space-y-6">
          {/* 大額交易警告 */}
          {isLargeAmount && (
            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-yellow-400 font-medium">大額交易提醒</p>
                <p className="text-yellow-300 mt-1">
                  此筆交易金額超過50萬元，請仔細確認交易內容
                </p>
              </div>
            </div>
          )}

          {/* 交易詳情 */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h4 className="font-medium text-slate-300 mb-3">交易詳情</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">股票:</span>
                  <span className="text-slate-100 font-medium">
                    {orderData.symbol} {orderData.stockName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">方向:</span>
                  <span className={`font-medium ${
                    orderData.action === 'buy' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {orderData.action === 'buy' ? '買進' : '賣出'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">類型:</span>
                  <span className="text-slate-100">
                    {orderData.orderType === 'limit' ? '限價' : '市價'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">數量:</span>
                  <span className="text-slate-100 font-mono">
                    {orderData.quantity} {orderData.shareType === 'lot' ? '張' : '股'}
                    {orderData.shareType === 'lot' && (
                      <span className="text-slate-400 ml-1">({totalShares.toLocaleString()}股)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">價格:</span>
                  <div className="text-right">
                    <span className="text-slate-100 font-mono">
                      {actualPrice.toFixed(2)}
                    </span>
                    {orderData.orderType === 'market' && (
                      <div className="text-xs text-slate-400">市價 (參考)</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 金額試算 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h4 className="font-medium text-slate-300 mb-3">費用試算</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">市值:</span>
                  <span className="text-slate-100 font-mono">
                    {estimate.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">手續費:</span>
                  <span className="text-slate-100 font-mono">
                    {estimate.commission.toLocaleString()}
                  </span>
                </div>
                {estimate.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">證交稅:</span>
                    <span className="text-slate-100 font-mono">
                      {estimate.tax.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-600 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">
                      {orderData.action === 'buy' ? '實付金額:' : '實收金額:'}
                    </span>
                    <span className={`font-bold font-mono text-lg ${
                      isLargeAmount ? 'text-yellow-400' : 'text-slate-100'
                    }`}>
                      {estimate.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 風險提醒 */}
            <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-orange-400 font-medium mb-1">風險提醒</p>
                  <ul className="text-slate-300 space-y-1 text-xs">
                    <li>• 股票投資有風險，請謹慎評估自身風險承受能力</li>
                    <li>• 委託送出後將無法取消，請確認交易內容無誤</li>
                    {orderData.orderType === 'market' && (
                      <li>• 市價單可能以非預期價格成交，請特別注意</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 font-medium rounded-lg 
                       hover:bg-slate-800 hover:border-slate-500 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-colors ${
              orderData.action === 'buy'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } ${isLargeAmount ? 'animate-pulse' : ''}`}
          >
            確認{orderData.action === 'buy' ? '買進' : '賣出'}
          </button>
        </div>
      </div>
    </div>
  )
}