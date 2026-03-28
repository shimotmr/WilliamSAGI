'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Zap, CheckCircle2, ChevronRight,
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-white mb-4">{children}</h2>
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
  { label: 'retry > 3 的任務', value: '47', unit: '個', color: 'text-red-400' },
  { label: '最高 retry #3513', value: '1,004', unit: '次', color: 'text-red-400', emphasis: true },
  { label: '自動修復卡', value: '28', unit: '張', color: 'text-red-400' },
  { label: 'Blake 完成率', value: '78.8', unit: '%', color: 'text-red-400' },
]

const beforeAfter = {
  before: [
    { step: '直接執行', detail: '收到任務後直接開始寫代碼，無計劃' },
    { step: '偏離', detail: '想到哪做到哪，缺乏方向鎖定' },
    { step: '重試', detail: '失敗後不分析原因，直接重試' },
    { step: '重試…', detail: '陷入 retry 循環（最高 1,004 次）' },
  ],
  after: [
    { step: 'Plan（書面計劃）', detail: '做什麼、怎麼做、完成標準，白紙黑字' },
    { step: 'Implementation', detail: '按照計劃逐步實施，鎖定不偏離' },
    { step: 'Self-Review（逐項 ✅）', detail: '逐項檢查清單，自我驗證每個交付物' },
    { step: '完成', detail: '通過審查後才標記完成，品質閘門' },
  ],
}

const taskMatrix = [
  { type: '前端頁面', plan: '✅', tdd: '⚠️', review: '✅', recommend: 'Plan + Review' },
  { type: 'API 開發', plan: '✅', tdd: '✅', review: '✅', recommend: '完整四階段' },
  { type: 'Bug 修復（已知）', plan: '❌', tdd: '❌', review: '✅', recommend: '僅 Review' },
  { type: 'Bug 修復（未知）', plan: '✅', tdd: '❌', review: '✅', recommend: 'Plan + Review' },
  { type: 'Rex 研究報告', plan: '✅', tdd: 'N/A', review: '✅', recommend: 'Plan + Review' },
]

const modelConclusions = [
  {
    model: 'Rex (Grok 4.20)',
    role: '策略',
    color: 'border-orange-500/30 bg-orange-500/5',
    icon: Brain,
    iconColor: 'text-orange-400',
    points: [
      'B 方案 — 高風險任務四階段',
      '優先 superpowers 先於 ByteRover',
      '20 個任務 A/B 測試',
    ],
  },
  {
    model: 'Opus 4.6',
    role: '架構',
    color: 'border-violet-500/30 bg-violet-500/5',
    icon: Cpu,
    iconColor: 'text-violet-400',
    points: [
      '輕量版 Plan + Review',
      'Brainstorm 對我們多餘',
      'worktree 不是現在',
    ],
  },
  {
    model: 'Griffin (Sonnet)',
    role: '安全',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    icon: Shield,
    iconColor: 'text-emerald-400',
    points: [
      '先審計代碼安全',
      'AI 自我審查不誠實是 P0',
      '漸進式導入',
    ],
  },
]

const tokenCosts = [
  { mode: '完整四階段', perTask: '+5,000', perMonth: '+150K', note: '' },
  { mode: 'Plan + Review（建議）', perTask: '+2,500', perMonth: '+75K', note: '推薦' },
  { mode: '僅 Review', perTask: '+1,000', perMonth: '+30K', note: '' },
]

const timeline = [
  { week: '第 1 週', task: '安全審計 superpowers 代碼', dot: 'bg-red-500' },
  { week: '第 2 週', task: '1 個 P3 任務測試 Plan + Review', dot: 'bg-orange-500' },
  { week: '第 3 週', task: '擴展到 P2 任務', dot: 'bg-sky-500' },
  { week: '第 4 週', task: '評估首次通過率是否提升 >15%', dot: 'bg-emerald-500' },
]

const consensus = [
  '先審計代碼安全再安裝',
  '先做 Plan + Review，不急四階段',
  'AI 自我審查必須雙重驗證',
  'P0 任務要有 fast_track 繞過 Brainstorm',
]

/* ───────── page ───────── */

export default function SuperpowersAuditPage() {
  const [tab, setTab] = useState<'before' | 'after'>('before')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Link href="/hub/dashboard" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Zap size={20} className="text-violet-400" />
          <h1 className="text-lg font-bold text-white">Superpowers 審計</h1>
          <span className="ml-auto text-xs text-zinc-500">2026-03-28</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-8">
        {/* ── Hero ── */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              superpowers 工作流整合審計報告
            </span>
          </h1>
          <p className="text-base text-zinc-400 max-w-2xl mx-auto">
            三模型審計 — <span className="text-violet-400 font-semibold">Opus 4.6 架構</span> × <span className="text-orange-400 font-semibold">Grok 4.20 策略</span> × <span className="text-emerald-400 font-semibold">Sonnet 安全</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
            {heroStats.map((s) => (
              <div key={s.label} className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-center">
                <s.icon size={18} className="mx-auto mb-1 text-violet-400" />
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
              <Card key={d.label} className="border-red-500/30 bg-red-500/5">
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
          <SectionTitle>Before / After 流程</SectionTitle>
          <Card>
            <div className="flex gap-2 mb-5">
              {(['before', 'after'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                    tab === t
                      ? t === 'before'
                        ? 'bg-red-500 text-white'
                        : 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                  }`}
                >
                  {t === 'before' ? 'Before（紅色標注）' : 'After（綠色）'}
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
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${tab === 'before' ? 'text-red-400' : 'text-emerald-400'}`}>{item.step}</p>
                    <p className="text-sm text-zinc-400">{item.detail}</p>
                  </div>
                  {i < beforeAfter[tab].length - 1 && (
                    <ChevronRight size={14} className={`mt-2 shrink-0 ${tab === 'before' ? 'text-red-600' : 'text-emerald-600'}`} />
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

        {/* ── Token 成本估算 ── */}
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
                ⚠ 對比：retry 1,000 次 ≈ 消耗 <span className="text-red-300 text-lg font-black">800 萬 — 1,500 萬</span> token
              </p>
            </div>
          </Card>
        </section>

        {/* ── 漸進式導入時間軸 ── */}
        <section>
          <SectionTitle>漸進式導入時間軸</SectionTitle>
          <div className="relative space-y-6 pl-6 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-gradient-to-b before:from-violet-500 before:to-emerald-500">
            {timeline.map((t) => (
              <div key={t.week} className="relative">
                <div className={`absolute -left-6 top-1 h-[18px] w-[18px] rounded-full border-2 border-[#0a0a0a] ${t.dot}`} />
                <h3 className="text-sm font-bold text-white">{t.week}</h3>
                <p className="text-sm text-zinc-400">{t.task}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 共識行動項 ── */}
        <section>
          <SectionTitle>共識行動項</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
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
