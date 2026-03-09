'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, FileText, Copy, Check } from 'lucide-react'

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
        <Card className="mb-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>簡報設定</CardTitle>
            <CardDescription style={{ color: 'var(--text-secondary)' }}>
              設定簡報的主題和目標受眾
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Topic Input */}
            <div className="space-y-2">
              <Label htmlFor="topic" style={{ color: 'var(--foreground)' }}>
                簡報主題 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="topic"
                placeholder="例如：2026 Q1 產品發表會"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ 
                  backgroundColor: 'var(--input)', 
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              />
            </div>

            {/* Audience Selection */}
            <div className="space-y-2">
              <Label htmlFor="audience" style={{ color: 'var(--foreground)' }}>
                目標受眾 <span className="text-red-500">*</span>
              </Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger style={{ 
                  backgroundColor: 'var(--input)', 
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}>
                  <SelectValue placeholder="選擇目標受眾" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  生成簡報
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        {result && (
          <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle style={{ color: 'var(--foreground)' }}>生成結果</CardTitle>
                  <CardDescription style={{ color: 'var(--text-secondary)' }}>
                    您的簡報已成功生成
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  完成
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>簡報標題</p>
                <p className="text-lg font-medium mt-1" style={{ color: 'var(--foreground)' }}>
                  {result.title}
                </p>
              </div>

              {/* Slides URL */}
              <div className="space-y-2">
                <Label style={{ color: 'var(--foreground)' }}>簡報連結</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={result.slidesUrl}
                    style={{ 
                      backgroundColor: 'var(--input)', 
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    title="複製連結"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <a href={result.slidesUrl} target="_blank" rel="noopener noreferrer" title="開啟簡報">
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Created Time */}
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                建立時間：{new Date(result.createdAt).toLocaleString('zh-TW')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
