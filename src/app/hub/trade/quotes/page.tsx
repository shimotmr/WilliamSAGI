'use client'

import { useQuery } from '@tanstack/react-query'
import { Search, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useState, useRef, useMemo } from 'react'

import { ConnectionStatus } from '@/components/trading/ConnectionStatus'
import { QuoteCard } from '@/components/trading/QuoteCard'
import { QuoteSearch } from '@/components/trading/QuoteSearch'
import { WatchList } from '@/components/trading/WatchList'

interface QuoteData {
  symbol: string
  symbol_name: string
  last_price: number
  change: number
  change_percent: number
  volume: number
  bid_price?: number
  ask_price?: number
  updated_at: string
}

interface SearchResult {
  symbol: string
  name: string
  price?: number
  change?: number
  changePercent?: number
}

// 股票名稱映射（用於搜尋）
const STOCK_NAMES: Record<string, string> = {
  '2330': '台積電',
  '2317': '鴻海',
  '2454': '聯發科',
  '2881': '富邦金',
  '2412': '中華電',
  '2303': '聯電',
  '2002': '中鋼',
  '6505': '台塑化',
  '2886': '兆豐金',
  '2603': '長榮',
  '2609': '陽明',
  '2882': '國泰金',
  '2891': '中信金',
  '2357': '華碩',
  '3034': '聯詠',
  '2308': '台達電',
  '2382': '廣達',
  '2395': '研華',
  '3008': '大立光',
  '2327': '國巨'
}

// 預設監視清單股票
const DEFAULT_SYMBOLS = ['2330', '2317', '2454', '2881', '2412', '2303']

/**
 * 即時報價面板頁面
 */
