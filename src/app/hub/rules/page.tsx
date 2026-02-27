'use client'

import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import type { RuleItem, RuleSummary } from '@/app/api/rules/route'

// 層級配置
const levelConfig = {
  RED: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '🔴',
    label: '紅級 (生死攸關)',
    description: '違反後會導致系統停機或安全漏洞'
  },
  YELLOW: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)', 
    border: 'rgba(245, 158, 11, 0.3)',
    icon: '🟡',
    label: '黃級 (影響效率)',
    description: '影響系統效能或開發效率'
  },
  GREEN: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: '🟢',
    label: '綠級 (最佳實踐)',
    description: '代碼品質和流程規範'
  }
}

// 狀態配置
const statusConfig = {
  complete: {
    icon: '✅',
    label: '完整綁定',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    description: '有觸發點+執行者+驗證方式'
  },
  partial: {
    icon: '⚠️',
    label: '部分綁定',
    color: '#f59e0b', 
    bg: 'rgba(245, 158, 11, 0.15)',
    description: '缺少某些執行要素'
  },
  dead: {
    icon: '❌',
    label: 'Dead Rule',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    description: '無執行綁定'
  }
}

function StatusIcon({ status, size = 'sm' }: { status: 'complete' | 'partial' | 'dead', size?: 'sm' | 'lg' }) {
  const config = statusConfig[status]
  const iconSize = size === 'lg' ? 24 : 16
  
  if (status === 'complete') {
    return <CheckCircle size={iconSize} color={config.color} />
  }
  if (status === 'partial') {
    return <AlertTriangle size={iconSize} color={config.color} />
  }
  return <XCircle size={iconSize} color={config.color} />
}

