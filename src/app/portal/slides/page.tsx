'use client'
import { useState } from 'react'

const TEMPLATES = [
  { id: 'product', label: '產品簡報', desc: '產品特色 + 規格 + 報價' },
  { id: 'proposal', label: '提案簡報', desc: '問題定義 + 解決方案 + ROI' },
  { id: 'quarterly', label: '季報', desc: 'KPI 達成 + 分析 + 下季目標' },
]

export default function SlidesPage() {
  const [template, setTemplate] = useState('product')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{url: string} | null>(null)
  const [error, setError] = useState('')

  const generate = async () => {
    if (!title) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/portal/slides/create', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ template, title })
      })
      const data = await res.json()
      if (data.url) setResult(data)
      else setError(data.error || '建立失敗')
    } catch { setError('請求失敗') }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">一鍵產生 Slides</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex gap-2 mb-4 flex-wrap">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setTemplate(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${template===t.id?'bg-blue-600 text-white':'bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-4">{TEMPLATES.find(t=>t.id===template)?.desc}</p>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="簡報標題"
          className="block w-full border rounded-lg px-4 py-2 text-sm mb-4" />
        <button onClick={generate} disabled={!title||loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50 w-full">
          {loading ? '建立中...' : '建立 Google Slides'}
        </button>
        {result && (
          <a href={result.url} target="_blank" rel="noopener"
            className="mt-4 block text-center bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
            ✅ 開啟 Google Slides →
          </a>
        )}
        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  )
}
