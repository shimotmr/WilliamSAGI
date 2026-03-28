'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Target, Database, FileCode, Clock, HardDrive,
  AlertTriangle, CheckCircle2, ArrowRight, Server, Cpu, Zap,
} from 'lucide-react'

/* ───────── tiny local helpers ───────── */

function Progress({ value, color = 'bg-emerald-500' }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-white/10">
      <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
    </div>
  )
}

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

const scores = [
  { label: '可靠性', value: 72, color: 'bg-emerald-500' },
  { label: '可維護性', value: 41, color: 'bg-red-500' },
  { label: '自動化', value: 68, color: 'bg-sky-500' },
  { label: '資源效率', value: 55, color: 'bg-amber-500' },
  { label: '整合完整', value: 63, color: 'bg-violet-500' },
]

const metrics = [
  { label: '腳本數', current: 304, target: 80, icon: FileCode, unit: '個' },
  { label: 'Supabase 表', current: 181, target: 80, icon: Database, unit: '張' },
  { label: 'Tasks 總筆數', current: 3390, icon: Target, unit: '筆' },
  { label: 'Cron 任務', current: 13, icon: Clock, unit: '個' },
]

const bottlenecks = [
  { priority: 'P0', color: 'bg-red-600 text-white', items: ['Supabase 肥大（181 → 80 表）', '腳本冗餘（304 → 80）'] },
  { priority: 'P1', color: 'bg-orange-500 text-white', items: ['Jimmy 節點失聯', '本地模型利用率低（可省 20-30% API 費）'] },
  { priority: 'P2', color: 'bg-yellow-500 text-black', items: ['工作 / 個人域混淆'] },
]

const roadmap = [
  {
    phase: '今天',
    dot: 'bg-red-500',
    tasks: ['修復 Popen 安全問題', '清除 .bak 殘留檔', 'SSD 急救：釋放空間', '刪除測試表'],
  },
  {
    phase: '本週',
    dot: 'bg-orange-500',
    tasks: ['agent_jobs 閉環修復', '通知腳本合併 5 → 2', '清除 31 張空表', '日誌輪換機制'],
  },
  {
    phase: '本月',
    dot: 'bg-sky-500',
    tasks: ['腳本 304 → 80 整併', 'Supabase 表合併', '任務狀態機建立', '備份系統上線'],
  },
  {
    phase: '下季',
    dot: 'bg-emerald-500',
    tasks: ['board_tasks 歸檔策略', '意圖路由器上線', '統一配置中心', '可觀測性面板'],
  },
]

const models = [
  { name: 'qwen3.5-4b-optiq', params: '4B', usage: '意圖分類 / 路由', mode: '常駐' },
  { name: 'nomic-embed', params: '-', usage: '向量嵌入', mode: '常駐' },
  { name: 'qwen2.5-coder-7b', params: '7B', usage: '代碼審查', mode: '按需' },
  { name: 'deepseek-r1-8b', params: '8B', usage: '推理 / 邏輯', mode: '按需' },
  { name: 'qwen2.5-14b', params: '14B', usage: '深度分析', mode: '排程用' },
]

const beforeAfter = {
  before: [
    { step: 'DB 查詢', detail: '循序 4 個 DB 查詢（串行等待）' },
    { step: 'agent_jobs', detail: '100% ORPHAN，無閉環' },
    { step: '通知腳本', detail: '5 個獨立腳本各管各的' },
    { step: '儲存', detail: 'SSD 86% 滿，全擠本地' },
  ],
  after: [
    { step: 'DB 查詢', detail: 'Promise.all 並行，延遲降 60%' },
    { step: 'agent_jobs', detail: '狀態機閉環，自動回收' },
    { step: '通知腳本', detail: '統一通知中心 2 個入口' },
    { step: '儲存', detail: '分層策略：熱 SSD + 冷 HDD' },
  ],
}

/* ───────── page ───────── */