function ComplianceChart({ summary }: { summary: RuleSummary }) {
  const { completeBinding, partialBinding, deadRules, totalRules, complianceRate } = summary
  
  // 計算角度
  const completeAngle = totalRules > 0 ? (completeBinding / totalRules) * 360 : 0
  const partialAngle = totalRules > 0 ? (partialBinding / totalRules) * 360 : 0
  const deadAngle = totalRules > 0 ? (deadRules / totalRules) * 360 : 0
  
  const radius = 45
  
  // SVG 路徑計算
  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = startAngle * (Math.PI / 180)
    const end = endAngle * (Math.PI / 180)
    
    const x1 = 50 + radius * Math.cos(start)
    const y1 = 50 + radius * Math.sin(start) 
    const x2 = 50 + radius * Math.cos(end)
    const y2 = 50 + radius * Math.sin(end)
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    
    if (startAngle === endAngle) return ''
    
    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
  }
  
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
        {/* 背景圓 */}
        <circle cx="50" cy="50" r={radius} fill="rgba(55, 65, 81, 0.2)" />
        
        {/* 完整綁定 */}
        {completeAngle > 0 && (
          <path
            d={createArcPath(0, completeAngle)}
            fill={statusConfig.complete.color}
            opacity="0.8"
          />
        )}
        
        {/* 部分綁定 */}
        {partialAngle > 0 && (
          <path
            d={createArcPath(completeAngle, completeAngle + partialAngle)}
            fill={statusConfig.partial.color}
            opacity="0.8"
          />
        )}
        
        {/* Dead Rules */}
        {deadAngle > 0 && (
          <path
            d={createArcPath(completeAngle + partialAngle, 360)}
            fill={statusConfig.dead.color}
            opacity="0.8"
          />
        )}
        
        {/* 內圓 */}
        <circle cx="50" cy="50" r="25" fill="rgba(17, 24, 39, 0.9)" />
      </svg>
      
      {/* 中央百分比 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-bold text-white">
          {complianceRate.toFixed(0)}%
        </div>
        <div className="text-xs text-gray-400">合規率</div>
      </div>
    </div>
  )
}

function RuleCard({ rule }: { rule: RuleItem }) {
  const levelConf = levelConfig[rule.level]
  const statusConf = statusConfig[rule.status]
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-xl border p-4 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
      style={{
        borderColor: levelConf.border,
        background: levelConf.bg,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* 卡片標題 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{levelConf.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{rule.name}</h3>
            <p className="text-xs text-gray-400">{levelConf.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon status={rule.status} />
          <div
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              background: statusConf.bg,
              color: statusConf.color
            }}
          >
            {statusConf.label}
          </div>
        </div>
      </div>

      {/* 綁定評分 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500">綁定評分:</span>
        <div className="flex gap-1">
          {Array.from({ length: rule.maxScore }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < rule.bindingScore 
                  ? 'bg-green-500' 
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {rule.bindingScore}/{rule.maxScore}
        </span>
      </div>

      {/* 展開的詳細信息 */}
      {expanded && (
        <div className="border-t border-gray-700/30 pt-3 space-y-2">
          <div className="text-xs text-gray-400">
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-1 ${rule.hasBindingSection ? 'text-green-400' : 'text-red-400'}`}>
                {rule.hasBindingSection ? '✓' : '✗'} 執行綁定段落
              </div>
              <div className={`flex items-center gap-1 ${rule.hasTrigger ? 'text-green-400' : 'text-red-400'}`}>
                {rule.hasTrigger ? '✓' : '✗'} 觸發點定義
              </div>
              <div className={`flex items-center gap-1 ${rule.hasExecutor ? 'text-green-400' : 'text-red-400'}`}>
                {rule.hasExecutor ? '✓' : '✗'} 執行者指定
              </div>
              <div className={`flex items-center gap-1 ${rule.hasVerification ? 'text-green-400' : 'text-red-400'}`}>
                {rule.hasVerification ? '✓' : '✗'} 驗證機制
              </div>
            </div>
          </div>
          
          {rule.missingElements.length > 0 && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
              <div className="text-xs text-red-400 font-medium mb-1">缺失要素:</div>
              <ul className="text-xs text-red-300 space-y-1">
                {rule.missingElements.map((element, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full" />
                    {element}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {rule.lastExecuted && (
            <div className="text-xs text-gray-500">
              最後執行: {new Date(rule.lastExecuted).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RulesPage() {
  const [summary, setSummary] = useState<RuleSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules')
      if (!response.ok) {
        throw new Error('Failed to fetch rules data')
      }
      const data = await response.json()
      setSummary(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching rules:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRules()
  }

  useEffect(() => {
    fetchRules()
  }, [])

  // 按層級分組規則
  const rulesByLevel = summary ? {
    RED: summary.rules.filter(r => r.level === 'RED'),
    YELLOW: summary.rules.filter(r => r.level === 'YELLOW'), 
    GREEN: summary.rules.filter(r => r.level === 'GREEN')
  } : { RED: [], YELLOW: [], GREEN: [] }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-500/[0.04] rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 py-12 sm:py-20">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-sm font-bold text-white hover:scale-105 transition-transform"
              >
                R
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  Rules Dashboard
                </h1>
                <p className="text-foreground-muted text-xs sm:text-sm">規則合規性儀表板</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 bg-muted border border-border text-foreground-muted hover:bg-accent disabled:opacity-50"
              >
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? '掃描中...' : '重新掃描'}
              </button>
              <Link 
                href="/" 
                className="text-xs sm:text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                ← Back to Hub
              </Link>
            </div>
          </div>

          {/* 統計概覽 */}
          {loading ? (
            <div className="text-center text-foreground-muted py-8">正在載入規則數據...</div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">
              <XCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="mb-2">載入失敗: {error}</p>
              <button
                onClick={handleRefresh}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                重新載入
              </button>
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* 合規率圓餅圖 */}
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <ComplianceChart summary={summary} />
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-300 mb-2">整體合規率</div>
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp size={14} color={summary.complianceRate >= 80 ? '#10b981' : summary.complianceRate >= 60 ? '#f59e0b' : '#ef4444'} />
                      <span className={`text-sm font-semibold ${
                        summary.complianceRate >= 80 ? 'text-green-400' :
                        summary.complianceRate >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {summary.complianceRate >= 80 ? '良好' :
                         summary.complianceRate >= 60 ? '中等' : '需改善'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 完整綁定 */}
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={24} color="#10b981" />
                  <div>
                    <div className="text-2xl font-bold text-green-400">{summary.completeBinding}</div>
                    <div className="text-xs text-green-300">完整綁定</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {summary.totalRules > 0 ? Math.round((summary.completeBinding / summary.totalRules) * 100) : 0}% 規則完整
                </div>
              </div>

              {/* 部分綁定 */}
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle size={24} color="#f59e0b" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{summary.partialBinding}</div>
                    <div className="text-xs text-yellow-300">部分綁定</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">需要完善執行要素</div>
              </div>

              {/* Dead Rules */}
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle size={24} color="#ef4444" />
                  <div>
                    <div className="text-2xl font-bold text-red-400">{summary.deadRules}</div>
                    <div className="text-xs text-red-300">Dead Rules</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">無執行綁定</div>
              </div>
            </div>
          ) : null}
        </header>

        {/* 規則列表 */}
        {summary && (
          <div className="space-y-8">
            {/* 紅級規則 */}
            {rulesByLevel.RED.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-red-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-red-400">
                    {levelConfig.RED.icon} 紅級規則 ({rulesByLevel.RED.length})
                  </h2>
                  <div className="text-xs text-gray-500">— {levelConfig.RED.description}</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rulesByLevel.RED.map(rule => (
                    <RuleCard key={rule.name} rule={rule} />
                  ))}
                </div>
              </section>
            )}

            {/* 黃級規則 */}
            {rulesByLevel.YELLOW.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-yellow-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-yellow-400">
                    {levelConfig.YELLOW.icon} 黃級規則 ({rulesByLevel.YELLOW.length})
                  </h2>
                  <div className="text-xs text-gray-500">— {levelConfig.YELLOW.description}</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rulesByLevel.YELLOW.map(rule => (
                    <RuleCard key={rule.name} rule={rule} />
                  ))}
                </div>
              </section>
            )}

            {/* 綠級規則 */}
            {rulesByLevel.GREEN.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-green-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-green-400">
                    {levelConfig.GREEN.icon} 綠級規則 ({rulesByLevel.GREEN.length})
                  </h2>
                  <div className="text-xs text-gray-500">— {levelConfig.GREEN.description}</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rulesByLevel.GREEN.map(rule => (
                    <RuleCard key={rule.name} rule={rule} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 空狀態 */}
        {summary && summary.totalRules === 0 && (
          <div className="text-center py-12">
            <Shield size={48} className="mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">沒有找到規則</h3>
            <p className="text-sm text-gray-500 mb-4">請確認 ~/clawd/shared/processes 目錄中有 SOP 文件</p>
            <button
              onClick={handleRefresh}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              重新掃描
            </button>
          </div>
        )}

        {/* 最後掃描時間 */}
        {summary && (
          <div className="mt-8 text-center text-xs text-gray-500">
            最後掃描: {new Date(summary.lastScanTime).toLocaleString()}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-14 text-center text-foreground-subtle text-xs tracking-wide">
          William Hub v2 — Rules Dashboard
        </footer>
      </div>
    </main>
  )
}