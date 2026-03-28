'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, Clock, Zap, TrendingDown,
  AlertTriangle, CheckCircle2, XCircle, Eye, FileText,
  Monitor, Bell, Database, ArrowRight, Users,
} from 'lucide-react'

/* ───────── tiny local helpers ───────── */

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${className}`}>
      {children}
    </span>
  )
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-xl font-bold text-white mb-4">{children}</h2>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}>
      {children}
    </div>
  )
}

function CountUp({ end, suffix = '', className = '' }: { end: number; suffix?: string; className?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let start = 0
    const duration = 1200
    const step = Math.max(1, Math.floor(end / (duration / 16)))
    const timer = setInterval(() => {
      start += step
      if (start >= end) { start = end; clearInterval(timer) }
      setVal(start)
    }, 16)
    return () => clearInterval(timer)
  }, [end])
  return <span ref={ref} className={className}>{val.toLocaleString()}{suffix}</span>
}

function FlowBox({ children, color = 'border-white/20' }: { children: React.ReactNode; color?: string }) {
  return (
    <div className={`rounded-lg border ${color} bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-200 text-center`}>
      {children}
    </div>
  )
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <div className="h-4 w-px bg-zinc-600" />
      {label && <span className="text-[10px] text-zinc-500">{label}</span>}
      <ArrowRight size={14} className="text-zinc-600 rotate-90" />
    </div>
  )
}

/* ───────── data ───────── */

const heroStats = [
  { label: '預估工時', value: 7.5, suffix: '小時', icon: Clock, color: 'from-sky-500 to-cyan-400' },
  { label: '上線時間', value: 2, suffix: '週', icon: Zap, color: 'from-violet-500 to-purple-400' },
  { label: '每月省 Token', value: 75, suffix: '%', icon: TrendingDown, color: 'from-emerald-500 to-green-400' },
]

const happyPathTests = [
  { id: 1, scene: '小型任務完成', input: 'Blake 修一個 bug', expected: 'task_steps 有記錄，task_complete 被呼叫', verify: 'SELECT * FROM task_steps WHERE task_id=?' },
  { id: 2, scene: '研究任務有報告', input: 'Rex 寫分析報告', expected: 'reports.export_task_id 有值', verify: 'SELECT export_task_id FROM reports WHERE id=?' },
  { id: 3, scene: '今日看板更新', input: '任何任務完成', expected: '看板立刻顯示完成', verify: '手動檢查頁面' },
]

const edgeCaseTests = [
  { id: 4, scene: '任務卡住', trigger: '10 分鐘無 task_steps 記錄', expected: 'Telegram 立刻通知', risk: 'P1', color: 'bg-orange-500 text-white' },
  { id: 5, scene: 'Agent 假完成', trigger: 'task_complete 被呼叫但 task_steps 少於 2 筆', expected: '標記為疑似假完成，需人工確認', risk: 'P0', color: 'bg-red-600 text-white' },
  { id: 6, scene: '報告上傳失敗', trigger: 'Supabase 503', expected: 'task_steps 記錄失敗狀態，通知 William', risk: 'P1', color: 'bg-orange-500 text-white' },
  { id: 7, scene: 'Session 死亡', trigger: '無任何 step 記錄超過 15 分鐘', expected: '自動標記為失敗，不再等 heartbeat', risk: 'P0', color: 'bg-red-600 text-white' },
  { id: 8, scene: '同時兩個任務卡住', trigger: '兩個執行中都靜默', expected: '各自獨立通知，不互相干擾', risk: 'P2', color: 'bg-yellow-500 text-black' },
]

const modelConfig = [
  { role: 'Travis main', before: 'Sonnet 4.6', after: 'Kimi 2.5', saving: '~$40' },
  { role: 'Heartbeat', before: 'Sonnet 4.6', after: 'Qwen 本地', saving: '~$30' },
  { role: 'Coding', before: 'Codex', after: 'Codex（不變）', saving: '-' },
  { role: 'Rex', before: 'Grok 4.20', after: 'Grok 4.20（不變）', saving: '-' },
]

const timeline = [
  { label: '現在', dot: 'bg-emerald-500', task: '建 task_steps 表 + 模板', done: true },
  { label: 'Day 1', dot: 'bg-sky-500', task: 'task → report 連結修復', done: false },
  { label: 'Day 2', dot: 'bg-sky-500', task: 'Blake 做今日看板頁面', done: false },
  { label: 'Day 3', dot: 'bg-sky-500', task: 'heartbeat 換便宜模型', done: false },
  { label: 'Week 2', dot: 'bg-violet-500', task: '觀察穩定性，確認驗收通過', done: false },
]

/* ───────── page ───────── */

export default function SystemRedesignPage() {
  const [flowTab, setFlowTab] = useState<'before' | 'after'>('before')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Link href="/hub/dashboard" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <RefreshCw size={18} className="text-violet-400" />
          <h1 className="text-lg font-bold text-white">系統重新設計報告</h1>
          <span className="ml-auto text-xs text-zinc-500">2026-03-28</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-8">

        {/* ── Hero ── */}
        <section className="text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            系統重新設計報告
          </h2>
          <p className="text-zinc-400 text-lg">從混亂到掌握度——基於 Rex × Opus 雙軌分析</p>
          <div className="grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
            {heroStats.map((s) => (
              <Card key={s.label} className="flex flex-col items-center gap-2 py-6">
                <s.icon size={24} className="text-zinc-500" />
                <span className={`text-3xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                  <CountUp end={s.value} suffix={s.suffix} />
                </span>
                <span className="text-xs text-zinc-500">{s.label}</span>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Section 1: 問題診斷 ── */}
        <section>
          <SectionTitle id="diagnosis">Section 1：問題診斷（Before）</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex flex-col items-center justify-center py-8">
              <p className="text-xs text-zinc-500 mb-1">594 份報告中</p>
              <p className="text-5xl font-black text-red-500"><CountUp end={423} /></p>
              <p className="text-sm text-red-400 mt-1">份沒有連結任務</p>
              <p className="text-xs text-zinc-600 mt-2">斷連率 71%</p>
            </Card>
            <Card className="flex flex-col items-center justify-center py-8">
              <p className="text-xs text-zinc-500 mb-1">最高重試次數</p>
              <p className="text-5xl font-black text-orange-500"><CountUp end={1004} /></p>
              <p className="text-sm text-orange-400 mt-1">次 retry</p>
              <p className="text-xs text-zinc-600 mt-2">無限迴圈</p>
            </Card>
            <Card className="flex flex-col items-center justify-center py-8">
              <p className="text-xs text-zinc-500 mb-1">任務死亡到被發現</p>
              <p className="text-5xl font-black text-amber-500">最長 <CountUp end={2} /> hr</p>
              <p className="text-sm text-amber-400 mt-1">靜默死亡無人知</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                <div className="h-1 w-16 rounded bg-amber-500/30" />
                <span>30min heartbeat 間隔太長</span>
              </div>
            </Card>
            <Card className="flex flex-col items-center justify-center py-8">
              <p className="text-xs text-zinc-500 mb-1">待確認任務</p>
              <p className="text-5xl font-black text-yellow-500"><CountUp end={9} /></p>
              <p className="text-sm text-yellow-400 mt-1">個沒人碰過</p>
              <p className="text-xs text-zinc-600 mt-2">完全遺忘</p>
            </Card>
          </div>
        </section>

        {/* ── Section 2: Before/After 流程圖 ── */}
        <section>
          <SectionTitle id="flow">Section 2：Before / After 流程圖</SectionTitle>
          <Card>
            <div className="flex gap-2 mb-6">
              {(['before', 'after'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFlowTab(t)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                    flowTab === t ? 'bg-white text-black' : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                  }`}
                >
                  {t === 'before' ? 'Before（問題流程）' : 'After（新流程）'}
                </button>
              ))}
            </div>

            {flowTab === 'before' ? (
              <div className="flex flex-col items-center gap-0 py-4">
                <FlowBox color="border-zinc-600">William 說一件事</FlowBox>
                <FlowArrow />
                <FlowBox color="border-zinc-600">dispatch_prompt 派發</FlowBox>
                <FlowArrow />
                <FlowBox color="border-zinc-600">Isolated Session</FlowBox>
                <div className="flex gap-6 mt-3">
                  <div className="flex flex-col items-center gap-0">
                    <FlowArrow label="靜默死亡" />
                    <FlowBox color="border-red-500/60">
                      <span className="text-red-400">卡 2 小時沒人知道</span>
                    </FlowBox>
                    <FlowArrow />
                    <FlowBox color="border-orange-500/60">
                      <span className="text-orange-400">heartbeat 30 分鐘後才發現</span>
                    </FlowBox>
                    <FlowArrow />
                    <FlowBox color="border-zinc-600">重置重跑（loop）</FlowBox>
                  </div>
                  <div className="flex flex-col items-center gap-0">
                    <FlowArrow label="假完成" />
                    <FlowBox color="border-red-500/60">
                      <span className="text-red-400">task_complete 但其實沒做</span>
                    </FlowBox>
                    <FlowArrow />
                    <FlowBox color="border-red-500/60">
                      <span className="text-red-400">報告沒連結任務 (423 筆)</span>
                    </FlowBox>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0 py-4">
                <FlowBox color="border-emerald-500/40">William 說一件事</FlowBox>
                <FlowArrow />
                <FlowBox color="border-emerald-500/40">Travis 判斷類型</FlowBox>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 w-full max-w-3xl">
                  <div className="flex flex-col items-center gap-1">
                    <Badge className="bg-sky-500/20 text-sky-400 mb-1">查詢/狀態</Badge>
                    <FlowBox color="border-sky-500/40">Travis 直接做<br /><span className="text-xs text-zinc-500">&lt;2 分鐘</span></FlowBox>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Badge className="bg-violet-500/20 text-violet-400 mb-1">代碼/前端</Badge>
                    <FlowBox color="border-violet-500/40">Blake<br /><span className="text-xs text-zinc-500">Claude Code</span></FlowBox>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Badge className="bg-emerald-500/20 text-emerald-400 mb-1">研究/分析</Badge>
                    <FlowBox color="border-emerald-500/40">Rex<br /><span className="text-xs text-zinc-500">isolated + step log</span></FlowBox>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Badge className="bg-amber-500/20 text-amber-400 mb-1">花錢/刪除/架構</Badge>
                    <FlowBox color="border-amber-500/40">等 William 確認</FlowBox>
                  </div>
                </div>
                <div className="mt-4 flex flex-col items-center gap-0">
                  <FlowArrow label="每步驟寫 task_steps" />
                  <FlowBox color="border-emerald-500/40">
                    <span className="text-emerald-400">10 分鐘無 step → 立刻通知 William</span>
                  </FlowBox>
                  <FlowArrow />
                  <FlowBox color="border-emerald-500/40">upload_report --task-id</FlowBox>
                  <FlowArrow />
                  <FlowBox color="border-emerald-500/40">task_complete</FlowBox>
                  <FlowArrow />
                  <FlowBox color="border-emerald-500/40">
                    <span className="text-emerald-300 font-semibold">今日看板即時更新</span>
                  </FlowBox>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* ── Section 3: 三件事設計說明 ── */}
        <section>
          <SectionTitle id="three-things">Section 3：三件事設計說明</SectionTitle>
          <div className="space-y-6">
            {/* 件事 1 */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-sm font-bold">1</div>
                <h3 className="text-lg font-bold text-white">任務進去，知道在跑</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                新增 <code className="text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">task_steps</code> 表，
                每個 Agent 執行期間必須寫入步驟記錄。若 10 分鐘無新 step，系統立即發送 Telegram 通知。
              </p>
              <div className="rounded-xl bg-black/40 border border-white/5 p-4 space-y-2">
                <p className="text-xs text-zinc-500 mb-2 font-mono">task_steps 範例</p>
                {[
                  { step: 1, desc: '開始分析需求', time: '14:00:01', status: 'done' },
                  { step: 2, desc: '查詢相關資料表', time: '14:00:23', status: 'done' },
                  { step: 3, desc: '撰寫報告初稿', time: '14:02:15', status: 'running' },
                  { step: 4, desc: '上傳報告', time: '-', status: 'pending' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-zinc-600 text-right">{s.step}</span>
                    {s.status === 'done' && <CheckCircle2 size={14} className="text-emerald-400" />}
                    {s.status === 'running' && <RefreshCw size={14} className="text-sky-400 animate-spin" />}
                    {s.status === 'pending' && <Clock size={14} className="text-zinc-600" />}
                    <span className={s.status === 'pending' ? 'text-zinc-600' : 'text-zinc-300'}>{s.desc}</span>
                    <span className="ml-auto text-xs text-zinc-600 font-mono">{s.time}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 件事 2 */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-sm font-bold">2</div>
                <h3 className="text-lg font-bold text-white">任務完成，結果找得到</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                報告上傳時必須帶 <code className="text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">--task-id</code>，
                寫入 <code className="text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">reports.export_task_id</code>，確保每份報告都可追溯。
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 text-center">
                  <p className="text-xs text-red-400 mb-1">Before</p>
                  <p className="text-3xl font-black text-red-500">423</p>
                  <p className="text-xs text-zinc-500">筆報告斷連</p>
                </div>
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 text-center">
                  <p className="text-xs text-emerald-400 mb-1">After</p>
                  <p className="text-3xl font-black text-emerald-500">0</p>
                  <p className="text-xs text-zinc-500">筆報告斷連</p>
                </div>
              </div>
            </Card>

            {/* 件事 3 */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">3</div>
                <h3 className="text-lg font-bold text-white">一個畫面，看到全部</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                今日看板：一頁看到所有任務狀態，不用再開多個頁面追蹤。
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: RefreshCw, label: '進行中', desc: '顯示步驟列表，即時更新', color: 'text-sky-400 bg-sky-500/10' },
                  { icon: CheckCircle2, label: '已完成', desc: '點擊跳到對應報告', color: 'text-emerald-400 bg-emerald-500/10' },
                  { icon: AlertTriangle, label: '卡住/異常', desc: '紅色標記，一眼看到', color: 'text-red-400 bg-red-500/10' },
                  { icon: Clock, label: '待確認', desc: '需 William 決策的任務', color: 'text-amber-400 bg-amber-500/10' },
                ].map((block) => (
                  <div key={block.label} className={`rounded-xl border border-white/5 p-4 ${block.color.split(' ')[1]}`}>
                    <block.icon size={20} className={block.color.split(' ')[0]} />
                    <p className="text-sm font-bold text-white mt-2">{block.label}</p>
                    <p className="text-xs text-zinc-500 mt-1">{block.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* ── Section 4: Dry Run + E2E 測試方案 ── */}
        <section>
          <SectionTitle id="testing">Section 4：Dry Run + E2E 測試方案</SectionTitle>

          {/* Happy Path */}
          <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} /> 正常流程測試（Happy Path）
          </h3>
          <Card className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-500">
                  <th className="pb-3 pr-3 font-medium w-8">#</th>
                  <th className="pb-3 pr-3 font-medium">測試場景</th>
                  <th className="pb-3 pr-3 font-medium">輸入</th>
                  <th className="pb-3 pr-3 font-medium">預期輸出</th>
                  <th className="pb-3 font-medium">驗證方法</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {happyPathTests.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-3 text-zinc-500">{t.id}</td>
                    <td className="py-2.5 pr-3 text-white font-medium">{t.scene}</td>
                    <td className="py-2.5 pr-3 text-zinc-400">{t.input}</td>
                    <td className="py-2.5 pr-3 text-zinc-400">{t.expected}</td>
                    <td className="py-2.5 text-zinc-500 font-mono text-xs">{t.verify}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Edge Cases */}
          <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> 異常流程測試（Edge Cases）
          </h3>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-500">
                  <th className="pb-3 pr-3 font-medium w-8">#</th>
                  <th className="pb-3 pr-3 font-medium">測試場景</th>
                  <th className="pb-3 pr-3 font-medium">觸發條件</th>
                  <th className="pb-3 pr-3 font-medium">預期行為</th>
                  <th className="pb-3 font-medium">風險</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {edgeCaseTests.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-3 text-zinc-500">{t.id}</td>
                    <td className="py-2.5 pr-3 text-white font-medium">{t.scene}</td>
                    <td className="py-2.5 pr-3 text-zinc-400">{t.trigger}</td>
                    <td className="py-2.5 pr-3 text-zinc-400">{t.expected}</td>
                    <td className="py-2.5">
                      <Badge className={t.color}>{t.risk}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        {/* ── Section 5: 驗收標準 ── */}
        <section>
          <SectionTitle id="acceptance">Section 5：驗收標準</SectionTitle>
          <div className="space-y-4">
            {/* L1 */}
            <Card>
              <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <Database size={16} /> L1 機制驗收（自動）
              </h3>
              <ul className="space-y-2">
                {[
                  'task_steps 表存在且可寫入',
                  '每個完成的任務至少有 2 筆 step 記錄',
                  'reports.export_task_id 不為 NULL',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            {/* L2 */}
            <Card>
              <h3 className="text-sm font-bold text-sky-400 mb-3 flex items-center gap-2">
                <Eye size={16} /> L2 功能驗收（人工）
              </h3>
              <ul className="space-y-2">
                {[
                  '打開今日看板，看到進行中任務的步驟列表',
                  '點擊完成任務，能跳到對應報告',
                  '任務卡住 10 分鐘，Telegram 收到通知',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Eye size={14} className="text-sky-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            {/* L3 */}
            <Card>
              <h3 className="text-sm font-bold text-violet-400 mb-3 flex items-center gap-2">
                <TrendingDown size={16} /> L3 品質驗收（一週後）
              </h3>
              <ul className="space-y-2">
                {[
                  '假完成率降到 0%（每個「已完成」都有 step 記錄）',
                  '報告連結率從 29% 提升到 >90%',
                  'William 不再需要手動追蹤任務狀態',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle2 size={14} className="text-violet-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* ── Section 6: 模型配置對比 ── */}
        <section>
          <SectionTitle id="model-config">Section 6：模型配置對比</SectionTitle>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-500">
                  <th className="pb-3 pr-4 font-medium">角色</th>
                  <th className="pb-3 pr-4 font-medium">原本</th>
                  <th className="pb-3 pr-4 font-medium">改後</th>
                  <th className="pb-3 font-medium">月省費用</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {modelConfig.map((m) => (
                  <tr key={m.role}>
                    <td className="py-2.5 pr-4 font-semibold text-white">{m.role}</td>
                    <td className="py-2.5 pr-4 text-zinc-500 line-through">{m.before}</td>
                    <td className="py-2.5 pr-4 text-emerald-400">{m.after}</td>
                    <td className="py-2.5">
                      {m.saving !== '-'
                        ? <span className="text-emerald-400 font-bold">{m.saving}</span>
                        : <span className="text-zinc-600">-</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm text-zinc-400">估算總節省</span>
              <span className="text-xl font-black text-emerald-400">$60-80/月（約 75%）</span>
            </div>
          </Card>
        </section>

        {/* ── Section 7: 執行時間表 ── */}
        <section>
          <SectionTitle id="timeline">Section 7：執行時間表</SectionTitle>
          <Card>
            {/* horizontal timeline on desktop */}
            <div className="hidden sm:flex items-start justify-between relative">
              {/* connecting line */}
              <div className="absolute top-3 left-0 right-0 h-px bg-white/10" />
              {timeline.map((t, i) => (
                <div key={t.label} className="flex flex-col items-center text-center relative z-10" style={{ flex: 1 }}>
                  <div className={`h-6 w-6 rounded-full ${t.dot} ${t.done ? '' : 'opacity-60'} border-2 border-[#0a0a0a] flex items-center justify-center`}>
                    {t.done && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-xs font-bold text-white mt-2">{t.label}</span>
                  <span className="text-xs text-zinc-500 mt-1 max-w-[120px]">{t.task}</span>
                  {t.done && <Badge className="bg-emerald-500/20 text-emerald-400 mt-2">Done</Badge>}
                </div>
              ))}
            </div>
            {/* vertical timeline on mobile */}
            <div className="sm:hidden space-y-4 pl-6 relative before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-white/10">
              {timeline.map((t) => (
                <div key={t.label} className="relative">
                  <div className={`absolute -left-6 top-0.5 h-[18px] w-[18px] rounded-full border-2 border-[#0a0a0a] ${t.dot} ${t.done ? '' : 'opacity-60'}`} />
                  <p className="text-sm font-bold text-white">{t.label}</p>
                  <p className="text-sm text-zinc-400">{t.task}</p>
                  {t.done && <Badge className="bg-emerald-500/20 text-emerald-400 mt-1">Done</Badge>}
                </div>
              ))}
            </div>
          </Card>
        </section>

      </main>
    </div>
  )
}
