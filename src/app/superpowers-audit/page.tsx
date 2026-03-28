'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Zap, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight,
  Star, TrendingUp, Layers, LayoutGrid, Shield, Cpu, Brain,
} from 'lucide-react'

/* ───────── tiny local helpers ───────── */

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${className}`}>
      {children}
    </span>
  )
}

function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h2 id={id} className="text-xl font-bold text-white mb-4">{children}</h2>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}>
      {children}
    </div>
  )
}

/* ───────── data ───────── */

const heroStats = [
  { label: 'Stars', value: '118K', icon: Star },
  { label: '爆紅週期', value: '90天', icon: TrendingUp },
  { label: '工作流階段', value: '四階段', icon: Layers },
  { label: '整合平台', value: '5個', icon: LayoutGrid },
]

const diagnosisCards = [
  { label: 'retry > 3 的任務', value: '47', unit: '個', color: 'text-amber-400' },
  { label: '最高 retry #3513', value: '1,004', unit: '次', color: 'text-red-400', emphasis: true },
  { label: '自動修復卡', value: '28', unit: '張', color: 'text-amber-400' },
  { label: 'Blake 完成率', value: '78.8', unit: '%', color: 'text-sky-400' },
]

const beforeAfter = {
  before: [
    { step: 'Blake 直接執行', detail: '收到任務後直接開始寫代碼' },
    { step: '無計劃鎖定', detail: '沒有書面計劃，想到哪做到哪' },
    { step: '無自我審查', detail: '做完就直接 task_complete，不回頭檢查' },
    { step: 'Retry 循環', detail: '失敗 → retry → 失敗 → retry → …（最高 1,004 次）' },
  ],
  after: [
    { step: 'Phase 1: Plan', detail: '書面計劃：做什麼、怎麼做、完成標準' },
    { step: 'Phase 2: 實作', detail: '按照計劃逐步實施，計劃鎖定不偏離' },
    { step: 'Phase 3: Self-Review', detail: '逐項檢查清單 ✅，自我驗證每個交付物' },
    { step: 'Phase 4: task_complete', detail: '通過審查後才標記完成，確保品質閘門' },
  ],
}

const taskMatrix = [
  { type: '前端頁面', plan: '✅', tdd: '⚠️', review: '✅', recommend: 'Plan + Review' },
  { type: 'API 開發', plan: '✅', tdd: '✅', review: '✅', recommend: '完整四階段' },
  { type: 'Bug 修復（已知）', plan: '❌', tdd: '❌', review: '✅', recommend: '僅 Review' },
  { type: '腳本小修', plan: '❌', tdd: '❌', review: '✅', recommend: '僅 Review' },
  { type: 'Rex 研究', plan: '✅', tdd: '❌', review: '✅', recommend: 'Plan + Review' },
]

const modelConclusions = [
  {
    model: 'Grok 4.20',
    role: '策略',
    color: 'border-orange-500/30 bg-orange-500/5',
    icon: Brain,
    iconColor: 'text-orange-400',
    points: [
      'B 方案高風險才用',
      'retry 1,004 次是出血點',
      '先 superpowers 再 ByteRover',
    ],
  },
  {
    model: 'Opus 4.6',
    role: '架構',
    color: 'border-violet-500/30 bg-violet-500/5',
    icon: Cpu,
    iconColor: 'text-violet-400',
    points: [
      '輕量 Plan + Review',
      'Brainstorm 多餘',
      'ACaT 取代 TDD',
      'worktree 不是現在',
    ],
  },
  {
    model: 'Sonnet',
    role: '安全',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    icon: Shield,
    iconColor: 'text-emerald-400',
    points: [
      '先審計再安裝',
      'AI Review 不誠實 P0',
      '118K stars 供應鏈風險',
    ],
  },
]

const scenarios = [
  { id: 8, priority: 'P0', color: 'bg-red-600 text-white', borderColor: 'border-red-500/30', title: 'AI 自我審查不誠實', detail: '雙重驗證機制：AI 的 self-review 結果必須經過獨立驗證。不能信任 AI 自我聲明「已完成」「已通過」。需要外部校驗層確認交付物符合規格。' },
  { id: 4, priority: 'P1', color: 'bg-orange-500 text-white', borderColor: 'border-orange-500/30', title: '緊急 bug 25 分鐘限制', detail: '緊急 bug 修復必須在 25 分鐘內完成。超時自動升級，觸發人工介入流程。避免 AI 陷入無限 retry 循環浪費時間。' },
  { id: 7, priority: 'P1', color: 'bg-orange-500 text-white', borderColor: 'border-orange-500/30', title: 'TDD 持續失敗禁止 complete', detail: '當 TDD 測試持續失敗超過 3 次，禁止調用 task_complete。必須先修復測試或升級問題，防止「假完成」。' },
  { id: 5, priority: 'P2', color: 'bg-yellow-500 text-black', borderColor: 'border-yellow-500/30', title: 'Brainstorm 偏離', detail: '在 Brainstorm 階段，如果產出偏離原始需求超過 30%，自動觸發回歸檢查。避免創意發散導致交付物不符。' },
  { id: 6, priority: 'P2', color: 'bg-yellow-500 text-black', borderColor: 'border-yellow-500/30', title: 'Plan 後不按計劃', detail: '制定 Plan 後實作階段偏離計劃超過 20%，觸發 Plan 審查。確保計劃不只是形式，而是真正的執行指南。' },
  { id: 1, priority: 'P3', color: 'bg-emerald-500 text-white', borderColor: 'border-emerald-500/30', title: '前端小任務', detail: '小型前端任務（< 30 分鐘）僅需 Review 階段。Plan 和 TDD 可選但不強制。降低流程開銷。' },
  { id: 3, priority: 'P3', color: 'bg-emerald-500 text-white', borderColor: 'border-emerald-500/30', title: 'Rex 研究', detail: 'Rex 研究任務需要 Plan + Review，但不需要 TDD。研究結果需要結構化輸出和可追溯的結論。' },
  { id: 2, priority: 'P3', color: 'bg-emerald-500 text-white', borderColor: 'border-emerald-500/30', title: 'API 標準開發', detail: 'API 開發任務必須執行完整四階段流程：Plan → 實作 → TDD → Self-Review → task_complete。' },
  { id: 9, priority: 'P3', color: 'bg-emerald-500 text-white', borderColor: 'border-emerald-500/30', title: '腳本小修快速路徑', detail: '腳本小修走快速路徑，僅需 Self-Review 通過即可完成。' },
  { id: 10, priority: 'P3', color: 'bg-emerald-500 text-white', borderColor: 'border-emerald-500/30', title: '多 Agent 協作', detail: '多 Agent 協作場景需要額外的同步 checkpoint，確保 Agent 間不會產生衝突修改。' },
]

const tokenCosts = [
  { mode: '完整四階段', perTask: '+5,000', perMonth: '+150K', note: '' },
  { mode: 'Plan + Review（建議）', perTask: '+2,500', perMonth: '+75K', note: '推薦' },
  { mode: '僅 Review', perTask: '+1,000', perMonth: '+30K', note: '' },
]

const timeline = [
  { week: '第 1 週', task: '安全審計代碼', dot: 'bg-red-500' },
  { week: '第 2 週', task: '1 個 P3 測試場景', dot: 'bg-orange-500' },
  { week: '第 3 週', task: '擴展 P2 場景', dot: 'bg-sky-500' },
  { week: '第 4 週', task: '評估決策', dot: 'bg-emerald-500' },
]

const consensus = [
  '先審計代碼安全再安裝',
  '先做 Plan + Review，不急四階段',
  '場景 8 必須獨立驗證（不信任 AI 自我聲明）',
]

/* ───────── page ───────── */

export default function SuperpowersAuditPage() {
  const [tab, setTab] = useState<'before' | 'after'>('before')
  const [openScenario, setOpenScenario] = useState<number | null>(8)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Link href="/hub/dashboard" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Zap size={20} className="text-amber-400" />
          <h1 className="text-lg font-bold text-white">Superpowers 審計</h1>
          <span className="ml-auto text-xs text-zinc-500">2026-03-28</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-8">
        {/* ── Hero ── */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            superpowers 工作流整合審計報告
          </h1>
          <p className="text-base text-zinc-400 max-w-2xl mx-auto">
            三模型審計 — <span className="text-violet-400 font-semibold">Opus 4.6 架構</span> × <span className="text-orange-400 font-semibold">Grok 4.20 策略</span> × <span className="text-emerald-400 font-semibold">Sonnet 安全</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
            {heroStats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                <s.icon size={18} className="mx-auto mb-1 text-zinc-500" />
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 問題診斷 ── */}
        <section>
          <SectionTitle>問題診斷</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {diagnosisCards.map((d) => (
              <Card key={d.label} className={d.emphasis ? 'border-red-500/30 bg-red-500/5' : ''}>
                <p className="text-sm text-zinc-400 mb-1">{d.label}</p>
                <p className={`font-black ${d.emphasis ? 'text-5xl' : 'text-3xl'} ${d.color}`}>
                  {d.value}<span className="text-base text-zinc-500 ml-1">{d.unit}</span>
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Before / After ── */}
        <section>
          <SectionTitle>Before / After 工作流</SectionTitle>
          <Card>
            <div className="flex gap-2 mb-5">
              {(['before', 'after'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                    tab === t ? 'bg-white text-black' : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                  }`}
                >
                  {t === 'before' ? 'Before' : 'After'}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {beforeAfter[tab].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    tab === 'before' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.step}</p>
                    <p className="text-sm text-zinc-400">{item.detail}</p>
                  </div>
                  {i < beforeAfter[tab].length - 1 && (
                    <ChevronRight size={14} className="mt-2 text-zinc-600 shrink-0 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ── 任務類型矩陣 ── */}
        <section>
          <SectionTitle>任務類型矩陣</SectionTitle>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-500">
                  <th className="pb-3 pr-4 font-medium">任務類型</th>
                  <th className="pb-3 pr-4 font-medium text-center">Plan</th>
                  <th className="pb-3 pr-4 font-medium text-center">TDD</th>
                  <th className="pb-3 pr-4 font-medium text-center">Review</th>
                  <th className="pb-3 font-medium">建議流程</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {taskMatrix.map((row) => (
                  <tr key={row.type}>
                    <td className="py-2.5 pr-4 text-white font-medium">{row.type}</td>
                    <td className="py-2.5 pr-4 text-center text-base">{row.plan}</td>
                    <td className="py-2.5 pr-4 text-center text-base">{row.tdd}</td>
                    <td className="py-2.5 pr-4 text-center text-base">{row.review}</td>
                    <td className="py-2.5">
                      <Badge className={
                        row.recommend === '完整四階段' ? 'bg-violet-500/20 text-violet-400' :
                        row.recommend === 'Plan + Review' ? 'bg-sky-500/20 text-sky-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }>
                        {row.recommend}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        {/* ── 三模型結論 ── */}
        <section>
          <SectionTitle>三模型結論</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            {modelConclusions.map((m) => (
              <Card key={m.model} className={m.color}>
                <div className="flex items-center gap-2 mb-3">
                  <m.icon size={20} className={m.iconColor} />
                  <div>
                    <p className="text-sm font-bold text-white">{m.model}</p>
                    <p className="text-xs text-zinc-500">{m.role}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {m.points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <CheckCircle2 size={14} className={`mt-0.5 shrink-0 ${m.iconColor}`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 10 個測試場景 ── */}
        <section>
          <SectionTitle>10 個測試場景</SectionTitle>
          <div className="space-y-2">
            {scenarios.map((s) => (
              <div key={s.id} className={`rounded-xl border ${openScenario === s.id ? s.borderColor : 'border-white/10'} bg-white/[0.03] overflow-hidden`}>
                <button
                  onClick={() => setOpenScenario(openScenario === s.id ? null : s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <Badge className={s.color}>{s.priority}</Badge>
                  <span className="text-sm font-medium text-white flex-1">場景 {s.id}：{s.title}</span>
                  <ChevronDown size={16} className={`text-zinc-500 transition-transform ${openScenario === s.id ? 'rotate-180' : ''}`} />
                </button>
                {openScenario === s.id && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5">
                    <p className="text-sm text-zinc-400 leading-relaxed">{s.detail}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Token 成本表 ── */}
        <section>
          <SectionTitle>Token 成本估算</SectionTitle>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-500">
                  <th className="pb-3 pr-4 font-medium">模式</th>
                  <th className="pb-3 pr-4 font-medium">每任務增量</th>
                  <th className="pb-3 pr-4 font-medium">每月增量</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tokenCosts.map((row) => (
                  <tr key={row.mode} className={row.note === '推薦' ? 'bg-violet-500/5' : ''}>
                    <td className="py-2.5 pr-4 text-white font-medium">{row.mode}</td>
                    <td className="py-2.5 pr-4 text-zinc-300 font-mono">{row.perTask}</td>
                    <td className="py-2.5 pr-4 text-zinc-300 font-mono">{row.perMonth}</td>
                    <td className="py-2.5">
                      {row.note && <Badge className="bg-violet-500/20 text-violet-400">{row.note}</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
              <p className="text-sm text-red-400 font-semibold">
                ⚠ 對比：retry 1,004 次 ≈ 消耗 <span className="text-red-300 text-lg font-black">800 萬 — 1,500 萬</span> token
              </p>
            </div>
          </Card>
        </section>

        {/* ── 漸進式導入時間軸 ── */}
        <section>
          <SectionTitle>漸進式導入時間軸</SectionTitle>
          <div className="relative space-y-6 pl-6 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-white/10">
            {timeline.map((t) => (
              <div key={t.week} className="relative">
                <div className={`absolute -left-6 top-1 h-[18px] w-[18px] rounded-full border-2 border-[#0a0a0a] ${t.dot}`} />
                <h3 className="text-sm font-bold text-white">{t.week}</h3>
                <p className="text-sm text-zinc-400">{t.task}</p>
              </div>
            ))}
          </div>
          <Card className="mt-4 border-amber-500/20 bg-amber-500/5">
            <p className="text-sm text-amber-400">
              <span className="font-bold">退出標準：</span>首次通過率未提升 15% 則停止
            </p>
          </Card>
        </section>

        {/* ── 三大共識 ── */}
        <section>
          <SectionTitle>三大共識</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            {consensus.map((c, i) => (
              <Card key={i} className="border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-emerald-300 font-medium leading-relaxed">{c}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
