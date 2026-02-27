'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  symbol: string
  name: string
  price?: number
  change?: number
  changePercent?: number
}

interface QuoteSearchProps {
  onSearch: (query: string) => void
  onSelect: (symbol: string) => void
  searchResults?: SearchResult[]
  isLoading?: boolean
  placeholder?: string
  className?: string
}

/**
 * 股票搜尋組件，支援自動完成
 */
export function QuoteSearch({
  onSearch,
  onSelect,
  searchResults = [],
  isLoading = false,
  placeholder = '搜尋股票代號或名稱...',
  className
}: QuoteSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // 處理輸入變化
  const handleInputChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)
    onSearch(value)
    setIsOpen(value.length > 0)
  }

  // 清除搜尋
  const handleClear = () => {
    setQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
    onSearch('')
    inputRef.current?.focus()
  }

  // 選擇搜尋結果
  const handleSelect = (result: SearchResult) => {
    setQuery(`${result.symbol} ${result.name}`)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSelect(result.symbol)
    inputRef.current?.blur()
  }

  // 鍵盤導航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break

      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelect(searchResults[selectedIndex])
        }
        break

      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 滾動到選中項目
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex + 1] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedIndex])

  return (
    <div className={cn('relative w-full max-w-md', className)} ref={resultsRef}>
      {/* 搜尋輸入框 */}
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" 
          size={18} 
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-11 pr-10 py-3 bg-slate-800/50 border border-slate-700 rounded-lg',
            'text-slate-100 placeholder-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-all duration-200',
            isOpen && searchResults.length > 0 && 'rounded-b-none border-b-0'
          )}
        />
        
        {/* 清除按鈕 */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        )}

        {/* 載入指示器 */}
        {isLoading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 搜尋結果下拉選單 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-slate-800 border border-slate-700 border-t-0 rounded-b-lg shadow-xl max-h-60 overflow-y-auto">
          {/* 載入狀態 */}
          {isLoading && (
            <div className="px-4 py-3 text-center text-slate-400">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                搜尋中...
              </div>
            </div>
          )}

          {/* 無結果 */}
          {!isLoading && searchResults.length === 0 && query && (
            <div className="px-4 py-3 text-center text-slate-400">
              找不到相關股票
            </div>
          )}

          {/* 搜尋結果清單 */}
          {!isLoading && searchResults.map((result, index) => (
            <button
              key={result.symbol}
              onClick={() => handleSelect(result)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-b-0',
                selectedIndex === index && 'bg-slate-700/50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate-300 font-semibold">
                      {result.symbol}
                    </span>
                    <span className="text-xs text-slate-500">
                      {result.name}
                    </span>
                  </div>
                </div>

                {/* 價格資訊 (如果有的話) */}
                {result.price && (
                  <div className="flex items-center gap-2 ml-2">
                    <span className={cn(
                      'font-mono text-sm',
                      result.change && result.change > 0 
                        ? 'text-red-400' 
                        : result.change && result.change < 0 
                        ? 'text-green-400' 
                        : 'text-slate-400'
                    )}>
                      {result.price.toFixed(2)}
                    </span>
                    {result.changePercent && (
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        result.changePercent > 0 
                          ? 'bg-red-500/20 text-red-400' 
                          : result.changePercent < 0 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-slate-500/20 text-slate-400'
                      )}>
                        {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}

          {/* 快捷提示 */}
          {searchResults.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-700/50 text-xs text-slate-500">
              使用 ↑↓ 選擇，Enter 確認，Esc 取消
            </div>
          )}
        </div>
      )}
    </div>
  )
}