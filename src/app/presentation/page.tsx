'use client'

import { useState } from 'react'

interface PresentationResult {
  id: string
  title: string
  slidesUrl: string
  createdAt: string
}

const AUDIENCE_OPTIONS = [
  { value: 'internal', label: '內部團隊' },
  { value: 'client-technical', label: '技術客戶' },
  { value: 'client-general', label: '一般客戶' },
  { value: 'executive', label: '高層主管' },
  { value: 'investor', label: '投資人' },
  { value: 'partner', label: '合作夥伴' },
]

export default function PresentationPage() {
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<PresentationResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('請輸入簡報主題')
      return
    }
    if (!audience) {
      setError('請選擇目標受眾')
      return
    }

    setError('')
    setIsGenerating(true)
    setResult(null)

    try {
      const response = await fetch('/api/presentation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, audience }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '生成簡報失敗')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤，請稍後重試')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (result?.slidesUrl) {
      navigator.clipboard.writeText(result.slidesUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            AI 簡報生成器
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            輸入簡報主題和目標受眾，自動生成專業簡報大綱
          </p>
        </div>

        {/* Input Form */}
        <div 
          className="rounded-lg border p-6 mb-6"
          style={{ 
            backgroundColor: 'var(--card)', 
            borderColor: 'var(--border)' 
          }}
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            簡報設定
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            設定簡報的主題和目標受眾
          </p>

          <div className="space-y-4">
            {/* Topic Input */}
            <div className="space-y-2">
              <label htmlFor="topic" style={{ color: 'var(--foreground)' }}>
                簡報主題 <span className="text-red-500">*</span>
              </label>
              <input
                id="topic"
                type="text"
                placeholder="例如：2026 Q1 產品發表會"
                value={topic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-md border"
                style={{ 
                  backgroundColor: 'var(--input)', 
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              />
            </div>

            {/* Audience Selection */}
            <div className="space-y-2">
              <label htmlFor="audience" style={{ color: 'var(--foreground)' }}>
                目標受眾 <span className="text-red-500">*</span>
              </label>
              <select
                id="audience"
                value={audience}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-md border"
                style={{ 
                  backgroundColor: 'var(--input)', 
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                <option value="">選擇目標受眾</option>
                {AUDIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full px-4 py-2 rounded-md font-medium transition-colors"
              style={{ 
                backgroundColor: isGenerating ? 'var(--muted)' : 'var(--primary)',
                color: isGenerating ? 'var(--text-secondary)' : 'white'
              }}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </span>
              ) : (
                '生成簡報'
              )}
            </button>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div 
            className="rounded-lg border p-6"
            style={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)' 
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  生成結果
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  您的簡報已成功生成
                </p>
              </div>
              <span 
                className="px-3 py-1 rounded-full text-sm"
                style={{ 
                  backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}
              >
                完成
              </span>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>簡報標題</p>
                <p className="text-lg font-medium mt-1" style={{ color: 'var(--foreground)' }}>
                  {result.title}
                </p>
              </div>

              {/* Slides URL */}
              <div className="space-y-2">
                <label style={{ color: 'var(--foreground)' }}>簡報連結</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={result.slidesUrl}
                    className="flex-1 px-3 py-2 rounded-md border"
                    style={{ 
                      backgroundColor: 'var(--input)', 
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-md border hover:bg-muted"
                    style={{ borderColor: 'var(--border)' }}
                    title="複製連結"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                  <a
                    href={result.slidesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-md border hover:bg-muted"
                    style={{ borderColor: 'var(--border)' }}
                    title="開啟簡報"
                  >
                    ↗️
                  </a>
                </div>
              </div>

              {/* Created Time */}
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                建立時間：{new Date(result.createdAt).toLocaleString('zh-TW')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
