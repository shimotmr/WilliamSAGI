// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'

interface TrendData {
  status: string
  lastUpdate: string
  keywords: string[]
  keywordStats: { keyword: string; count: number }[]
  platformStats: { platform: string; count: number }[]
  hotPosts: {
    title: string
    url: string
    platform: string
    score: number
    keywords: string[]
  }[]
  totalResults: number
  phase: number
}

export default function TrendPage() {
  const [data, setData] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/model-usage/trend')
      .then(res => res.json())
      .then(result => {
        setData(result)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (!data || data.status !== 'success') {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="text-gray-400">No data available</div>
      </div>
    )
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            🤖 AI 趨勢聚合器
          </h1>
          <p className="text-gray-400 mt-2">
            多來源趨勢資訊 · 覆蓋台灣 AI 社群
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span>最後更新：{formatDate(data.lastUpdate)}</span>
            <span>·</span>
            <span>總計 {data.totalResults} 則趨勢</span>
            <span>·</span>
            <span>Phase {data.phase}</span>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {data.platformStats.map((stat, idx) => (
            <div key={idx} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="text-2xl font-bold text-cyan-400">{stat.count}</div>
              <div className="text-gray-400 text-sm">{stat.platform}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Keywords */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">🔥 熱門關鍵詞</h2>
            <div className="flex flex-wrap gap-2">
              {data.keywordStats.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                  style={{
                    fontSize: `${Math.max(0.75, Math.min(1.5, 0.75 + item.count * 0.1))}rem`,
                    color: idx < 5 ? '#22d3ee' : '#9ca3af'
                  }}
                >
                  {item.keyword} ({item.count})
                </span>
              ))}
            </div>
          </div>

          {/* Hot Posts */}
          <div className="lg:col-span-2 bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">📈 熱門趨勢排行</h2>
            <div className="space-y-3">
              {data.hotPosts.map((post, idx) => (
                <a
                  key={idx}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl font-bold text-gray-600">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-cyan-900/50 text-cyan-400 text-xs rounded">
                          {post.platform}
                        </span>
                        <span className="text-yellow-500 text-sm">★ {post.score}</span>
                      </div>
                      <h3 className="text-white font-medium truncate">{post.title}</h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.keywords.slice(0, 5).map((kw, i) => (
                          <span key={i} className="text-xs text-gray-500">#{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
