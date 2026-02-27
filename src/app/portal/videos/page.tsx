'use client'
import { useState, useEffect } from 'react'

interface Video { id: string; title: string; tags: string[]; url: string; description?: string; created_at: string }

export default function VideosPage() {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/portal/videos?limit=50')
      .then(r => r.json())
      .then(d => {
        setVideos(d.videos || [])
        const tags = [...new Set((d.videos || []).flatMap((v: Video) => v.tags || []))] as string[]
        setAllTags(tags.slice(0, 20))
      })
  }, [])

  const search = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (tag) params.set('tag', tag)
    const res = await fetch(`/api/portal/videos?${params}`)
    const data = await res.json()
    setVideos(data.videos || [])
    setLoading(false)
  }

  const filtered = videos.filter(v => {
    const q = query.toLowerCase()
    const matchQ = !q || v.title.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q) || v.tags.some(t => t.toLowerCase().includes(q))
    const matchTag = !tag || v.tags.includes(tag)
    return matchQ && matchTag
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">影片庫</h1>
      <div className="flex gap-3 mb-4">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter'&&search()}
          placeholder="搜尋標題、描述、標籤..." className="flex-1 border rounded-lg px-4 py-2 text-sm" />
        <button onClick={search} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">搜尋</button>
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setTag('')} className={`px-3 py-1 rounded-full text-xs ${!tag?'bg-blue-600 text-white':'bg-gray-100'}`}>全部</button>
          {allTags.map(t => (
            <button key={t} onClick={() => setTag(t===tag?'':t)} className={`px-3 py-1 rounded-full text-xs ${tag===t?'bg-blue-600 text-white':'bg-gray-100'}`}>{t}</button>
          ))}
        </div>
      )}
      {loading ? <p className="text-gray-400 text-sm">搜尋中...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => (
            <a key={v.id} href={v.url} target="_blank" rel="noopener"
              className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow">
              <p className="font-medium text-sm mb-2 line-clamp-2">{v.title}</p>
              {v.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{v.description}</p>}
              <div className="flex flex-wrap gap-1">
                {v.tags.map(t => <span key={t} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{t}</span>)}
              </div>
            </a>
          ))}
          {!filtered.length && <p className="text-gray-400 text-sm col-span-3">無符合結果</p>}
        </div>
      )}
    </div>
  )
}