export default function QuotesPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('2330')
  const [activeWatchListId, setActiveWatchListId] = useState<string>('favorites')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [refreshInterval, setRefreshInterval] = useState<number>(10000) // 10秒
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true)
  const [watchListSymbols, setWatchListSymbols] = useState<string[]>(DEFAULT_SYMBOLS)
  
  // 搜尋結果
  const searchResults: SearchResult[] = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    const results: SearchResult[] = []
    
    Object.entries(STOCK_NAMES).forEach(([symbol, name]) => {
      if (symbol.includes(query) || name.toLowerCase().includes(query)) {
        results.push({
          symbol,
          name
        })
      }
    })
    
    return results.slice(0, 8) // 限制顯示 8 個結果
  }, [searchQuery])

  // Mock data for fallback when API fails
  const getMockQuotes = (symbols: string[]): QuoteData[] => {
    const mockData: Record<string, { name: string; price: number; change: number; changePercent: number; volume: number }> = {
      '2330': { name: '台積電', price: 985.00, change: 15.0, changePercent: 1.55, volume: 12345678 },
      '2317': { name: '鴻海', price: 178.50, change: -2.5, changePercent: -1.38, volume: 8765432 },
      '2454': { name: '聯發科', price: 1285.00, change: 25.0, changePercent: 1.98, volume: 3456789 },
      '2881': { name: '富邦金', price: 85.6, change: 1.2, changePercent: 1.42, volume: 5678901 },
      '2412': { name: '中華電', price: 132.00, change: 0.0, changePercent: 0.0, volume: 2345678 },
      '2303': { name: '聯電', price: 52.3, change: 0.8, changePercent: 1.55, volume: 12345678 },
    }
    
    return symbols.map(symbol => ({
      symbol,
      symbol_name: mockData[symbol]?.name || `${symbol}`,
      last_price: mockData[symbol]?.price || 100,
      change: mockData[symbol]?.change || 0,
      change_percent: mockData[symbol]?.changePercent || 0,
      volume: mockData[symbol]?.volume || 1000000,
      updated_at: new Date().toISOString()
    }))
  }

  // 獲取多股票報價
  const {
    data: quotesData,
    isLoading: quotesLoading,
    error: quotesError,
    refetch: refetchQuotes
  } = useQuery<{ quotes: QuoteData[] }>({
    queryKey: ['quotes', watchListSymbols],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/trade/quotes?symbols=${watchListSymbols.join(',')}`)
        if (!response.ok) {
          throw new Error('Failed to fetch quotes')
        }
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch quotes')
        }
        return result.data
      } catch (error) {
        console.warn('Failed to fetch quotes from API, using mock data:', error)
        // Return mock data on error
        return { quotes: getMockQuotes(watchListSymbols) }
      }
    },
    enabled: watchListSymbols.length > 0,
    refetchInterval: isAutoRefresh ? refreshInterval : false,
    staleTime: 5000 // 5秒內認為數據是新鮮的
  })

  // 獲取選中股票的詳細報價
  const {
    data: selectedQuoteData,
    refetch: refetchSelectedQuote
  } = useQuery<QuoteData>({
    queryKey: ['quote', selectedSymbol],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/trade/quote?symbol=${selectedSymbol}`)
        if (!response.ok) {
          throw new Error('Failed to fetch quote')
        }
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch quote')
        }
        return result.data.quote
      } catch (error) {
        console.warn('Failed to fetch quote from API, using mock data:', error)
        // Return mock data on error
        const mockQuotes = getMockQuotes([selectedSymbol])
        return mockQuotes[0]
      }
    },
    enabled: !!selectedSymbol,
    refetchInterval: isAutoRefresh ? refreshInterval : false,
    staleTime: 5000
  })

  // 處理監視清單變更
  const handleWatchListChange = (watchListId: string) => {
    setActiveWatchListId(watchListId)
    // 這裡可以根據不同的監視清單加載不同的股票清單
    if (watchListId === 'popular') {
      setWatchListSymbols(['2330', '2317', '2454', '2881'])
    } else {
      setWatchListSymbols(DEFAULT_SYMBOLS)
    }
  }

  // 處理股票選擇
  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol)
  }

  // 處理搜尋
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // 處理添加到監視清單
  const handleAddToWatchList = (symbol: string) => {
    if (!watchListSymbols.includes(symbol)) {
      setWatchListSymbols(prev => [...prev, symbol])
    }
    setSelectedSymbol(symbol)
    setSearchQuery('')
  }

  // 手動重新整理
  const handleManualRefresh = () => {
    refetchQuotes()
    if (selectedSymbol) {
      refetchSelectedQuote()
    }
  }

  // 切換自動重新整理
  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh)
  }

  // 調整重新整理間隔
  const handleIntervalChange = (interval: number) => {
    setRefreshInterval(interval)
  }

  const quotes = quotesData?.quotes || []
  const selectedQuote = selectedQuoteData || quotes.find(q => q.symbol === selectedSymbol)

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex h-screen">
        {/* 左側面板 - 搜尋和監視清單 */}
        <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/30">
          {/* 標頭區域 */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-slate-100">即時報價</h1>
              <div className="flex items-center gap-2">
                <ConnectionStatus />
                <button
                  onClick={handleManualRefresh}
                  disabled={quotesLoading}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={quotesLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={toggleAutoRefresh}
                  className={`p-2 rounded-lg transition-colors ${
                    isAutoRefresh 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isAutoRefresh ? <Wifi size={16} /> : <WifiOff size={16} />}
                </button>
              </div>
            </div>

            {/* 搜尋區域 */}
            <QuoteSearch
              onSearch={handleSearch}
              onSelect={handleAddToWatchList}
              searchResults={searchResults}
              isLoading={false}
              placeholder="搜尋股票代號或名稱..."
            />
          </div>

          {/* 監視清單 */}
          <div className="p-4 border-b border-slate-800">
            <WatchList
              onWatchListChange={handleWatchListChange}
              onSymbolSelect={handleSymbolSelect}
              selectedWatchListId={activeWatchListId}
            />
          </div>

          {/* 股票清單 */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {quotesLoading && quotes.length === 0 && (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-slate-800/30 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {quotesError && (
                <div className="text-center py-8">
                  <p className="text-red-400 mb-2">載入報價失敗</p>
                  <button
                    onClick={handleManualRefresh}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
                  >
                    重新載入
                  </button>
                </div>
              )}

              {quotes.map((quote) => (
                <QuoteCard
                  key={quote.symbol}
                  quote={{
                    symbol: quote.symbol,
                    name: quote.symbol_name,
                    price: quote.last_price,
                    change: quote.change,
                    changePercent: quote.change_percent,
                    volume: quote.volume,
                    updatedAt: quote.updated_at
                  }}
                  isSelected={selectedSymbol === quote.symbol}
                  onSelect={handleSymbolSelect}
                  onToggleWatchlist={(_symbol) => {
                    // TODO: 實現監視清單切換邏輯
                  }}
                  isInWatchlist={watchListSymbols.includes(quote.symbol)}
                  showAnimation={true}
                />
              ))}

              {quotes.length === 0 && !quotesLoading && (
                <div className="text-center py-8 text-slate-400">
                  <p>無股票資料</p>
                  <p className="text-xs mt-1">請使用搜尋功能添加股票</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右側面板 - 選中股票詳細資訊 */}
        <div className="flex-1 bg-slate-950/50">
          {selectedQuote ? (
            <div className="h-full overflow-y-auto">
              {/* 股票標頭 */}
              <div className="sticky top-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-slate-100">
                        {selectedQuote.symbol}
                      </h2>
                      <span className="text-lg text-slate-400">
                        {selectedQuote.symbol_name || STOCK_NAMES[selectedQuote.symbol]}
                      </span>
                    </div>
                    <div className="flex items-end gap-4">
                      <span className={`text-3xl font-bold font-mono font-variant-numeric: tabular-nums ${
                        selectedQuote.change > 0 
                          ? 'text-red-400' 
                          : selectedQuote.change < 0 
                          ? 'text-green-400' 
                          : 'text-slate-400'
                      }`}>
                        {selectedQuote.last_price.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-mono font-variant-numeric: tabular-nums ${
                          selectedQuote.change > 0 
                            ? 'text-red-400' 
                            : selectedQuote.change < 0 
                            ? 'text-green-400' 
                            : 'text-slate-400'
                        }`}>
                          {selectedQuote.change >= 0 ? '+' : ''}{selectedQuote.change.toFixed(2)}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded font-medium ${
                          selectedQuote.change_percent > 0 
                            ? 'bg-red-500/20 text-red-400' 
                            : selectedQuote.change_percent < 0 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {selectedQuote.change_percent >= 0 ? '+' : ''}{selectedQuote.change_percent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 快速操作按鈕 */}
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                      買進
                    </button>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                      賣出
                    </button>
                  </div>
                </div>
              </div>

              {/* 詳細資訊 */}
              <div className="p-6 space-y-6">
                {/* 基本資訊卡片 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">成交量</h3>
                    <p className="text-lg font-mono font-variant-numeric: tabular-nums text-slate-100">
                      {selectedQuote.volume.toLocaleString()} 股
                    </p>
                  </div>
                  {selectedQuote.bid_price && selectedQuote.ask_price && (
                    <>
                      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">委買價</h3>
                        <p className="text-lg font-mono font-variant-numeric: tabular-nums text-green-400">
                          {selectedQuote.bid_price.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">委賣價</h3>
                        <p className="text-lg font-mono font-variant-numeric: tabular-nums text-red-400">
                          {selectedQuote.ask_price.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">更新時間</h3>
                    <p className="text-lg font-mono text-slate-100">
                      {new Date(selectedQuote.updated_at).toLocaleTimeString('zh-TW')}
                    </p>
                  </div>
                </div>

                {/* 佔位符區域 - 未來可添加圖表、五檔等 */}
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-400 mb-2">更多功能開發中</p>
                  <p className="text-sm text-slate-500">
                    五檔報價、技術圖表、歷史資料等功能將陸續上線
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Search size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 mb-2">請選擇股票</p>
                <p className="text-sm text-slate-500">從左側清單中選擇股票查看詳細報價</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 設定面板 (隱藏) */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>重新整理間隔:</span>
            <select 
              value={refreshInterval} 
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
            >
              <option value={5000}>5秒</option>
              <option value={10000}>10秒</option>
              <option value={30000}>30秒</option>
              <option value={60000}>1分鐘</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}