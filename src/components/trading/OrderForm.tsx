'use client'

import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'

import OrderConfirmDialog from './OrderConfirmDialog'

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

interface OrderFormProps {
  onOrderSubmit?: () => void
}

// Mock 股票資料
const mockStocks: Record<string, StockData> = {
  '2330': { symbol: '2330', name: '台積電', currentPrice: 985.00, change: 15.0, changePercent: 1.55, volume: 12345678 },
  '2317': { symbol: '2317', name: '鴻海', currentPrice: 178.50, change: -2.5, changePercent: -1.38, volume: 8765432 },
  '2454': { symbol: '2454', name: '聯發科', currentPrice: 1285.00, change: 25.0, changePercent: 1.98, volume: 3456789 },
  '2881': { symbol: '2881', name: '富邦金', currentPrice: 85.6, change: 1.2, changePercent: 1.42, volume: 5678901 },
  '2412': { symbol: '2412', name: '中華電', currentPrice: 132.00, change: 0.0, changePercent: 0.0, volume: 2345678 },
}

export default function OrderForm({ onOrderSubmit }: OrderFormProps) {
  const [orderData, setOrderData] = useState<OrderFormData>({
    symbol: '',
    stockName: '',
    action: 'buy',
    orderType: 'limit',
    shareType: 'lot',
    price: 0,
    quantity: 1
  })

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [currentStock, setCurrentStock] = useState<StockData | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // 搜尋股票建議
  const suggestions = Object.values(mockStocks).filter(stock =>
    stock.symbol.includes(searchInput) || stock.name.includes(searchInput)
  ).slice(0, 5)

  // 當股票代號改變時更新當前股票資料
  useEffect(() => {
    if (orderData.symbol && mockStocks[orderData.symbol]) {
      const stock = mockStocks[orderData.symbol]
      setCurrentStock(stock)
      
      // 自動設定限價單的價格為當前價格
      if (orderData.orderType === 'limit') {
        setOrderData(prev => ({ ...prev, price: stock.currentPrice }))
      }
    }
  }, [orderData.symbol, orderData.orderType])

  // 計算預估金額
  const calculateEstimate = () => {
    if (!currentStock || orderData.quantity <= 0) {
      return { amount: 0, commission: 0, tax: 0, total: 0 }
    }

    const price = orderData.orderType === 'market' ? currentStock.currentPrice : orderData.price
    const shares = orderData.shareType === 'lot' ? orderData.quantity * 1000 : orderData.quantity
    const amount = price * shares

    // 手續費計算（0.1425%，最低20元）
    const commission = Math.max(Math.round(amount * 0.001425), 20)
    
    // 證交稅（賣出時0.3%）
    const tax = orderData.action === 'sell' ? Math.round(amount * 0.003) : 0
    
    const total = orderData.action === 'buy' 
      ? amount + commission 
      : amount - commission - tax

    return { amount, commission, tax, total }
  }

  const estimate = calculateEstimate()

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // 股票代號驗證
    if (!orderData.symbol) {
      newErrors.symbol = '請選擇股票代號'
    }
    
    // 價格驗證（限價單）
    if (orderData.orderType === 'limit') {
      if (!orderData.price || orderData.price <= 0) {
        newErrors.price = '請輸入有效的價格'
      } else if (orderData.price < 0.01) {
        newErrors.price = '價格最低為 0.01 元'
      } else if (orderData.price > 10000) {
        newErrors.price = '價格最高為 10000 元'
      }
    }
    
    // 數量驗證
    if (!orderData.quantity || orderData.quantity <= 0) {
      newErrors.quantity = '請輸入有效的數量'
    } else {
      if (orderData.shareType === 'lot') {
        // 整股：1-999張
        if (orderData.quantity > 999) {
          newErrors.quantity = '單筆委託最多 999 張'
        }
        if (orderData.quantity < 1) {
          newErrors.quantity = '最少委託 1 張'
        }
      } else {
        // 零股：1-999股
        if (orderData.quantity > 999) {
          newErrors.quantity = '零股委託最多 999 股'
        }
        if (orderData.quantity < 1) {
          newErrors.quantity = '最少委託 1 股'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStockSelect = (stock: StockData) => {
    setOrderData(prev => ({
      ...prev,
      symbol: stock.symbol,
      stockName: stock.name,
      price: orderData.orderType === 'limit' ? stock.currentPrice : 0
    }))
    setSearchInput(`${stock.symbol} ${stock.name}`)
    setShowSuggestions(false)
    // Clear error when selecting stock
    setErrors(prev => ({ ...prev, symbol: '' }))
    setTouched(prev => ({ ...prev, symbol: true }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mark all fields as touched
    setTouched({ symbol: true, price: true, quantity: true })
    
    if (validateForm()) {
      setShowConfirm(true)
    }
  }

  // 處理輸入變更並清除對應的錯誤
  const handleInputChange = (field: string, value: number) => {
    setOrderData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleConfirmOrder = () => {
    // Mock API 呼叫
    console.log('下單成功:', orderData)
    
    setShowConfirm(false)
    
    // 重置表單
    setOrderData({
      symbol: '',
      stockName: '',
      action: 'buy',
      orderType: 'limit',
      shareType: 'lot',
      price: 0,
      quantity: 1
    })
    setSearchInput('')
    setCurrentStock(null)
    
    onOrderSubmit?.()
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-slate-100 mb-6">建立委託單</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 股票搜尋 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">股票代號</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setShowSuggestions(e.target.value.length > 0)
                // Clear error when typing
                if (errors.symbol) {
                  setErrors(prev => ({ ...prev, symbol: '' }))
                }
              }}
              onBlur={() => setTouched(prev => ({ ...prev, symbol: true }))}
              placeholder="輸入股票代號或名稱"
              className={`block w-full pl-10 pr-3 py-2 border rounded-lg 
                         bg-slate-800 text-slate-100 placeholder-slate-500
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                           touched.symbol && errors.symbol ? 'border-red-500' : 'border-slate-700'
                         }`}
            />
            
            {/* 搜尋建議 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                {suggestions.map(stock => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => handleStockSelect(stock)}
                    className="w-full px-4 py-2 text-left hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg
                               flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-slate-100">{stock.symbol}</span>
                      <span className="ml-2 text-slate-400">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-slate-100 font-variant-numeric: tabular-nums">{stock.currentPrice.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className={`text-xs ${stock.change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {touched.symbol && errors.symbol && (
              <p className="text-red-400 text-xs mt-1">{errors.symbol}</p>
            )}
          </div>
        </div>

        {/* 即時報價顯示 */}
        {currentStock && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-100">{currentStock.symbol} {currentStock.name}</h3>
                <div className="text-sm text-slate-400">成交量: {currentStock.volume.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-100 font-mono font-variant-numeric: tabular-nums">
                  {currentStock.currentPrice.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-sm font-medium ${
                  currentStock.change > 0 ? 'text-red-400' : 
                  currentStock.change < 0 ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {currentStock.change >= 0 ? '+' : ''}{currentStock.change.toFixed(2)} ({currentStock.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 買賣方向 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">交易方向</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderData(prev => ({ ...prev, action: 'buy' }))}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                orderData.action === 'buy'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
              }`}
            >
              買進
            </button>
            <button
              type="button"
              onClick={() => setOrderData(prev => ({ ...prev, action: 'sell' }))}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                orderData.action === 'sell'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
              }`}
            >
              賣出
            </button>
          </div>
        </div>

        {/* 委託類型 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">委託類型</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderData(prev => ({ ...prev, orderType: 'limit' }))}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                orderData.orderType === 'limit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              限價
            </button>
            <button
              type="button"
              onClick={() => setOrderData(prev => ({ ...prev, orderType: 'market' }))}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                orderData.orderType === 'market'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              市價
            </button>
          </div>
        </div>

        {/* 股數類型 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">股數類型</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderData(prev => ({ ...prev, shareType: 'lot' }))}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                orderData.shareType === 'lot'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              整股
            </button>
            <button
              type="button"
              onClick={() => setOrderData(prev => ({ ...prev, shareType: 'odd' }))}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                orderData.shareType === 'odd'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              零股
            </button>
          </div>
        </div>

        {/* 委託價格 */}
        {orderData.orderType === 'limit' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">委託價格</label>
            <input
              type="number"
              step="0.01"
              value={orderData.price || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              onBlur={() => setTouched(prev => ({ ...prev, price: true }))}
              className={`block w-full px-3 py-2 border rounded-lg 
                         bg-slate-800 text-slate-100 font-mono font-variant-numeric: tabular-nums
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                           touched.price && errors.price ? 'border-red-500' : 'border-slate-700'
                         }`}
              placeholder="0.00"
            />
            {touched.price && errors.price && (
              <p className="text-red-400 text-xs mt-1">{errors.price}</p>
            )}
          </div>
        )}

        {/* 委託數量 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            委託數量 ({orderData.shareType === 'lot' ? '張' : '股'})
          </label>
          <input
            type="number"
            min="1"
            value={orderData.quantity || ''}
            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
            onBlur={() => setTouched(prev => ({ ...prev, quantity: true }))}
            className={`block w-full px-3 py-2 border rounded-lg 
                       bg-slate-800 text-slate-100 font-mono font-variant-numeric: tabular-nums
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                         touched.quantity && errors.quantity ? 'border-red-500' : 'border-slate-700'
                       }`}
            placeholder="1"
          />
          {touched.quantity && errors.quantity && (
            <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>
          )}
          {orderData.shareType === 'lot' && (
            <p className="text-xs text-slate-500">1張 = 1,000股</p>
          )}
        </div>

        {/* 預估金額 */}
        {currentStock && orderData.quantity > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h4 className="font-medium text-slate-300 mb-3">預估金額</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">股數:</span>
                <span className="text-slate-300 font-mono font-variant-numeric: tabular-nums">
                  {(orderData.shareType === 'lot' ? orderData.quantity * 1000 : orderData.quantity).toLocaleString()} 股
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">單價:</span>
                <span className="text-slate-300 font-mono font-variant-numeric: tabular-nums">
                  {(orderData.orderType === 'market' ? currentStock.currentPrice : orderData.price).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">市值:</span>
                <span className="text-slate-300 font-mono font-variant-numeric: tabular-nums">{estimate.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">手續費:</span>
                <span className="text-slate-300 font-mono font-variant-numeric: tabular-nums">{estimate.commission.toLocaleString()}</span>
              </div>
              {estimate.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">證交稅:</span>
                  <span className="text-slate-300 font-mono font-variant-numeric: tabular-nums">{estimate.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-slate-600 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">
                    {orderData.action === 'buy' ? '實付金額:' : '實收金額:'}
                  </span>
                  <span className="text-slate-100 font-bold font-mono font-variant-numeric: tabular-nums text-lg">
                    {estimate.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 送出按鈕 */}
        <button
          type="submit"
          disabled={!currentStock || orderData.quantity <= 0 || (orderData.orderType === 'limit' && orderData.price <= 0)}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            orderData.action === 'buy'
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
          }`}
        >
          {orderData.action === 'buy' ? '買進下單' : '賣出下單'}
        </button>
      </form>

      {/* 確認對話框 */}
      {showConfirm && currentStock && (
        <OrderConfirmDialog
          orderData={orderData}
          currentStock={currentStock}
          estimate={estimate}
          onConfirm={handleConfirmOrder}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}