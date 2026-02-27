'use client'

import { useState, useEffect } from 'react'

interface ModelUsageRecord {
  id: number
  model_provider: string
  model_id: string
  agent_id: string
  tokens_in: number
  tokens_out: number
  prompt_count: number
  cost_usd: number
  created_at: string
}

interface AgentRanking {
  agent: string
  total_tokens_in: number
  total_tokens_out: number
  total_tokens: number
  total_cost: number
  request_count: number
  success_count: number
  success_rate: number
}

interface ModelQuota {
  id: number
  model_provider: string
  model_id: string
  quota_type: string
  quota_limit: number
  quota_window_hours: number
  subscription_cost: number
}

interface UsageSummary {
  total_tokens_in: number
  total_tokens_out: number
  total_tokens: number
  total_cost: number
  total_prompts: number
  record_count: number
}

interface APIResponse {
  status: string
  data: {
    recent: ModelUsageRecord[]
    quotas: ModelQuota[]
    top_agents: AgentRanking[]
    summary: UsageSummary
  }
}

export default function ModelUsagePage() {
  const [data, setData] = useState<APIResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'summary' | 'recent' | 'agents' | 'quotas'>('summary')

  useEffect(() => {
    fetch('/api/model-usage?type=summary')
      .then(res => res.json())
      .then(result => {
        if (result.status === 'success') {
          setData(result.data)
        } else {
          setError(result.error || 'Failed to load data')
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

  const formatCost = (cost: number) => {
    return '$' + cost.toFixed(4)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8 flex items-center justify-center">
        <div className="text-xl">載入模型使用數據中...</div>
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

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="text-gray-500">沒有數據</div>
      </div>
    )
  }

  const { recent, quotas, top_agents, summary } = data

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">模型使用儀表板</h1>
          <p className="text-gray-400 mt-2">
            追蹤 AI 模型使用量和配額
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
          {(['summary', 'recent', 'agents', 'quotas'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab === 'summary' && '總覽'}
              {tab === 'recent' && '最近記錄'}
              {tab === 'agents' && 'Agent 排名'}
              {tab === 'quotas' && '配額'}
            </button>
          ))}
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-gray-400 text-sm">總輸入 Tokens</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatNumber(summary.total_tokens_in)}
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-gray-400 text-sm">總輸出 Tokens</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatNumber(summary.total_tokens_out)}
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-gray-400 text-sm">總花費</div>
                <div className="text-2xl font-bold text-green-400 mt-1">
                  {formatCost(summary.total_cost)}
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-gray-400 text-sm">總請求次數</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatNumber(summary.total_prompts)}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold mb-4">Top Agents</h3>
              <div className="space-y-3">
                {top_agents.map((agent, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono">#{idx + 1}</span>
                      <span className="font-medium">{agent.agent}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Tokens:</span>{' '}
                        <span className="text-white">{formatNumber(agent.total_tokens)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cost:</span>{' '}
                        <span className="text-green-400">{formatCost(agent.total_cost)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Tab */}
        {activeTab === 'recent' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">時間</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Provider</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Model</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Agent</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Tokens In</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Tokens Out</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((record) => (
                  <tr key={record.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(record.created_at).toLocaleString('zh-TW')}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                        {record.model_provider}
                      </span>
                    </td>
                    <td className="p-4 text-white">{record.model_id}</td>
                    <td className="p-4 text-gray-300">{record.agent_id}</td>
                    <td className="p-4 text-right text-gray-300">{formatNumber(record.tokens_in)}</td>
                    <td className="p-4 text-right text-gray-300">{formatNumber(record.tokens_out)}</td>
                    <td className="p-4 text-right text-green-400">{formatCost(record.cost_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Rank</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Agent</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Tokens In</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Tokens Out</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Total Tokens</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Requests</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Cost</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {top_agents.map((agent, idx) => (
                  <tr key={idx} className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-700 text-white text-sm rounded">
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-white">{agent.agent}</td>
                    <td className="p-4 text-right text-gray-300">{formatNumber(agent.total_tokens_in)}</td>
                    <td className="p-4 text-right text-gray-300">{formatNumber(agent.total_tokens_out)}</td>
                    <td className="p-4 text-right text-white font-medium">{formatNumber(agent.total_tokens)}</td>
                    <td className="p-4 text-right text-gray-300">{formatNumber(agent.request_count)}</td>
                    <td className="p-4 text-right text-green-400">{formatCost(agent.total_cost)}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        agent.success_rate >= 95 ? 'bg-green-600/20 text-green-400' :
                        agent.success_rate >= 80 ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-red-600/20 text-red-400'
                      }`}>
                        {agent.success_rate?.toFixed(1) ?? 'N/A'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quotas Tab */}
        {activeTab === 'quotas' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quotas.map((quota) => (
              <div key={quota.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded">
                    {quota.model_provider}
                  </span>
                </div>
                <div className="text-lg font-semibold text-white mb-2">
                  {quota.model_id}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">配額類型</span>
                    <span className="text-gray-300">{quota.quota_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">配額上限</span>
                    <span className="text-white">{formatNumber(quota.quota_limit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">週期</span>
                    <span className="text-gray-300">{quota.quota_window_hours} 小時</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">訂閱費用</span>
                    <span className="text-green-400">${quota.subscription_cost}/月</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
