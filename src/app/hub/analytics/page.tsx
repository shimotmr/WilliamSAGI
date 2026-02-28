'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Activity, DollarSign, CheckCircle, TrendingUp } from 'lucide-react'

/* ── types ─────────────────────────────────────────── */
interface TokenRow {
  id: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost: number
  created_at: string
}

interface PerfRow {
  id: string
  model: string
  task_id: string
  status: string // 'success' | 'failed' | ...
  latency_ms: number
  created_at: string
}

/* ── colours ───────────────────────────────────────── */
const MODEL_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#6366f1',
]

/* ── helpers ───────────────────────────────────────── */
function fmt(n: number | undefined) {
  if (n == null) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function fmtCost(n: number) {
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(2) + 'K'
  return '$' + n.toFixed(2)
}

/* ── page ──────────────────────────────────────────── */
export default function TokenROIDashboard() {
  const [tokenUsage, setTokenUsage] = useState<TokenRow[]>([])
  const [modelPerf, setModelPerf] = useState<PerfRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hub/analytics')
      .then(r => r.json())
      .then(d => {
        setTokenUsage(d.tokenUsage ?? [])
        setModelPerf(d.modelPerformance ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* ── derived data ──────────────────────────────── */

  // daily token consumption (line chart)
  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; tokens: number; cost: number }> = {}
    tokenUsage.forEach(r => {
      const d = r.created_at?.slice(0, 10)
      if (!d) return
      if (!map[d]) map[d] = { date: d, tokens: 0, cost: 0 }
      map[d].tokens += r.total_tokens ?? 0
      map[d].cost += r.cost ?? 0
    })
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
  }, [tokenUsage])

  // model usage pie
  const modelPie = useMemo(() => {
    const map: Record<string, number> = {}
    tokenUsage.forEach(r => {
      const m = r.model || 'unknown'
      map[m] = (map[m] || 0) + (r.total_tokens ?? 0)
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [tokenUsage])

  // task completion rate
  const completionRate = useMemo(() => {
    if (modelPerf.length === 0) return { rate: 0, total: 0, success: 0 }
    const success = modelPerf.filter(r => r.status === 'success').length
    return {
      rate: Math.round((success / modelPerf.length) * 100),
      total: modelPerf.length,
      success,
    }
  }, [modelPerf])

  // estimated monthly cost
  const monthlyCost = useMemo(() => {
    if (dailyData.length === 0) return 0
    const totalCost = dailyData.reduce((s, d) => s + d.cost, 0)
    const avgDaily = totalCost / dailyData.length
    return avgDaily * 30
  }, [dailyData])

  // total tokens
  const totalTokens = useMemo(
    () => tokenUsage.reduce((s, r) => s + (r.total_tokens ?? 0), 0),
    [tokenUsage],
  )

  // total spent
  const totalSpent = useMemo(
    () => tokenUsage.reduce((s, r) => s + (r.cost ?? 0), 0),
    [tokenUsage],
  )

  /* ── render ────────────────────────────────────── */
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 animate-pulse">載入中...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Token ROI 儀表板</h1>

      {/* ── KPI cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card icon={<Activity size={20} />} label="30 日 Token 消耗" value={fmt(totalTokens)} color="text-blue-600" />
        <Card icon={<DollarSign size={20} />} label="已花費" value={fmtCost(totalSpent)} color="text-green-600" />
        <Card icon={<CheckCircle size={20} />} label="任務完成率" value={`${completionRate.rate}%`} sub={`${completionRate.success}/${completionRate.total}`} color="text-purple-600" />
        <Card icon={<TrendingUp size={20} />} label="預估月費" value={fmtCost(monthlyCost)} color="text-yellow-600" />
      </div>

      {/* ── charts ────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* daily line chart */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold mb-4">每日 Token 消耗</h2>
          {dailyData.length === 0 ? (
            <p className="text-gray-400 text-sm py-20 text-center">尚無資料</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" fontSize={11} tickFormatter={v => v.slice(5)} />
                  <YAxis fontSize={11} tickFormatter={fmt} />
                  <Tooltip
                    formatter={(v: number | undefined) => [fmt(v ?? 0) + ' tokens', 'Tokens']}
                    labelFormatter={l => `日期: ${l}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="tokens" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Tokens" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* model pie chart */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold mb-4">各模型使用比例</h2>
          {modelPie.length === 0 ? (
            <p className="text-gray-400 text-sm py-20 text-center">尚無資料</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {modelPie.map((_, i) => (
                      <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number | undefined) => fmt(v ?? 0) + ' tokens'} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── detail table ──────────────────────────── */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-5 py-3 border-b font-semibold text-sm">模型效能明細</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="p-3 text-left">模型</th>
              <th className="p-3 text-right">Tokens</th>
              <th className="p-3 text-right">花費</th>
              <th className="p-3 text-right">請求數</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {modelPie.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-gray-400">尚無資料</td></tr>
            )}
            {modelPie.map((m, i) => {
              const rows = tokenUsage.filter(r => (r.model || 'unknown') === m.name)
              const cost = rows.reduce((s, r) => s + (r.cost ?? 0), 0)
              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-3 font-medium flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                    {m.name}
                  </td>
                  <td className="p-3 text-right">{fmt(m.value)}</td>
                  <td className="p-3 text-right">{fmtCost(cost)}</td>
                  <td className="p-3 text-right">{rows.length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center">
        資料範圍: 近 30 天 | 更新時間: {new Date().toLocaleString('zh-TW')}
      </p>
    </div>
  )
}

/* ── sub-components ────────────────────────────────── */
function Card({ icon, label, value, sub, color }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
