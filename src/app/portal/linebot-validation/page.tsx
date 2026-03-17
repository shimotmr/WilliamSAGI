'use client'

import { useState } from 'react'

interface QueryResult {
  success: boolean
  query: string
  classification: string[]
  product_query: string
  products: any[]
  policy: {
    tier: string
    can_show_price: boolean
    can_show_inventory: boolean
    can_query_knowledge: boolean
    group_type: string
  }
  inventory_status: Record<string, string>
  final_response: string
  elapsed_ms: number
  error?: string
}

export default function LinebotValidationPage() {
  const [query, setQuery] = useState('')
  const [groupId, setGroupId] = useState('test-validation-group')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleQuery = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const res = await fetch('/api/portal/linebot-validation/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, group_id: groupId })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || '查詢失敗')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '網路錯誤')
    } finally {
      setLoading(false)
    }
  }

  const testCases = [
    { query: 'PUDU CC1 價格', group: 'test-validation-group' },
    { query: 'PUDU-CC1 庫存', group: 'test-tier-b-group' },
    { query: 'PUDU CC1 價格庫存', group: 'test-tier-c-group' },
    { query: 'B1 規格', group: 'test-validation-group' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">LINE Bot 查詢驗證台</h1>
        <p className="text-gray-600 text-sm">
          測試價格/庫存/知識查詢路由，驗證群組政策與 tier 授權
        </p>
      </div>

      {/* 快速測試案例 */}
      <div className="mb-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2 text-blue-900">快速測試案例</h3>
        <div className="flex flex-wrap gap-2">
          {testCases.map((tc, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(tc.query)
                setGroupId(tc.group)
              }}
              className="text-xs bg-white px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-100 transition"
            >
              {tc.query} ({tc.group.includes('tier-c') ? 'C' : tc.group.includes('tier-b') ? 'B' : 'A'})
            </button>
          ))}
        </div>
      </div>

      {/* 查詢輸入 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">查詢內容</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
              placeholder="輸入自然語句或料號，例如：PUDU CC1 價格"
              className="w-full border rounded-lg px-4 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">測試群組</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="test-validation-group">Tier A (完整權限)</option>
              <option value="test-tier-b-group">Tier B (經銷商)</option>
              <option value="test-tier-c-group">Tier C (無權限)</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleQuery}
          disabled={loading || !query.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {loading ? '查詢中...' : '執行查詢'}
        </button>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* 查詢結果 */}
      {result && (
        <div className="space-y-6">
          {/* 總覽卡片 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">問題分類</p>
                <p className="font-semibold">
                  {result.classification.map(c => {
                    const labels: Record<string, string> = {
                      'price': '價格',
                      'inventory': '庫存',
                      'knowledge': '知識',
                      'mixed': '混合',
                      'unknown': '未知'
                    }
                    return labels[c] || c
                  }).join(' + ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">命中產品</p>
                <p className="font-semibold">{result.products.length} 個</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">群組 Tier</p>
                <p className="font-semibold">{result.policy.tier}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">總耗時</p>
                <p className="font-semibold">{result.elapsed_ms} ms</p>
              </div>
            </div>
          </div>

          {/* 詳細結果 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左欄：產品與政策 */}
            <div className="space-y-4">
              {/* 群組政策 */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3 text-sm">群組政策</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${result.policy.can_show_price ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>價格查詢: {result.policy.can_show_price ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${result.policy.can_show_inventory ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>庫存查詢: {result.policy.can_show_inventory ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${result.policy.can_query_knowledge ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>知識查詢: {result.policy.can_query_knowledge ? '✓' : '✗'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">類型: </span>
                    <span>{result.policy.group_type}</span>
                  </div>
                </div>
              </div>

              {/* 命中產品 */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3 text-sm">命中產品 ({result.products.length})</h3>
                {result.products.length === 0 ? (
                  <p className="text-gray-500 text-sm">無符合產品</p>
                ) : (
                  <div className="space-y-3">
                    {result.products.map((product, idx) => (
                      <div key={product.id} className="border-b pb-2 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.aurotek_pn || product.pudu_pn}</p>
                          </div>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.brand}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">定價: </span>
                            {product.list_price ? `${product.currency} ${product.list_price.toLocaleString()}` : '-'}
                          </div>
                          {result.policy.can_show_price && (
                            <>
                              <div>
                                <span className="text-gray-600">A價: </span>
                                {product.dealer_price_a ? `${product.dealer_price_currency || 'TWD'} ${product.dealer_price_a.toLocaleString()}` : '-'}
                              </div>
                              <div>
                                <span className="text-gray-600">B價: </span>
                                {product.dealer_price_b ? `${product.dealer_price_currency || 'TWD'} ${product.dealer_price_b.toLocaleString()}` : '-'}
                              </div>
                            </>
                          )}
                        </div>
                        {result.inventory_status[product.id] && (
                          <div className="mt-1 text-xs">
                            <span className="text-gray-600">庫存狀態: </span>
                            <span className={`font-medium ${
                              result.inventory_status[product.id] === '無庫存' ? 'text-red-600' :
                              result.inventory_status[product.id] === '庫存緊張' ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {result.inventory_status[product.id]}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 右欄：回覆與原始資料 */}
            <div className="space-y-4">
              {/* 最終回覆 */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3 text-sm">最終回覆（LINE 訊息）</h3>
                <div className="bg-green-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                  {result.final_response}
                </div>
              </div>

              {/* Supabase 原始結果（排除成本） */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                  Supabase 原始結果
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">已排除成本欄位</span>
                </h3>
                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800 mb-2">
                    展開查看 JSON
                  </summary>
                  <pre className="bg-gray-50 p-3 rounded overflow-auto max-h-96 text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用說明 */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">使用說明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">查詢類型</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <strong>價格查詢</strong>: 包含「價格」「多少錢」「報價」等關鍵字</li>
              <li>• <strong>庫存查詢</strong>: 包含「庫存」「現貨」「有貨」等關鍵字</li>
              <li>• <strong>知識查詢</strong>: 包含「規格」「說明」「介紹」等關鍵字</li>
              <li>• <strong>混合查詢</strong>: 同時包含多種關鍵字</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Tier 權限</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <strong>Tier A</strong>: 最高級經銷商，可見 dealer_price_a</li>
              <li>• <strong>Tier B</strong>: 一般經銷商，可見 dealer_price_b</li>
              <li>• <strong>Tier C</strong>: 潛在客戶，可見 dealer_price_c（或無權限）</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-xs text-yellow-800">
            <strong>安全提醒</strong>: 成本欄位（cost, cost_currency 等）已完全排除，不會出現在任何輸出中。
          </p>
        </div>
      </div>
    </div>
  )
}
