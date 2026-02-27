'use client'

import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, Edit2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WatchListItem {
  symbol: string
  name: string
  addedAt: string
}

interface WatchListData {
  id: string
  name: string
  items: WatchListItem[]
  isDefault?: boolean
  createdAt: string
}

interface WatchListProps {
  onWatchListChange?: (watchListId: string) => void
  onSymbolSelect?: (symbol: string) => void
  selectedWatchListId?: string
  className?: string
}

const DEFAULT_WATCHLISTS: WatchListData[] = [
  {
    id: 'favorites',
    name: '自選股',
    isDefault: true,
    items: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'popular',
    name: '熱門股',
    isDefault: true,
    items: [
      { symbol: '2330', name: '台積電', addedAt: new Date().toISOString() },
      { symbol: '2317', name: '鴻海', addedAt: new Date().toISOString() },
      { symbol: '2454', name: '聯發科', addedAt: new Date().toISOString() },
      { symbol: '2881', name: '富邦金', addedAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  }
]

/**
 * 自選股清單管理元件
 */
export function WatchList({
  onWatchListChange,
  onSymbolSelect,
  selectedWatchListId = 'favorites',
  className
}: WatchListProps) {
  const [watchLists, setWatchLists] = useState<WatchListData[]>(DEFAULT_WATCHLISTS)
  const [activeWatchListId, setActiveWatchListId] = useState(selectedWatchListId)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [editingName, setEditingName] = useState('')

  // 從 localStorage 載入自選股清單
  useEffect(() => {
    const saved = localStorage.getItem('william-hub-watchlists')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setWatchLists(parsed)
      } catch (error) {
        console.error('Failed to parse watchlists from localStorage:', error)
      }
    }
  }, [])

  // 保存到 localStorage
  const saveWatchLists = (lists: WatchListData[]) => {
    setWatchLists(lists)
    localStorage.setItem('william-hub-watchlists', JSON.stringify(lists))
  }

  // 切換監視清單
  const handleWatchListChange = (watchListId: string) => {
    setActiveWatchListId(watchListId)
    onWatchListChange?.(watchListId)
  }

  // 新增監視清單
  const handleCreateWatchList = () => {
    if (!newListName.trim()) return

    const newWatchList: WatchListData = {
      id: `custom-${Date.now()}`,
      name: newListName.trim(),
      items: [],
      isDefault: false,
      createdAt: new Date().toISOString()
    }

    const updatedLists = [...watchLists, newWatchList]
    saveWatchLists(updatedLists)
    setNewListName('')
    setActiveWatchListId(newWatchList.id)
    onWatchListChange?.(newWatchList.id)
  }

  // 刪除監視清單
  const handleDeleteWatchList = (watchListId: string) => {
    const watchList = watchLists.find(wl => wl.id === watchListId)
    if (!watchList || watchList.isDefault) return

    if (confirm(`確定要刪除監視清單「${watchList.name}」嗎？`)) {
      const updatedLists = watchLists.filter(wl => wl.id !== watchListId)
      saveWatchLists(updatedLists)
      
      // 如果刪除的是當前選中的清單，切換到預設清單
      if (activeWatchListId === watchListId) {
        setActiveWatchListId('favorites')
        onWatchListChange?.('favorites')
      }
    }
  }

  // 重新命名監視清單
  const handleRenameWatchList = (watchListId: string) => {
    if (!editingName.trim()) {
      setIsEditing(null)
      return
    }

    const updatedLists = watchLists.map(wl =>
      wl.id === watchListId ? { ...wl, name: editingName.trim() } : wl
    )
    saveWatchLists(updatedLists)
    setIsEditing(null)
    setEditingName('')
  }

  // 從監視清單中移除股票
  const handleRemoveFromWatchList = (watchListId: string, symbol: string) => {
    const updatedLists = watchLists.map(wl =>
      wl.id === watchListId
        ? { ...wl, items: wl.items.filter(item => item.symbol !== symbol) }
        : wl
    )
    saveWatchLists(updatedLists)
  }

  // 添加股票到監視清單（外部調用）
  // const addToWatchList = (symbol: string, name: string, watchListId?: string) => {
  //   const targetWatchListId = watchListId || activeWatchListId
  //   const targetWatchList = watchLists.find(wl => wl.id === targetWatchListId)
  //   
  //   if (!targetWatchList) return false

  //   // 檢查是否已存在
  //   if (targetWatchList.items.some(item => item.symbol === symbol)) {
  //     return false // 已存在
  //   }

  //   const newItem: WatchListItem = {
  //     symbol,
  //     name,
  //     addedAt: new Date().toISOString()
  //   }

  //   const updatedLists = watchLists.map(wl =>
  //     wl.id === targetWatchListId
  //       ? { ...wl, items: [...wl.items, newItem] }
  //       : wl
  //   )
  //   saveWatchLists(updatedLists)
  //   return true
  // }

  // // 檢查股票是否在監視清單中
  // const isInWatchList = (symbol: string, watchListId?: string) => {
  //   const targetWatchListId = watchListId || activeWatchListId
  //   const targetWatchList = watchLists.find(wl => wl.id === targetWatchListId)
  //   return targetWatchList?.items.some(item => item.symbol === symbol) || false
  // }

  const activeWatchList = watchLists.find(wl => wl.id === activeWatchListId)

  return (
    <div className={cn('space-y-4', className)}>
      {/* 監視清單分頁 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {watchLists.map(watchList => (
          <div key={watchList.id} className="flex items-center gap-1 flex-shrink-0">
            {isEditing === watchList.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameWatchList(watchList.id)
                    if (e.key === 'Escape') {
                      setIsEditing(null)
                      setEditingName('')
                    }
                  }}
                  onBlur={() => handleRenameWatchList(watchList.id)}
                  className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleWatchListChange(watchList.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    activeWatchListId === watchList.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  {watchList.isDefault && watchList.id === 'favorites' && (
                    <Star size={14} className="fill-current" />
                  )}
                  {watchList.name}
                  <span className="text-xs opacity-70">
                    ({watchList.items.length})
                  </span>
                </button>
                
                {!watchList.isDefault && (
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        setIsEditing(watchList.id)
                        setEditingName(watchList.name)
                      }}
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteWatchList(watchList.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* 新增監視清單 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateWatchList()
            }}
            placeholder="新清單名稱"
            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
          />
          <button
            onClick={handleCreateWatchList}
            disabled={!newListName.trim()}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* 監視清單內容 */}
      {activeWatchList && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">
              {activeWatchList.name}
            </h3>
            <span className="text-xs text-slate-500">
              {activeWatchList.items.length} 檔股票
            </span>
          </div>

          {activeWatchList.items.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Star size={24} className="mx-auto mb-2 opacity-50" />
              <p>尚無股票</p>
              <p className="text-xs mt-1">使用搜尋功能添加股票到此清單</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {activeWatchList.items.map(item => (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-2 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <button
                    onClick={() => onSymbolSelect?.(item.symbol)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-300 font-medium">
                        {item.symbol}
                      </span>
                      <span className="text-xs text-slate-500 truncate">
                        {item.name}
                      </span>
                    </div>
                  </button>
                  
                  {!activeWatchList.isDefault && (
                    <button
                      onClick={() => handleRemoveFromWatchList(activeWatchList.id, item.symbol)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 導出工具函數以供外部使用
export { type WatchListData, type WatchListItem }