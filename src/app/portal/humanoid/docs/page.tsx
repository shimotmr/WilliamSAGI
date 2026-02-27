'use client'
import { useState } from 'react'

const docs = [
  {
    id: 'tiangong-sdk',
    title: '天工 2.0 Pro SDK 文件',
    category: 'SDK',
    brand: '天工',
    version: '2.0.5.1',
    summary: 'ROS2-based 機器人開發套件，提供完整控制接口、實時通信、模組化設計',
    tags: ['ROS2', 'SDK', 'API', '天工'],
  },
  {
    id: 'unitree-repos',
    title: '宇樹機器人（Unitree）開源技術倉庫清單',
    category: '開源資源',
    brand: '宇樹 Unitree',
    version: null,
    summary: 'Unitree Robotics 完整開源倉庫清單，包含 SDK、驅動、控制算法',
    tags: ['Unitree', '開源', 'GitHub'],
  },
  {
    id: 'vla-intro',
    title: 'VLA 模型概述（Vision-Language-Action）',
    category: 'AI 模型',
    brand: null,
    version: null,
    summary: '將視覺、語言、動作三個模態整合的端到端機器人控制模型架構',
    tags: ['VLA', 'AI', '語言模型', '機器人學習'],
  },
]

const CATEGORIES = ['全部', 'SDK', 'AI 模型', '開源資源', 'API 參考', '整合指南']

export default function HumanoidDocsPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [cat, setCat] = useState('全部')
  const [q, setQ] = useState('')

  const filtered = docs.filter(d =>
    (cat === '全部' || d.category === cat) &&
    (!q || d.title.includes(q) || d.tags.some(t => t.includes(q)))
  )
  const doc = selected ? docs.find(d => d.id === selected) : null

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📄</span>
        <div>
          <h1 className="text-2xl font-bold">技術文件庫</h1>
          <p className="text-sm text-gray-500">人形機器人 SDK、API 文件、整合指南</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-lg text-sm ${cat === c ? 'bg-slate-800 text-white' : 'bg-gray-100'}`}>
            {c}
          </button>
        ))}
        <div className="flex-1" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜尋文件..."
          className="border rounded-lg px-3 py-2 text-sm w-48" />
      </div>

      <div className="flex gap-4">
        {/* 文件列表 */}
        <div className="w-72 flex-shrink-0 space-y-2">
          {filtered.map(d => (
            <button key={d.id} onClick={() => setSelected(d.id)}
              className={`w-full text-left p-4 rounded-xl shadow text-sm transition-colors ${selected === d.id ? 'bg-slate-800 text-white' : 'bg-white hover:bg-gray-50'}`}>
              <p className="font-medium leading-snug">{d.title}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-1.5 py-0.5 rounded ${selected === d.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{d.category}</span>
                {d.brand && <span className={`text-xs px-1.5 py-0.5 rounded ${selected === d.id ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>{d.brand}</span>}
              </div>
            </button>
          ))}
          {!filtered.length && <p className="text-gray-400 text-sm p-4">無符合文件</p>}
        </div>

        {/* 文件內容 */}
        <div className="flex-1 bg-white rounded-xl shadow p-6 min-h-[400px]">
          {doc ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{doc.title}</h2>
                  {doc.version && <p className="text-sm text-gray-400 mt-1">v{doc.version}</p>}
                </div>
                {doc.brand && (
                  <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">{doc.brand}</span>
                )}
              </div>
              <p className="text-gray-600 mb-4">{doc.summary}</p>
              <div className="flex gap-2 flex-wrap mb-6">
                {doc.tags.map(t => (
                  <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{t}</span>
                ))}
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-700">
                📎 完整文件內容正在整合中。如需原始文件，請至 /portal/marketing/walker-docs 查看天工 SDK 文件。
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-3">📄</p>
                <p>選擇左側文件查看內容</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
