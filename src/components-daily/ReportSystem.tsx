/**
 * William Hub 重構後的報告系統組件
 * 功能: 只顯示工作產出報告，提供過濾和搜尋功能
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Calendar, FileText, Tag, AlertCircle, Check, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

const ReportSystem = () => {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<any>({})
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  
  // 篩選狀態
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    source: '',
    from_date: '',
    to_date: ''
  })
  
  // 分頁狀態
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    total: 0
  })

  /**
   * 載入報告資料
   */
  const loadReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        ...filters,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        sort_by: 'created_at',
        sort_order: 'desc'
      })
      
      // 移除空值
      const paramsArray = Array.from(params.entries())
      for (const [key, value] of paramsArray) {
        if (!value) params.delete(key)
      }
      
      const response = await fetch(`/api/reports?${params}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '載入失敗')
      }
      
      setReports(result.data)
      setPagination(prev => ({
        ...prev,
        total: result.pagination?.total || result.data.length
      }))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.offset, pagination.limit])

  /**
   * 載入統計資料
   */
  const loadStatistics = useCallback(async () => {
    try {
      const response = await fetch('/api/reports?stats=true')
      const result = await response.json()
      
      if (result.success) {
        setStatistics(result.data)
      }
    } catch (err) {
      console.error('統計資料載入失敗:', err instanceof Error ? err.message : String(err))
    }
  }, [])

  // 初始載入
  useEffect(() => {
    loadReports()
    loadStatistics()
  }, [loadReports, loadStatistics])

  /**
   * 處理篩選變更
   */
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setPagination(prev => ({
      ...prev,
      offset: 0  // 重置到第一頁
    }))
  }

  /**
   * 清除所有篩選
   */
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      source: '',
      from_date: '',
      to_date: ''
    })
    setPagination(prev => ({
      ...prev,
      offset: 0
    }))
  }

  /**
   * 分頁控制
   */
  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({
      ...prev,
      offset: newOffset
    }))
  }

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * 處理單一選擇
   */
  const toggleSelect = (id: string) => {
    setSelectedReports(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  /**
   * 處理全選
   */
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedReports(new Set())
      setSelectAll(false)
    } else {
      setSelectedReports(new Set(reports.map(r => r.id)))
      setSelectAll(true)
    }
  }

  /**
   * 清除所有選擇
   */
  const clearSelection = () => {
    setSelectedReports(new Set())
    setSelectAll(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* 標題和統計 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          📊 工作報告系統
        </h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">系統已優化</span>
          </div>
          <p className="text-blue-700 text-sm">
            已過濾外部資料，只顯示工作產出報告。普渡爬蟲等外部資料已被排除。
          </p>
        </div>

        {/* 統計卡片 */}
        {Object.keys(statistics).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-gray-900">
                {statistics.total || 0}
              </div>
              <div className="text-sm text-gray-600">總計報告</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {statistics.recent_count || 0}
              </div>
              <div className="text-sm text-gray-600">最近一週</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(statistics.by_category || {}).length}
              </div>
              <div className="text-sm text-gray-600">報告分類</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(statistics.by_source || {}).length}
              </div>
              <div className="text-sm text-gray-600">資料來源</div>
            </div>
          </div>
        )}
      </div>

      {/* 搜尋和篩選 */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 搜尋框 */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜尋報告標題或內容..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* 分類篩選 */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">所有分類</option>
              <option value="council">🏛️ 議事廳</option>
              <option value="technical">💻 技術報告</option>
              <option value="work-output">工作產出</option>
              <option value="project-analysis">專案分析</option>
              <option value="weekly-summary">週報</option>
              <option value="monthly-report">月報</option>
            </select>
          </div>

          {/* 開始日期 */}
          <div>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.from_date}
              onChange={(e) => handleFilterChange('from_date', e.target.value)}
            />
          </div>

          {/* 結束日期 */}
          <div>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.to_date}
              onChange={(e) => handleFilterChange('to_date', e.target.value)}
            />
          </div>
        </div>

        {/* 篩選控制按鈕 */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            {Object.values(filters).some(v => v) && (
              <span>已套用篩選條件</span>
            )}
          </div>
          
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            清除篩選
          </button>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800">載入錯誤: {error}</div>
        </div>
      )}

      {/* 載入狀態 */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="mt-2 text-gray-600">載入中...</div>
        </div>
      )}

      {/* 報告列表 */}
      {!loading && reports.length > 0 && (
        <div className="space-y-4">
          {/* 批量操作工具欄 */}
          {reports.length > 0 && (
            <div className="bg-white rounded-lg border p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
                >
                  {selectAll ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">全選 ({reports.length})</span>
                </button>
                {selectedReports.size > 0 && (
                  <span className="text-sm text-gray-500">
                    已選擇 {selectedReports.size} 項
                  </span>
                )}
              </div>
              {selectedReports.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  清除選擇
                </button>
              )}
            </div>
          )}
          
          {reports.map((report) => (
            <div 
              key={report.id} 
              className={`bg-white rounded-lg border p-4 sm:p-6 hover:shadow-md transition-shadow ${
                selectedReports.has(report.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                {/* 選擇框 */}
                <button
                  onClick={() => toggleSelect(report.id)}
                  className="mt-1 flex-shrink-0 text-gray-400 hover:text-blue-600"
                >
                  {selectedReports.has(report.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
                      {report.title}
                    </h3>
                    <Link 
                      href={`/reports/${report.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap"
                    >
                      查看詳情 →
                    </Link>
                  </div>
                  
                  {report.summary && (
                    <p className="text-gray-600 mt-2 line-clamp-2 sm:line-clamp-3">
                      {report.summary}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">{formatDate(report.created_at)}</span>
                      <span className="sm:hidden">{new Date(report.created_at).toLocaleDateString('zh-TW')}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      <span className="capitalize">{report.category}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {report.source}
                    </div>
                  </div>
                  
                  {/* 標籤 */}
                  {report.tags && report.tags.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {report.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 無資料狀態 */}
      {!loading && reports.length === 0 && !error && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600 mb-2">沒有找到符合條件的報告</div>
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            清除篩選條件
          </button>
        </div>
      )}

      {/* 分頁控制 */}
      {!loading && reports.length > 0 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-600">
            顯示 {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} 
            ，共 {pagination.total} 筆
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
              disabled={pagination.offset === 0}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一頁
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.offset + pagination.limit)}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportSystem