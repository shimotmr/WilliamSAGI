'use client'

import { useState, useEffect } from 'react'
import { MermaidBlock } from '@/components/MermaidBlock'

// ─── Types ───
type Severity = 'P0' | 'P1' | 'P2'
type FixStatus = 'fixed' | 'partial' | 'pending' | 'in-progress'

interface Issue {
  id: string
  title: string
  severity: Severity
  file?: string
  description: string
  fix?: string
  status: FixStatus
  rate?: string
}

interface LibModule {
  name: string
  callers: string[]
  adoption: string
  necessity: '高度必要' | '必要' | '有用但非必要'
  description: string
}

// ─── Data ───
const auditMeta = {
  date: '2026-03-27',
  scope: '~/clawd/scripts/ 活躍腳本（25+ 核心深度審閱）',
  sources: ['Opus (#1306)', 'Grok (#1307)', '資料收集 (#1308)'],
  tasks: '#3847 - #3864',
}

const issues: Issue[] = [
  // P0
  { id: 'P0-1', title: 'LINE Token 明文硬碼', severity: 'P0', file: 'line_performance_alert.py:21-22', description: 'LINE Channel Access Token 直接硬碼在原始碼中，未使用 credentials/', fix: '改用 get_credential("line")', status: 'fixed', rate: '100%' },
  { id: 'P0-2', title: 'auto_dispatch 未定義變數', severity: 'P0', file: 'auto_dispatch.sh', description: 'Python 嵌入區塊引用 ASSIGNEE_MODELS、_FALLBACK_MODEL 等未定義變數', fix: '統一變數名、獨立完整定義', status: 'fixed', rate: '95%' },
  { id: 'P0-3', title: 'acceptance_gate shell injection', severity: 'P0', file: 'acceptance_gate.py:47', description: 'shell=True + 未跳脫 SQL，任務標題含特殊字元可能命令注入', fix: '改用列表形式 subprocess.run + stdin', status: 'fixed', rate: '100%' },
  { id: 'P0-4', title: 'budget_monitor shell injection', severity: 'P0', file: 'budget_monitor.py:23', description: 'shell=True + f-string SQL，雙引號未跳脫', fix: '改用 subprocess.run stdin 模式', status: 'fixed', rate: '100%' },
  { id: 'P0-5', title: 'watchdog 與 stuck_check 衝突', severity: 'P0', file: '多腳本', description: 'updated_at 被多處更新，破壞 §11 雙重驗證邏輯', fix: 'lock_manager 統一 + session_validator', status: 'partial', rate: '85%' },
  { id: 'P0-6', title: 'spawn 無 feedback 機制', severity: 'P0', file: 'create_task.sh', description: 'INSERT 後假設 spawn 成功，無驗證', fix: '加入 post-spawn verification', status: 'in-progress' },
  // P1
  { id: 'P1-1', title: '232 個 subprocess 缺少 timeout', severity: 'P1', file: '全系統', description: '外部命令掛起時腳本永久阻塞', fix: '統一加 timeout=60/120/300', status: 'partial', rate: '65%' },
  { id: 'P1-2', title: '13 個 requests 缺少 timeout', severity: 'P1', file: '多檔案', description: 'requests.post()/get() 無 timeout', fix: '統一加 timeout=30', status: 'partial', rate: '70%' },
  { id: 'P1-3', title: 'auto_audit 靜默失敗', severity: 'P1', file: 'auto_audit_script.py:567', description: 'except: pass 吞掉通知失敗', fix: 'logging.warning()', status: 'fixed', rate: '100%' },
  { id: 'P1-4', title: 'model_router 硬碼模型', severity: 'P1', file: 'model_router.py', description: '模型名稱和成本全部硬碼，與 config 脫鉤', fix: '從 model_defaults.json 讀取', status: 'pending' },
  { id: 'P1-5', title: 'acceptance_gate 硬碼模型', severity: 'P1', file: 'acceptance_gate.py:28-35', description: 'VERIFY_MODEL_MAP 硬碼', fix: '讀取 model_defaults.json', status: 'pending' },
  { id: 'P1-6', title: 'task_complete.py 過度耦合', severity: 'P1', file: 'task_complete.py (425行)', description: '12 步驟串聯，單點故障風險', fix: '非核心步驟移至背景', status: 'in-progress' },
  { id: 'P1-7', title: '重複 EMERGENCY_STOP 檢查', severity: 'P1', file: '>15 處', description: '幾乎所有腳本重複相同檢查', fix: 'lib/guard.py 統一', status: 'partial', rate: '80%' },
  // P2
  { id: 'P2-1', title: '建立 lib/common.sh 統一模組', severity: 'P2', description: '所有腳本改用 source lib/common.sh', status: 'in-progress' },
  { id: 'P2-2', title: '合併 watchdog + stuck_check', severity: 'P2', description: '合併成 heartbeat_master.sh', status: 'pending' },
  { id: 'P2-3', title: '移除 shell/Python 雙版本', severity: 'P2', description: '統一用 Python 核心邏輯', status: 'pending' },
]

const libModules: LibModule[] = [
  { name: 'lock_manager.sh', callers: ['auto_dispatch.sh', 'heartbeat_stuck_check.sh', 'emergency_stop.sh', 'gateway_safe_restart.sh'], adoption: '~40%', necessity: '高度必要', description: '防止 dispatch 與 stuck_check 競態條件' },
  { name: 'notification.py', callers: ['task_complete.py', 'auto_audit_script.py', 'budget_monitor.py', 'notify_telegram.sh'], adoption: '~65%', necessity: '必要', description: '統一錯誤處理與 token cache' },
  { name: 'guard.py', callers: ['大多數 Python 腳本 (decorator)'], adoption: '~80%', necessity: '必要', description: '集中緊急停止邏輯' },
  { name: 'supabase_client.py', callers: ['task_complete.py', 'acceptance_gate.py', 'budget_monitor.py'], adoption: '~55%', necessity: '高度必要', description: '統一 env 變數與錯誤處理' },
  { name: 'session_validator.py', callers: ['heartbeat_stuck_check.sh'], adoption: '低', necessity: '有用但非必要', description: '確認 subagent session 存活' },
  { name: 'prompt_sanitizer.py', callers: ['auto_dispatch.sh'], adoption: '低', necessity: '有用但非必要', description: '防護 shell 截斷' },
]

const testPlan = {
  fixRate: 92,
  breakdown: { 'Shell injection': 100, 'Undefined var': 95, 'updated_at 衝突': 85 },
}

const chapters = [
  { id: 'overview', title: '§1 審計概覽', icon: '📊' },
  { id: 'p0-issues', title: '§2 P0 問題', icon: '🔴' },
  { id: 'p1-p2-issues', title: '§3 P1/P2 問題', icon: '🟠' },
  { id: 'lib-modules', title: '§4 Lib 模組分析', icon: '📦' },
  { id: 'flow-diagrams', title: '§5 流程圖', icon: '🔄' },
  { id: 'module-graph', title: '§6 模組關係圖', icon: '🕸️' },
]

// ─── Helpers ───
const severityColor: Record<Severity, string> = {
  P0: 'bg-red-500/20 text-red-400 border-red-500/30',
  P1: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  P2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const statusConfig: Record<FixStatus, { label: string; color: string }> = {
  fixed: { label: '✅ 已修復', color: 'bg-emerald-500/20 text-emerald-400' },
  partial: { label: '🔧 部分修復', color: 'bg-amber-500/20 text-amber-400' },
  'in-progress': { label: '⏳ 進行中', color: 'bg-blue-500/20 text-blue-400' },
  pending: { label: '⬚ 待處理', color: 'bg-zinc-500/20 text-zinc-400' },
}

const necessityColor: Record<string, string> = {
  '高度必要': 'text-red-400',
  '必要': 'text-orange-400',
  '有用但非必要': 'text-zinc-400',
}

// ─── Mermaid charts ───
const flowchartDispatch = `flowchart TD
  A[讀取 DB 待執行任務] --> B{prompt_sanitizer<br/>驗證}
  B -->|通過| C[寫入 /tmp/prompt-xxx.tmp]
  B -->|失敗| D[記錄錯誤 + 通知]
  C --> E[sessions_spawn]
  E --> F{post-spawn<br/>verification}
  F -->|成功| G[UPDATE status=執行中]
  F -->|失敗| H[重試 / fallback model]
  G --> I[lock_manager 釋放]
  H --> I

  style A fill:#1e293b,stroke:#6d28d9,color:#e2e8f0
  style B fill:#1e293b,stroke:#a78bfa,color:#e2e8f0
  style C fill:#1e293b,stroke:#6d28d9,color:#e2e8f0
  style D fill:#451a1a,stroke:#ef4444,color:#fca5a5
  style E fill:#1e293b,stroke:#6d28d9,color:#e2e8f0
  style F fill:#1e293b,stroke:#a78bfa,color:#e2e8f0
  style G fill:#1a2e1a,stroke:#22c55e,color:#86efac
  style H fill:#2e1a1a,stroke:#f59e0b,color:#fcd34d
  style I fill:#1e293b,stroke:#6d28d9,color:#e2e8f0`

const flowchartHeartbeat = `flowchart TD
  A[Heartbeat 觸發] --> B[查詢 updated_at > 30min]
  B --> C{acquire_lock}
  C -->|取得| D[session_validator<br/>檢查 subagent]
  C -->|鎖定中| E[跳過本輪]
  D -->|存活| F[更新 updated_at]
  D -->|死亡| G[重置為待執行]
  F --> H[release_lock]
  G --> H

  style A fill:#1e293b,stroke:#6d28d9,color:#e2e8f0
  style B fill:#1e293b,stroke:#6d28d9,color:#e2e8f0
  style C fill:#1e293b,stroke:#a78bfa,color:#e2e8f0
  style D fill:#1e293b,stroke:#a78bfa,color:#e2e8f0
  style E fill:#1e293b,stroke:#94a3b8,color:#94a3b8
  style F fill:#1a2e1a,stroke:#22c55e,color:#86efac
  style G fill:#2e1a1a,stroke:#f59e0b,color:#fcd34d
  style H fill:#1e293b,stroke:#6d28d9,color:#e2e8f0`

const moduleGraph = `graph LR
  subgraph Scripts
    AD[auto_dispatch.sh]
    HSC[heartbeat_stuck_check.sh]
    TC[task_complete.py]
    AG[acceptance_gate.py]
    BM[budget_monitor.py]
    ES[emergency_stop.sh]
    GR[gateway_safe_restart.sh]
    NT[notify_telegram.sh]
  end

  subgraph Lib
    LM[lock_manager.sh]
    NF[notification.py]
    GU[guard.py]
    SC[supabase_client.py]
    SV[session_validator.py]
    PS[prompt_sanitizer.py]
  end

  subgraph External
    DB[(Supabase)]
    TG[Telegram API]
    OC[OpenClaw CLI]
  end

  AD --> LM
  AD --> PS
  HSC --> LM
  HSC --> SV
  ES --> LM
  GR --> LM
  TC --> NF
  TC --> SC
  TC --> GU
  AG --> SC
  AG --> GU
  BM --> NF
  BM --> SC
  NT --> NF
  SC --> DB
  NF --> TG
  SV --> OC

  style LM fill:#6d28d9,stroke:#a78bfa,color:#fff
  style NF fill:#6d28d9,stroke:#a78bfa,color:#fff
  style GU fill:#6d28d9,stroke:#a78bfa,color:#fff
  style SC fill:#6d28d9,stroke:#a78bfa,color:#fff
  style SV fill:#4a1d96,stroke:#7c3aed,color:#c4b5fd
  style PS fill:#4a1d96,stroke:#7c3aed,color:#c4b5fd
  style DB fill:#1e293b,stroke:#38bdf8,color:#7dd3fc
  style TG fill:#1e293b,stroke:#38bdf8,color:#7dd3fc
  style OC fill:#1e293b,stroke:#38bdf8,color:#7dd3fc`

// ─── Component ───
export default function AuditV45Page() {
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    )
    chapters.forEach(ch => {
      const el = document.getElementById(ch.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const p0 = issues.filter(i => i.severity === 'P0')
  const p1 = issues.filter(i => i.severity === 'P1')
  const p2 = issues.filter(i => i.severity === 'P2')
  const fixed = issues.filter(i => i.status === 'fixed').length
  const partial = issues.filter(i => i.status === 'partial').length

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-zinc-100">
      {/* ─── Left Nav (desktop) ─── */}
      <nav className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-zinc-800 lg:bg-[#0d0d1f] lg:pt-8 lg:px-4 z-50">
        <div className="mb-8">
          <h2 className="text-sm font-bold text-violet-400 uppercase tracking-wider">v4.5 系統審計</h2>
          <p className="text-xs text-zinc-500 mt-1">{auditMeta.date}</p>
        </div>
        <ul className="space-y-1 flex-1">
          {chapters.map(ch => (
            <li key={ch.id}>
              <a
                href={`#${ch.id}`}
                onClick={(e) => { e.preventDefault(); document.getElementById(ch.id)?.scrollIntoView({ behavior: 'smooth' }) }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeSection === ch.id
                    ? 'bg-violet-500/15 text-violet-300 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span>{ch.icon}</span>
                <span>{ch.title}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="pb-6 text-xs text-zinc-600">
          報告來源：{auditMeta.sources.join('、')}
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="lg:ml-64 max-w-5xl mx-auto px-4 sm:px-8 py-8 pb-24">
        {/* Mobile header */}
        <div className="lg:hidden mb-6">
          <h1 className="text-xl font-bold text-violet-400">v4.5 系統審計報告</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            {chapters.map(ch => (
              <a key={ch.id} href={`#${ch.id}`} className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-violet-300">
                {ch.icon} {ch.title.replace(/§\d+ /, '')}
              </a>
            ))}
          </div>
        </div>

        {/* ─── §1 Overview ─── */}
        <section id="overview" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-violet-400">§1</span> 審計概覽
          </h2>

          {/* Status cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="P0 問題" value={p0.length} color="text-red-400" bg="bg-red-500/10 border-red-500/20" />
            <StatCard label="P1 問題" value={p1.length} color="text-orange-400" bg="bg-orange-500/10 border-orange-500/20" />
            <StatCard label="P2 改善" value={p2.length} color="text-blue-400" bg="bg-blue-500/10 border-blue-500/20" />
            <StatCard
              label="修復完成率"
              value={`${Math.round(((fixed + partial * 0.5) / issues.length) * 100)}%`}
              color="text-emerald-400"
              bg="bg-emerald-500/10 border-emerald-500/20"
            />
          </div>

          {/* Test coverage */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">E2E 測試覆蓋率</h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full transition-all" style={{ width: `${testPlan.fixRate}%` }} />
              </div>
              <span className="text-lg font-bold text-emerald-400">{testPlan.fixRate}%</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {Object.entries(testPlan.breakdown).map(([k, v]) => (
                <div key={k} className="flex justify-between bg-zinc-800/50 px-3 py-2 rounded">
                  <span className="text-zinc-400">{k}</span>
                  <span className={v >= 95 ? 'text-emerald-400' : 'text-amber-400'}>{v}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-zinc-500 space-y-1">
            <p>📁 審計範圍：{auditMeta.scope}</p>
            <p>🔧 相關修復任務：{auditMeta.tasks}</p>
            <p>📄 來源報告：{auditMeta.sources.join('、')}</p>
          </div>
        </section>

        {/* ─── §2 P0 Issues ─── */}
        <section id="p0-issues" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-red-400">§2</span> P0 問題（系統停擺風險）
          </h2>
          <div className="space-y-4">
            {p0.map(issue => <IssueCard key={issue.id} issue={issue} />)}
          </div>
        </section>

        {/* ─── §3 P1/P2 ─── */}
        <section id="p1-p2-issues" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-orange-400">§3</span> P1/P2 問題
          </h2>

          <h3 className="text-lg font-semibold text-orange-400 mb-3">P1 可靠性問題</h3>
          <div className="space-y-3 mb-8">
            {p1.map(issue => <IssueCard key={issue.id} issue={issue} compact />)}
          </div>

          <h3 className="text-lg font-semibold text-blue-400 mb-3">P2 改善建議</h3>
          <div className="space-y-3">
            {p2.map(issue => <IssueCard key={issue.id} issue={issue} compact />)}
          </div>
        </section>

        {/* ─── §4 Lib Modules ─── */}
        <section id="lib-modules" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-violet-400">§4</span> Lib 模組分析
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-left">
                  <th className="py-3 px-4 text-zinc-400 font-medium">模組</th>
                  <th className="py-3 px-4 text-zinc-400 font-medium">必要性</th>
                  <th className="py-3 px-4 text-zinc-400 font-medium">採用率</th>
                  <th className="py-3 px-4 text-zinc-400 font-medium hidden md:table-cell">說明</th>
                  <th className="py-3 px-4 text-zinc-400 font-medium hidden lg:table-cell">Callers</th>
                </tr>
              </thead>
              <tbody>
                {libModules.map(m => (
                  <tr key={m.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-violet-300 text-xs">{m.name}</td>
                    <td className={`py-3 px-4 font-medium ${necessityColor[m.necessity]}`}>{m.necessity}</td>
                    <td className="py-3 px-4 text-zinc-300">{m.adoption}</td>
                    <td className="py-3 px-4 text-zinc-400 hidden md:table-cell">{m.description}</td>
                    <td className="py-3 px-4 text-zinc-500 text-xs hidden lg:table-cell">{m.callers.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500 mt-4">
            結論：lock_manager、supabase_client、notification、guard 為<span className="text-red-400">必要合併</span>；
            session_validator、prompt_sanitizer 為有用但非必要的優化。
          </p>
        </section>

        {/* ─── §5 Flow Diagrams ─── */}
        <section id="flow-diagrams" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-violet-400">§5</span> 流程圖
          </h2>

          <div className="space-y-8">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">auto_dispatch spawn 流程（修改後）</h3>
              <MermaidBlock code={flowchartDispatch} />
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">heartbeat_stuck_check 流程（修改後）</h3>
              <MermaidBlock code={flowchartHeartbeat} />
            </div>
          </div>
        </section>

        {/* ─── §6 Module Graph ─── */}
        <section id="module-graph" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-violet-400">§6</span> 模組關係圖
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <MermaidBlock code={moduleGraph} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-600 inline-block" /> 核心 Lib（必要）</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-900 inline-block" /> 輔助 Lib（非必要）</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-zinc-700 inline-block" /> 外部服務</span>
          </div>
        </section>

        {/* ─── Task Status Table ─── */}
        <section className="mb-16">
          <h2 className="text-xl font-bold mb-4 text-zinc-300">任務完成狀態總覽</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-left">
                  <th className="py-2 px-3 text-zinc-400 font-medium">ID</th>
                  <th className="py-2 px-3 text-zinc-400 font-medium">問題</th>
                  <th className="py-2 px-3 text-zinc-400 font-medium">等級</th>
                  <th className="py-2 px-3 text-zinc-400 font-medium">狀態</th>
                  <th className="py-2 px-3 text-zinc-400 font-medium hidden sm:table-cell">修復率</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => (
                  <tr key={issue.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2 px-3 font-mono text-xs text-zinc-500">{issue.id}</td>
                    <td className="py-2 px-3 text-zinc-300">{issue.title}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${severityColor[issue.severity]}`}>{issue.severity}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${statusConfig[issue.status].color}`}>
                        {statusConfig[issue.status].label}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-zinc-400 hidden sm:table-cell">{issue.rate || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800 pt-6 text-xs text-zinc-600 text-center">
          WilliamSAGI v4.5 System Audit Report · Generated {auditMeta.date} · Reports #1306 #1307 #1308
        </footer>
      </main>
    </div>
  )
}

// ─── Sub-components ───
function StatCard({ label, value, color, bg }: { label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function IssueCard({ issue, compact }: { issue: Issue; compact?: boolean }) {
  const [open, setOpen] = useState(!compact)
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden transition-all ${compact ? '' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${severityColor[issue.severity]}`}>{issue.severity}</span>
          <span className="font-medium text-zinc-200 truncate">{issue.id}: {issue.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-xs px-2 py-0.5 rounded ${statusConfig[issue.status].color}`}>
            {statusConfig[issue.status].label}
          </span>
          <span className="text-zinc-600 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm space-y-2 border-t border-zinc-800/50 pt-3">
          {issue.file && <p className="text-xs font-mono text-zinc-500">📁 {issue.file}</p>}
          <p className="text-zinc-400">{issue.description}</p>
          {issue.fix && <p className="text-zinc-400"><span className="text-emerald-400">修復：</span>{issue.fix}</p>}
          {issue.rate && <p className="text-zinc-400"><span className="text-violet-400">修復率：</span>{issue.rate}</p>}
        </div>
      )}
    </div>
  )
}