export default function SystemAuditPage() {
  const [tab, setTab] = useState<'before' | 'after'>('before')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Link href="/hub/dashboard" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-white">系統審計報告</h1>
          <span className="ml-auto text-xs text-zinc-500">2026-03-28</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        {/* ── Section 1: 評分卡 ── */}
        <section>
          <SectionTitle>系統健康評分</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scores.map((s) => (
              <Card key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">{s.label}</span>
                  <span className={`text-lg font-bold ${s.value < 50 ? 'text-red-400' : 'text-white'}`}>
                    {s.value}%
                  </span>
                </div>
                <Progress value={s.value} color={s.color} />
              </Card>
            ))}
            {/* 總分 */}
            <Card className="sm:col-span-2 lg:col-span-1 flex flex-col items-center justify-center">
              <span className="text-sm text-zinc-400 mb-1">總分</span>
              <span className="text-4xl font-black text-white">60<span className="text-lg text-zinc-500">/100</span></span>
            </Card>
          </div>
        </section>

        {/* ── Section 2: 數字牆 ── */}
        <section>
          <SectionTitle>數字概覽</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m) => (
              <Card key={m.label}>
                <div className="flex items-center gap-3 mb-3">
                  <m.icon size={20} className="text-zinc-500" />
                  <span className="text-sm text-zinc-400">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {m.current.toLocaleString()}<span className="text-sm text-zinc-500 ml-1">{m.unit}</span>
                </p>
                {m.target && (
                  <p className="text-xs text-zinc-500 mt-1">目標 → {m.target} {m.unit}</p>
                )}
              </Card>
            ))}
            {/* SSD */}
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <HardDrive size={20} className="text-red-400" />
                <span className="text-sm text-zinc-400">SSD 使用率</span>
              </div>
              <p className="text-2xl font-bold text-red-400">86%</p>
              <Progress value={86} color="bg-red-500" />
            </Card>
            {/* Samsung HDD */}
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <HardDrive size={20} className="text-emerald-400" />
                <span className="text-sm text-zinc-400">Samsung 4TB</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">2%</p>
              <Progress value={2} color="bg-emerald-500" />
              <p className="text-xs text-zinc-500 mt-1">幾乎未使用</p>
            </Card>
          </div>
        </section>

        {/* ── Section 3: Before / After ── */}
        <section>
          <SectionTitle>流程改善 Before / After</SectionTitle>
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
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ── Section 4: TOP 5 瓶頸 ── */}
        <section>
          <SectionTitle>TOP 5 瓶頸</SectionTitle>
          <div className="space-y-4">
            {bottlenecks.map((group) => (
              <Card key={group.priority}>
                <div className="flex items-start gap-3">
                  <Badge className={group.color}>{group.priority}</Badge>
                  <ul className="space-y-1">
                    {group.items.map((item, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                        <AlertTriangle size={14} className={
                          group.priority === 'P0' ? 'text-red-400' : group.priority === 'P1' ? 'text-orange-400' : 'text-yellow-400'
                        } />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Section 5: 90 天 Roadmap ── */}
        <section>
          <SectionTitle>90 天 Roadmap</SectionTitle>
          <div className="relative space-y-6 pl-6 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-white/10">
            {roadmap.map((phase) => (
              <div key={phase.phase} className="relative">
                <div className={`absolute -left-6 top-1 h-[18px] w-[18px] rounded-full border-2 border-[#0a0a0a] ${phase.dot}`} />
                <h3 className="text-sm font-bold text-white mb-2">{phase.phase}</h3>
                <ul className="space-y-1">
                  {phase.tasks.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                      <CheckCircle2 size={14} className="text-zinc-600" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 6: 本地模型路由表 ── */}
        <section>
          <SectionTitle>本地模型路由表</SectionTitle>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-500">
                  <th className="pb-3 pr-4 font-medium">模型</th>
                  <th className="pb-3 pr-4 font-medium">參數量</th>
                  <th className="pb-3 pr-4 font-medium">用途</th>
                  <th className="pb-3 font-medium">模式</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {models.map((m) => (
                  <tr key={m.name}>
                    <td className="py-2.5 pr-4 font-mono text-white">{m.name}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{m.params}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{m.usage}</td>
                    <td className="py-2.5">
                      <Badge className={m.mode === '常駐' ? 'bg-emerald-500/20 text-emerald-400' : m.mode === '按需' ? 'bg-sky-500/20 text-sky-400' : 'bg-violet-500/20 text-violet-400'}>
                        {m.mode}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      </main>
    </div>
  )
}
