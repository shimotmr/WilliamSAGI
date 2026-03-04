'use client'
import { useState, useEffect } from 'react'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  lines?: number
  tokens?: number
  children?: FileNode[]
}

export default function TokenUsagePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    fetch('/api/hub/token-usage')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  
  const toggleDir = (path: string) => {
    const newSet = new Set(expandedDirs)
    if (newSet.has(path)) newSet.delete(path)
    else newSet.add(path)
    setExpandedDirs(newSet)
  }
  
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }
  
  const formatTokens = (n: number) => n.toLocaleString()
  
  if (loading) return <div className="p-6 text-gray-400">載入中...</div>
  
  // 處理 dailyByModel 數據
  const dailyData = data?.dailyByModel || []
  const modelColors: Record<string, string> = {
    'claude-sonnet-4-6': '#f97316',
    'claude-opus-4-5': '#8b5cf6',
    'minimax/MiniMax-M2.5': '#06b6d4',
    'zai/glm-5': '#22c55e',
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Token 使用量儀表板</h1>
      
      {/* 摘要卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">核心檔案 Token</div>
          <div className="text-2xl font-bold text-orange-400">
            {formatTokens(data?.summary?.coreFilesTotalTokens || 0)}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Memory 目錄 Token</div>
          <div className="text-2xl font-bold text-cyan-400">
            {formatTokens(data?.summary?.memoryTotalTokens || 0)}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">估計每日消耗</div>
          <div className="text-2xl font-bold text-green-400">
            {formatTokens(data?.summary?.estimatedDailyTokens || 0)}
          </div>
        </div>
      </div>
      
      {/* 每日使用量圖表 */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">過去 5 天每日使用量（依 LLM）</h2>
        {dailyData.length > 0 ? (
          <div className="flex items-end gap-2 h-40">
            {dailyData.map((day: any, i: number) => {
              const maxTokens = Math.max(...dailyData.map((d: any) => d.total_tokens || 0))
              const height = maxTokens > 0 ? ((day.total_tokens || 0) / maxTokens) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-orange-500 rounded-t"
                    style={{ height: `${height}%`, minHeight: day.total_tokens ? '4px' : 0 }}
                  />
                  <div className="text-xs mt-2 text-gray-400">{day.date?.slice(5)}</div>
                  <div className="text-xs text-orange-400">{formatTokens(day.total_tokens || 0)}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500">暫無數據</p>
        )}
      </div>
      
      {/* 核心 AGENTS 檔案 */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">核心 AGENTS 檔案（Session 啟動必載）</h2>
        <div className="space-y-2">
          {data?.coreFiles?.map((f: any) => (
            <div key={f.name} className="flex items-center justify-between p-2 bg-slate-700 rounded">
              <span className="font-mono text-sm">{f.name}</span>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-400">{formatBytes(f.size)}</span>
                <span className="text-gray-400">{f.lines} 行</span>
                <span className="text-orange-400">~{formatTokens(f.tokens)} tokens</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Cron Jobs 估算 */}
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Cron Jobs 每日消耗估算</h2>
        <div className="space-y-2">
          {data?.cronJobs?.map((job: any) => (
            <div key={job.name} className="flex items-center justify-between p-2 bg-slate-700 rounded">
              <span>{job.name}</span>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-400">{job.frequency} 次/天</span>
                <span className="text-cyan-400">~{formatTokens(job.frequency * job.tokensPerRun)} tokens</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-2 bg-slate-600 rounded mt-4">
            <span className="font-semibold">合計</span>
            <span className="text-green-400 font-bold">~{formatTokens(data?.cronDailyEstimate || 0)} tokens/天</span>
          </div>
        </div>
      </div>
      
      {/* Memory 目錄 */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          Memory 目錄（{data?.memoryStats?.files} 個 .md 檔案）
        </h2>
        <div className="text-sm text-gray-400 mb-4">
          總大小：{formatBytes(data?.memoryStats?.totalSize || 0)} | 
          總 Token：~{formatTokens(data?.memoryStats?.totalTokens || 0)}
        </div>
      </div>
    </div>
  )
}
