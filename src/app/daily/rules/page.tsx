'use client'

import { useState, useEffect } from 'react'

interface SOPRule {
  id: number
  name: string
  category: string
  description: string
  responsible_agent: string
  check_frequency: string
  compliance_score: number
  risk_level: string
  automation_level: number
  tags: string[]
  last_updated: string
}

export default function RulesPage() {
  const [rules, setRules] = useState<SOPRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetch('/api/sop-rules')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setRules(data.data)
        } else {
          setError(data.error || 'Failed to load rules')
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const categories = ['all', ...Array.from(new Set(rules.map(r => r.category).filter(Boolean)))]

  const filteredRules = selectedCategory === 'all' 
    ? rules 
    : rules.filter(r => r.category === selectedCategory)

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'bg-red-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8 flex items-center justify-center">
        <div className="text-xl">載入 SOP 規則中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-400">
          錯誤: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">SOP 規則儀表板</h1>
            <p className="text-gray-400 mt-2">
              共 {rules.length} 條規則
            </p>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRules.map(rule => (
            <div 
              key={rule.id} 
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white line-clamp-2">
                  {rule.name}
                </h3>
                <span className={`px-2 py-1 ${getRiskColor(rule.risk_level)} text-xs rounded`}>
                  {rule.risk_level || 'N/A'}
                </span>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                {rule.description || '無描述'}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                  {rule.category || '未分類'}
                </span>
                <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                  {rule.responsible_agent || '未指定'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-gray-500 text-xs">合規分數</div>
                  <div className="text-white font-medium">
                    {rule.compliance_score ?? 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-gray-500 text-xs">檢查頻率</div>
                  <div className="text-white font-medium">
                    {rule.check_frequency || 'N/A'}
                  </div>
                </div>
              </div>

              {rule.tags && rule.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {rule.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredRules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            沒有找到符合的規則
          </div>
        )}
      </div>
    </div>
  )
}
