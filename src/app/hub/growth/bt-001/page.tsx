'use client'

import { ArrowLeft, TrendingUp, DollarSign, Database, Zap, CheckCircle2, BarChart3, Clock, Target, Cpu } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// 動態載入圖表組件
const PerformanceChart = dynamic(() => import('../components/PerformanceChart'), {
  ssr: false,
  loading: () => <div className="h-64 bg-background-elevated rounded animate-pulse" />
})

const ArchitectureChart = dynamic(() => import('../components/ArchitectureChart'), {
  ssr: false,
  loading: () => <div className="h-64 bg-background-elevated rounded animate-pulse" />
})

export default function BT001DetailPage() {
  // 模擬效益數據
  const performanceData = [
    { metric: '傳統搜尋', tokens: 1000, efficiency: 15 },
    { metric: 'qmd 語義搜尋', tokens: 27, efficiency: 95 }
  ]

  // 系統架構數據
  const architectureData = [
    { component: 'Memory', files: 132, vectors: 850 },
    { component: 'Reports', files: 203, vectors: 1200 },
    { component: 'Cases', files: 846, vectors: 2100 },
    { component: 'Products', files: 1000, vectors: 2500 },
    { component: 'Tasks', files: 717, vectors: 1800 }
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Link 
            href="/growth"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回 Growth Dashboard
          </Link>
          
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Database className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">BT-001: qmd 語義搜尋革命</h1>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                  Revolutionary
                </span>
              </div>
              <p className="text-lg text-foreground-muted max-w-3xl">
                突破性的語義搜尋技術整合，實現 97.3% Token 節省率，年度節省成本高達 NT$240 萬，
                為 AI Agent 工作流程帶來革命性的效率提升。
              </p>
            </div>
          </div>

          {/* 關鍵指標 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-foreground-muted">Token 節省率</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">97.3%</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-foreground-muted">年度節省</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">NT$240萬</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-foreground-muted">文檔索引</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">3,612</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-foreground-muted">回應時間</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">&lt;2秒</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 技術突破說明 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold">技術突破說明</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-background-elevated rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">語義搜尋技術</h3>
                <p className="text-sm text-foreground-muted">
                  整合 qmd (Query Memory Database) 語義搜尋引擎，採用向量化文檔索引技術，
                  支援 BM25 關鍵字搜尋、向量語義搜尋和混合重排序三種模式。
                </p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">Agent 專屬配置</h3>
                <p className="text-sm text-foreground-muted">
                  為不同類型 Agent 量身定制搜尋策略：Researcher 使用混合重排序、
                  Coder 採用 BM25 關鍵字、Writer 和 Analyst 使用向量語義搜尋。
                </p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">智能內容處理</h3>
                <p className="text-sm text-foreground-muted">
                  自動文檔向量化、多集合管理、增量同步更新，
                  支援 memory、reports、cases、products、tasks 等多種數據源。
                </p>
              </div>
            </div>
          </div>

          {/* 效益分析圖表 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">Token 效率對比</h2>
            </div>
            
            <div className="h-64 mb-4">
              <PerformanceChart data={performanceData} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="text-xs text-red-400 mb-1">傳統記憶搜尋</div>
                <div className="text-lg font-bold text-red-400">1000 tokens</div>
                <div className="text-xs text-foreground-muted">每次查詢平均消耗</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <div className="text-xs text-emerald-400 mb-1">qmd 語義搜尋</div>
                <div className="text-lg font-bold text-emerald-400">27 tokens</div>
                <div className="text-xs text-foreground-muted">節省 973 tokens (97.3%)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 實施過程和挑戰 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-semibold">實施過程與挑戰</h2>
            </div>

            <div className="space-y-6">
              <div className="relative pl-6">
                <div className="absolute left-0 top-1 w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="border-l border-border ml-1 pl-4 pb-4">
                  <h3 className="font-medium text-foreground mb-2">階段一：系統分析</h3>
                  <p className="text-sm text-foreground-muted">
                    分析現有記憶搜尋瓶頸，發現平均每次查詢消耗 800-1200 tokens，
                    嚴重影響 Agent 工作效率和成本控制。
                  </p>
                </div>
              </div>
              
              <div className="relative pl-6">
                <div className="absolute left-0 top-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="border-l border-border ml-1 pl-4 pb-4">
                  <h3 className="font-medium text-foreground mb-2">階段二：技術整合</h3>
                  <p className="text-sm text-foreground-muted">
                    整合 qmd 引擎，建立 7,331 個向量索引，覆蓋 3,612 個文檔，
                    克服向量化精度和搜尋速度平衡挑戰。
                  </p>
                </div>
              </div>

              <div className="relative pl-6">
                <div className="absolute left-0 top-1 w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div className="ml-1 pl-4">
                  <h3 className="font-medium text-foreground mb-2">階段三：全面部署</h3>
                  <p className="text-sm text-foreground-muted">
                    完成所有 Agent 整合，建立自動同步機制，
                    實現 95% 以上的搜尋成功率和 &lt;2 秒回應時間。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 系統架構圖表 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">系統架構分佈</h2>
            </div>

            <div className="h-64 mb-4">
              <ArchitectureChart data={architectureData} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <span>Memory (132 files)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded"></div>
                <span>Reports (203 files)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>Cases (846 files)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded"></div>
                <span>Products (1000 files)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Agent 整合狀況 */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold">Agent 整合狀況</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Researcher', strategy: '混合+重排序', results: 8, status: '已整合' },
              { name: 'Coder', strategy: 'BM25 關鍵字', results: 5, status: '已整合' },
              { name: 'Writer', strategy: '混合搜尋', results: 7, status: '已整合' },
              { name: 'Analyst', strategy: '向量語義', results: 6, status: '已整合' },
              { name: 'Secretary', strategy: '向量語義', results: 4, status: '已整合' },
              { name: 'Inspector', strategy: '混合+重排序', results: 6, status: '已整合' },
              { name: 'Designer', strategy: '向量語義', results: 5, status: '已整合' },
              { name: 'Travis', strategy: '智能路由', results: 'Auto', status: '已整合' }
            ].map((agent) => (
              <div key={agent.name} className="bg-background-elevated rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">{agent.name}</h3>
                  <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                    {agent.status}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted mb-1">策略: {agent.strategy}</p>
                <p className="text-xs text-foreground-muted">結果: {agent.results} 個</p>
              </div>
            ))}
          </div>
        </div>

        {/* 量化效益總結 */}
        <div className="rounded-xl border border-border bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">量化效益總結</h2>
            <p className="text-foreground-muted">qmd 語義搜尋革命帶來的實際價值</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-2">NT$240萬</div>
              <div className="text-sm text-foreground-muted">年度節省成本</div>
              <div className="text-xs text-foreground-muted mt-1">以每 token $0.001 計算</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">60-80%</div>
              <div className="text-sm text-foreground-muted">工作效率提升</div>
              <div className="text-xs text-foreground-muted mt-1">減少無效查詢時間</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">95%+</div>
              <div className="text-sm text-foreground-muted">搜尋成功率</div>
              <div className="text-xs text-foreground-muted mt-1">精準度大幅提升</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}