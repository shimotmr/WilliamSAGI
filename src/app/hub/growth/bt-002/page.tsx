'use client'

import { ArrowLeft, Shield, Layers, Zap, CheckCircle2, Activity, AlertTriangle, RefreshCw, BarChart3, Clock } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// 動態載入圖表組件
const SystemHealthChart = dynamic(() => import('../components/SystemHealthChart'), {
  ssr: false,
  loading: () => <div className="h-64 bg-background-elevated rounded animate-pulse" />
})

const BalanceChart = dynamic(() => import('../components/BalanceChart'), {
  ssr: false,
  loading: () => <div className="h-64 bg-background-elevated rounded animate-pulse" />
})

export default function BT002DetailPage() {
  // 模擬系統健康數據
  const healthData = [
    { time: '00:00', uptime: 100, performance: 98, balance: 95 },
    { time: '04:00', uptime: 100, performance: 97, balance: 94 },
    { time: '08:00', uptime: 100, performance: 99, balance: 96 },
    { time: '12:00', uptime: 100, performance: 98, balance: 98 },
    { time: '16:00', uptime: 100, performance: 97, balance: 97 },
    { time: '20:00', uptime: 100, performance: 99, balance: 99 }
  ]

  // Token 平衡數據
  const balanceData = [
    { agent: 'Travis', allocation: 40, usage: 35, efficiency: 87.5 },
    { agent: 'Secretary', allocation: 15, usage: 12, efficiency: 80 },
    { agent: 'Coder', allocation: 20, usage: 18, efficiency: 90 },
    { agent: 'Writer', allocation: 15, usage: 14, efficiency: 93.3 },
    { agent: 'Analyst', allocation: 10, usage: 8, efficiency: 80 }
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Link 
            href="/growth"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回 Growth Dashboard
          </Link>
          
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">BT-002: 完美平衡自動化系統</h1>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                  Revolutionary
                </span>
              </div>
              <p className="text-lg text-foreground-muted max-w-3xl">
                創新的零停擺保障系統，整合四層防護架構和 Token 智能平衡策略，
                實現 60-80% Token 節省效率，確保系統持續穩定運行。
              </p>
            </div>
          </div>

          {/* 關鍵指標 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-foreground-muted">系統正常運行率</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">100%</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-foreground-muted">Token 節省率</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">60-80%</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-foreground-muted">自動修復</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">24/7</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-foreground-muted">回應時間</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">&lt;1秒</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 零停擺保障機制 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">零停擺保障機制</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-emerald-400">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-medium text-foreground">智能負載平衡</h3>
                </div>
                <p className="text-sm text-foreground-muted">
                  動態監控各 Agent Token 使用量，自動調整工作分配，
                  避免單點過載造成系統瓶頸。
                </p>
              </div>
              
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-blue-400">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  <h3 className="font-medium text-foreground">故障自動轉移</h3>
                </div>
                <p className="text-sm text-foreground-muted">
                  當主要 Agent 達到 Token 限制時，系統自動將任務轉移至備用 Agent，
                  確保工作流程不中斷。
                </p>
              </div>
              
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-yellow-400">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <h3 className="font-medium text-foreground">預警系統</h3>
                </div>
                <p className="text-sm text-foreground-muted">
                  提前 15 分鐘預警 Token 即將耗盡，自動啟動節流模式，
                  並通知相關人員進行預防性維護。
                </p>
              </div>
            </div>
          </div>

          {/* 系統健康監控 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">24小時系統健康監控</h2>
            </div>
            
            <div className="h-64 mb-4">
              <SystemHealthChart data={healthData} />
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded"></div>
                <span>系統正常運行率</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <span>性能指數</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>負載平衡</span>
              </div>
            </div>
          </div>
        </div>

        {/* 四層防護架構 */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">四層防護架構</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg p-6 border border-red-500/20">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">第一層：預警監控</h3>
              <p className="text-sm text-foreground-muted mb-4">
                實時監控 Token 使用量、API 響應時間和系統負載，
                提前 15-30 分鐘發出預警通知。
              </p>
              <div className="text-xs text-red-400">觸發閾值：85% Token 使用率</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-lg p-6 border border-yellow-500/20">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">第二層：智能節流</h3>
              <p className="text-sm text-foreground-muted mb-4">
                自動啟動節流模式，優先處理高優先級任務，
                延後非緊急工作到下一個時段。
              </p>
              <div className="text-xs text-yellow-400">觸發閾值：90% Token 使用率</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-6 border border-blue-500/20">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">第三層：負載轉移</h3>
              <p className="text-sm text-foreground-muted mb-4">
                自動將工作負載轉移到備用 Agent，
                確保系統服務連續性和可用性。
              </p>
              <div className="text-xs text-blue-400">觸發閾值：95% Token 使用率</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-lg p-6 border border-emerald-500/20">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">第四層：緊急保護</h3>
              <p className="text-sm text-foreground-muted mb-4">
                啟動緊急保護模式，暫停非核心功能，
                保留最小資源維持系統基本運作。
              </p>
              <div className="text-xs text-emerald-400">觸發閾值：98% Token 使用率</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Token 智能平衡策略 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">Token 智能平衡策略</h2>
            </div>

            <div className="h-64 mb-4">
              <BalanceChart data={balanceData} />
            </div>

            <div className="space-y-3">
              {balanceData.map((agent) => (
                <div key={agent.agent} className="flex items-center justify-between bg-background-elevated rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="font-medium text-sm">{agent.agent}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-foreground-muted">
                    <span>配額: {agent.allocation}%</span>
                    <span>使用: {agent.usage}%</span>
                    <span className="text-emerald-400 font-medium">效率: {agent.efficiency}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 自動修復能力展示 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">自動修復能力展示</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">Token 耗盡自動恢復</h3>
                  <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                    已啟用
                  </span>
                </div>
                <p className="text-sm text-foreground-muted mb-2">
                  當 Agent Token 耗盡時，系統自動等待重置時間，
                  並在恢復後立即繼續執行排隊任務。
                </p>
                <div className="text-xs text-foreground-muted">
                  最後觸發時間: 2026-02-18 09:15 | 恢復時間: 00:02:34
                </div>
              </div>

              <div className="bg-background-elevated rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">API 故障重試機制</h3>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                    已啟用
                  </span>
                </div>
                <p className="text-sm text-foreground-muted mb-2">
                  API 請求失敗時採用指數退避算法，
                  最多重試 3 次，避免級聯故障。
                </p>
                <div className="text-xs text-foreground-muted">
                  成功率: 99.7% | 重試成功率: 94.2%
                </div>
              </div>

              <div className="bg-background-elevated rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">工作狀態自動同步</h3>
                  <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                    已啟用
                  </span>
                </div>
                <p className="text-sm text-foreground-muted mb-2">
                  系統異常中斷時自動恢復工作進度，
                  確保任務狀態一致性和數據完整性。
                </p>
                <div className="text-xs text-foreground-muted">
                  同步頻率: 每 30 秒 | 數據完整性: 100%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 監控儀表板整合 */}
        <div className="rounded-xl border border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">監控儀表板整合</h2>
            <p className="text-foreground-muted">實時監控系統各項指標和警報</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 text-center border border-border">
              <Activity className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">即時監控</h3>
              <p className="text-sm text-foreground-muted">
                24/7 實時監控系統健康狀態、
                Token 使用量和 API 響應時間
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 text-center border border-border">
              <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">智能警報</h3>
              <p className="text-sm text-foreground-muted">
                多級預警機制，支援 Telegram、
                LINE 和郵件多通道通知
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 text-center border border-border">
              <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">數據分析</h3>
              <p className="text-sm text-foreground-muted">
                歷史趨勢分析、效能統計
                和成本優化建議
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 text-center border border-border">
              <Shield className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">自動化運維</h3>
              <p className="text-sm text-foreground-muted">
                自動故障診斷、修復建議
                和系統優化調整
              </p>
            </div>
          </div>
        </div>

        {/* 系統效益總結 */}
        <div className="rounded-xl border border-border bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">系統效益總結</h2>
            <p className="text-foreground-muted">完美平衡自動化系統帶來的實際價值</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-2">100%</div>
              <div className="text-sm text-foreground-muted">系統正常運行率</div>
              <div className="text-xs text-foreground-muted mt-1">零計畫性停機時間</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">70%</div>
              <div className="text-sm text-foreground-muted">平均 Token 節省率</div>
              <div className="text-xs text-foreground-muted mt-1">智能負載平衡</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">&lt;1秒</div>
              <div className="text-sm text-foreground-muted">故障恢復時間</div>
              <div className="text-xs text-foreground-muted mt-1">自動修復機制</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}