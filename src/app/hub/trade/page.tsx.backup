'use client'
import { Gem, Microscope, Bot, Zap, Brain, ClipboardList, DollarSign, Shield } from 'lucide-react'
import { useState } from 'react'

// ============================================================
// Trade Page — William Hub v1.0
// Deep dark trading interface, TW stock conventions
// 漲=紅, 跌=綠, tabular numbers, desktop-first
// ============================================================

// --- Color tokens ---
const C = {
  up: '#ef4444',        // 漲 紅
  upBg: 'rgba(239,68,68,0.10)',
  upSoft: '#fca5a5',
  down: '#22c55e',      // 跌 綠
  downBg: 'rgba(34,197,94,0.10)',
  downSoft: '#86efac',
  flat: '#94a3b8',
  warn: '#f59e0b',
  warnBg: 'rgba(245,158,11,0.10)',
  danger: '#ef4444',
  accent: '#3b82f6',
  accentBg: 'rgba(59,130,246,0.10)',
  bg0: '#080a0f',       // deepest
  bg1: '#0d1017',       // main panels
  bg2: '#141820',       // cards
  bg3: '#1a1f2e',       // hover / elevated
  border: '#1e2536',
  borderLight: '#2a3348',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textMuted: '#64748b',
}

// --- Mock: Market indices ---
const indices = [
  { name: '加權指數', value: 23845.67, change: 156.32, pct: 0.66 },
  { name: '櫃買指數', value: 268.54, change: -2.18, pct: -0.81 },
  { name: '道瓊', value: 44127.80, change: 312.45, pct: 0.71 },
  { name: '那斯達克', value: 19856.23, change: -45.67, pct: -0.23 },
  { name: '費城半導體', value: 5234.89, change: 78.12, pct: 1.51 },
  { name: 'USD/TWD', value: 32.45, change: -0.08, pct: -0.25 },
  { name: 'VIX', value: 14.32, change: -0.56, pct: -3.76 },
]

// --- Mock: Watchlist groups ---
const groupIcons: Record<string, React.ReactNode> = {
  core: <Gem size={16} />,
  semi: <Microscope size={16} />,
  ai: <Bot size={16} />,
  daytrade: <Zap size={16} />,
  'ai-pick': <Brain size={16} />,
}

const defaultGroups = [
  { id: 'core', name: '核心持股', icon: 'core' },
  { id: 'semi', name: '半導體', icon: 'semi' },
  { id: 'ai', name: 'AI 概念', icon: 'ai' },
  { id: 'daytrade', name: '當沖標的', icon: 'daytrade' },
  { id: 'ai-pick', name: 'AI 選股', icon: 'ai-pick', isAI: true },
]

// --- Mock: Watchlist stocks ---
const watchlistData: Record<string, Stock[]> = {
  core: [
    { symbol: '2330', name: '台積電', price: 985, change: 15, pct: 1.55, volume: 28453, open: 972, high: 988, low: 970, pe: 28.5, yield: 1.8, foreign: 4521, trust: 312, ma5: 978, ma20: 965, rsi: 62.3 },
    { symbol: '2317', name: '鴻海', price: 178.5, change: -2.5, pct: -1.38, volume: 45231, open: 181, high: 182, low: 177, pe: 11.2, yield: 4.5, foreign: -2312, trust: -156, ma5: 180, ma20: 176, rsi: 45.8 },
    { symbol: '2454', name: '聯發科', price: 1285, change: 35, pct: 2.80, volume: 5621, open: 1255, high: 1290, low: 1250, pe: 18.7, yield: 3.2, foreign: 1823, trust: 567, ma5: 1260, ma20: 1240, rsi: 71.2 },
    { symbol: '2881', name: '富邦金', price: 85.6, change: 0.8, pct: 0.94, volume: 18234, open: 85, high: 86.2, low: 84.8, pe: 12.1, yield: 5.8, foreign: 3421, trust: -89, ma5: 84.5, ma20: 83.2, rsi: 55.4 },
    { symbol: '2412', name: '中華電', price: 132.5, change: 0, pct: 0, volume: 5432, open: 132.5, high: 133, low: 132, pe: 26.3, yield: 3.6, foreign: 125, trust: 45, ma5: 132, ma20: 131, rsi: 50.1 },
    { symbol: '3711', name: '日月光投控', price: 168, change: 5.5, pct: 3.38, volume: 12543, open: 163, high: 169, low: 162, pe: 15.4, yield: 3.1, foreign: 2156, trust: 890, ma5: 164, ma20: 158, rsi: 68.9 },
  ],
  semi: [
    { symbol: '2330', name: '台積電', price: 985, change: 15, pct: 1.55, volume: 28453, open: 972, high: 988, low: 970, pe: 28.5, yield: 1.8, foreign: 4521, trust: 312, ma5: 978, ma20: 965, rsi: 62.3 },
    { symbol: '3034', name: '聯詠', price: 538, change: -8, pct: -1.47, volume: 3245, open: 545, high: 548, low: 535, pe: 14.2, yield: 5.1, foreign: -456, trust: 234, ma5: 542, ma20: 530, rsi: 42.1 },
    { symbol: '2303', name: '聯電', price: 52.8, change: 0.6, pct: 1.15, volume: 32156, open: 52.5, high: 53.2, low: 52.1, pe: 10.8, yield: 6.2, foreign: 5678, trust: -234, ma5: 52.2, ma20: 51.5, rsi: 56.7 },
    { symbol: '5274', name: '信驊', price: 2780, change: 80, pct: 2.96, volume: 423, open: 2710, high: 2790, low: 2700, pe: 45.2, yield: 1.2, foreign: 89, trust: 45, ma5: 2720, ma20: 2680, rsi: 72.5 },
  ],
  ai: [
    { symbol: '2382', name: '廣達', price: 312, change: 8.5, pct: 2.80, volume: 18923, open: 305, high: 315, low: 303, pe: 22.1, yield: 2.8, foreign: 3456, trust: 678, ma5: 306, ma20: 295, rsi: 74.3 },
    { symbol: '3661', name: '世芯-KY', price: 2150, change: -45, pct: -2.05, volume: 1234, open: 2180, high: 2200, low: 2130, pe: 32.5, yield: 0.8, foreign: -567, trust: 123, ma5: 2175, ma20: 2120, rsi: 38.9 },
    { symbol: '6669', name: '緯穎', price: 1680, change: 30, pct: 1.82, volume: 856, open: 1655, high: 1685, low: 1650, pe: 19.8, yield: 3.5, foreign: 234, trust: 156, ma5: 1660, ma20: 1620, rsi: 63.2 },
  ],
  daytrade: [
    { symbol: '2603', name: '長榮', price: 198, change: 6.5, pct: 3.39, volume: 85432, open: 192, high: 199, low: 191, pe: 5.2, yield: 15.2, foreign: 8765, trust: -432, ma5: 194, ma20: 188, rsi: 78.5 },
    { symbol: '2615', name: '萬海', price: 78.5, change: -1.8, pct: -2.24, volume: 42156, open: 80, high: 80.5, low: 78, pe: 4.8, yield: 18.5, foreign: -3456, trust: -567, ma5: 79.5, ma20: 77.2, rsi: 35.6 },
    { symbol: '3481', name: '群創', price: 18.25, change: 0.35, pct: 1.96, volume: 125678, open: 17.95, high: 18.4, low: 17.9, pe: 8.5, yield: 4.2, foreign: 12345, trust: -890, ma5: 18.1, ma20: 17.8, rsi: 58.9 },
  ],
  'ai-pick': [
    { symbol: '2345', name: '智邦', price: 542, change: 18, pct: 3.44, volume: 4523, open: 528, high: 545, low: 525, pe: 25.3, yield: 2.1, foreign: 1234, trust: 456, ma5: 530, ma20: 515, rsi: 76.8, signal: 87, reason: 'RSI突破+外資連買5日+營收YoY 35%' },
    { symbol: '6547', name: '高端疫苗', price: 45.8, change: 2.1, pct: 4.80, volume: 15678, open: 44, high: 46.2, low: 43.8, pe: -1, yield: 0, foreign: 5678, trust: 890, ma5: 43.5, ma20: 41.2, rsi: 82.1, signal: 72, reason: '量價齊揚+法人同步買超+突破季線' },
    { symbol: '3529', name: '力旺', price: 1895, change: 45, pct: 2.43, volume: 312, open: 1860, high: 1900, low: 1855, pe: 38.7, yield: 1.5, foreign: 67, trust: 23, ma5: 1870, ma20: 1830, rsi: 68.4, signal: 65, reason: 'MACD金叉+IP授權營收持續成長' },
  ],
}

interface Stock {
  symbol: string; name: string; price: number; change: number; pct: number
  volume: number; open: number; high: number; low: number
  pe: number; yield: number; foreign: number; trust: number
  ma5: number; ma20: number; rsi: number
  signal?: number; reason?: string
}

// --- Mock: Orders ---
const todayOrders = [
  { time: '09:01:23', symbol: '2330', name: '台積電', action: 'BUY', qty: 2, price: 972, status: 'filled', filled: 972 },
  { time: '09:15:45', symbol: '2603', name: '長榮', action: 'BUY', qty: 5, price: 193, status: 'filled', filled: 193.5 },
  { time: '10:32:12', symbol: '2603', name: '長榮', action: 'SELL', qty: 5, price: 198, status: 'filled', filled: 197.5 },
  { time: '11:05:00', symbol: '2454', name: '聯發科', action: 'BUY', qty: 1, price: 1260, status: 'filled', filled: 1262 },
  { time: '13:15:30', symbol: '2382', name: '廣達', action: 'BUY', qty: 3, price: 308, status: 'partial', filled: 310 },
  { time: '13:25:00', symbol: '3034', name: '聯詠', action: 'SELL', qty: 2, price: 540, status: 'pending', filled: 0 },
]

// --- Mock: Positions ---
const positions = [
  { symbol: '2330', name: '台積電', qty: 5, avgCost: 968.2, current: 985, stopLoss: 940, takeProfit: 1050 },
  { symbol: '2454', name: '聯發科', qty: 2, avgCost: 1248, current: 1285, stopLoss: 1180, takeProfit: 1400 },
  { symbol: '2881', name: '富邦金', qty: 10, avgCost: 82.5, current: 85.6, stopLoss: 78, takeProfit: 95 },
  { symbol: '2382', name: '廣達', qty: 3, avgCost: 310, current: 312, stopLoss: 285, takeProfit: 360 },
  { symbol: '3711', name: '日月光投控', qty: 3, avgCost: 155, current: 168, stopLoss: 145, takeProfit: 190 },
]

// --- Mock: Performance ---
const perfData = {
  totalPnl: 287450,
  todayPnl: 18230,
  winRate: 0.623,
  sharpe: 1.84,
  maxDrawdown: 0.082,
  profitFactor: 2.15,
  totalTrades: 156,
  avgHoldDays: 4.2,
}

// --- Mock: Strategies ---
const strategies = [
  { name: '動量突破', type: 'momentum', active: true, winRate: 0.65, sharpe: 2.1, return: 0.324, paper: false },
  { name: '均值回歸', type: 'mean_reversion', active: true, winRate: 0.58, sharpe: 1.5, return: 0.186, paper: false },
  { name: '法人跟單', type: 'institutional', active: false, winRate: 0.71, sharpe: 1.9, return: 0.256, paper: true },
  { name: '高殖利率', type: 'dividend', active: true, winRate: 0.82, sharpe: 1.2, return: 0.128, paper: false },
]

// --- Helpers ---
const fmt = (n: number) => n.toLocaleString('en-US')
const fmtP = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2)
const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
const clr = (n: number) => n > 0 ? C.up : n < 0 ? C.down : C.flat
const clrBg = (n: number) => n > 0 ? C.upBg : n < 0 ? C.downBg : 'transparent'

// --- Sparkline SVG ---
function Sparkline({ up }: { up: boolean }) {
  const pts = Array.from({ length: 20 }, (_, i) => {
    const y = up ? 30 - i * 0.8 + Math.sin(i * 0.8) * 6 : 10 + i * 0.8 + Math.sin(i * 0.7) * 5
    return `${i * 5},${y}`
  }).join(' ')
  return (
    <svg width="80" height="32" viewBox="0 0 100 40" className="inline-block">
      <polyline points={pts} fill="none" stroke={up ? C.up : C.down} strokeWidth="1.5" />
    </svg>
  )
}

// --- Signal badge ---
function SignalBadge({ score }: { score: number }) {
  const color = score >= 80 ? C.up : score >= 60 ? C.warn : C.textMuted
  const bg = score >= 80 ? C.upBg : score >= 60 ? C.warnBg : 'rgba(100,116,139,0.1)'
  return (
    <span style={{ color, background: bg, fontSize: 11 }} className="px-2 py-0.5 rounded-full font-bold tabular-nums">
      {score}分
    </span>
  )
}

// --- Progress bar for stop-loss / take-profit ---
function StopTakeBar({ current, cost, stopLoss, takeProfit }: { current: number; cost: number; stopLoss: number; takeProfit: number }) {
  const range = takeProfit - stopLoss
  const pos = Math.max(0, Math.min(1, (current - stopLoss) / range))
  const costPos = Math.max(0, Math.min(1, (cost - stopLoss) / range))
  return (
    <div className="relative h-2 rounded-full w-full" style={{ background: C.bg3 }}>
      {/* gradient from green to red */}
      <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(to right, ${C.down}, ${C.flat}, ${C.up})`, opacity: 0.3 }} />
      {/* cost marker */}
      <div className="absolute top-0 h-full w-px" style={{ left: `${costPos * 100}%`, background: C.textMuted }} />
      {/* current price marker */}
      <div className="absolute -top-0.5 w-2.5 h-3 rounded-sm" style={{ left: `${pos * 100}%`, background: current >= cost ? C.up : C.down, transform: 'translateX(-50%)' }} />
    </div>
  )
}

// --- Equity curve placeholder ---
function EquityCurve() {
  const pts: string[] = []
  let y = 150
  for (let i = 0; i <= 60; i++) {
    y = Math.max(20, Math.min(180, y + (Math.random() - 0.42) * 12))
    pts.push(`${i * (600 / 60)},${200 - y}`)
  }
  return (
    <svg width="100%" height="120" viewBox="0 0 600 200" preserveAspectRatio="none" className="opacity-80">
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,200 ${pts.join(' ')} 600,200`} fill="url(#eqGrad)" />
      <polyline points={pts.join(' ')} fill="none" stroke={C.accent} strokeWidth="2" />
    </svg>
  )
}

// --- Donut chart placeholder ---
function DonutChart({ segments }: { segments: { pct: number; color: string; label: string }[] }) {
  let cum = 0
  const r = 36, cx = 50, cy = 50
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      {segments.map((s, i) => {
        const start = cum * 360
        cum += s.pct
        const end = cum * 360
        const sr = (start - 90) * Math.PI / 180
        const er = (end - 90) * Math.PI / 180
        const large = end - start > 180 ? 1 : 0
        const d = `M${cx + r * Math.cos(sr)},${cy + r * Math.sin(sr)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(er)},${cy + r * Math.sin(er)}`
        return <path key={i} d={d} fill="none" stroke={s.color} strokeWidth="10" />
      })}
      <text x={cx} y={cy + 4} textAnchor="middle" fill={C.text} fontSize="12" fontWeight="bold">持倉</text>
    </svg>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function TradePage() {
  const [activeGroup, setActiveGroup] = useState('core')
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<'orders' | 'positions' | 'risk'>('orders')
  const [bottomTab, setBottomTab] = useState<'performance' | 'strategy'>('performance')

  const stocks = watchlistData[activeGroup] || []
  const selected = stocks.find(s => s.symbol === selectedStock)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg0, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* === TOP: Navigation Bar === */}
      <div className="flex items-center border-b" style={{ borderColor: C.border, background: C.bg1 }}>
        <a href="/" className="px-4 py-2 text-sm font-bold shrink-0" style={{ color: C.accent }}>← Hub</a>
        <div className="flex-1" />
        <div className="px-4 py-2 text-xs shrink-0" style={{ color: C.textMuted }}>
          2026/02/13 13:30 盤中
        </div>
      </div>

      {/* === TOP: Market Ticker (marquee) === */}
      <div className="border-b overflow-hidden relative" style={{ borderColor: C.border, background: C.bg0 }}>
        <div className="flex items-center gap-0 animate-marquee whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
          {[...indices, ...indices].map((idx, i) => (
            <div key={i} className="flex items-center gap-2 px-5 py-2 shrink-0">
              <span className="text-xs" style={{ color: C.textMuted }}>{idx.name}</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(idx.value)}
              </span>
              <span className="text-xs font-medium tabular-nums" style={{ color: clr(idx.change), fontVariantNumeric: 'tabular-nums' }}>
                {fmtP(idx.change)} ({fmtPct(idx.pct)})
              </span>
            </div>
          ))}
        </div>
        <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      </div>

      {/* === MAIN AREA === */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-auto">
        {/* === LEFT: Watchlist + Detail === */}
        <div className="flex-1 flex flex-col lg:border-r overflow-hidden" style={{ borderColor: C.border }}>
          {/* Tab bar */}
          <div className="flex items-center border-b overflow-x-auto" style={{ borderColor: C.border, background: C.bg1 }}>
            {defaultGroups.map(g => (
              <button
                key={g.id}
                onClick={() => { setActiveGroup(g.id); setSelectedStock(null) }}
                className="px-4 py-2.5 text-sm whitespace-nowrap transition-colors shrink-0"
                style={{
                  color: activeGroup === g.id ? C.text : C.textMuted,
                  background: activeGroup === g.id ? C.bg2 : 'transparent',
                  borderBottom: activeGroup === g.id ? `2px solid ${g.isAI ? C.warn : C.accent}` : '2px solid transparent',
                }}
              >
                {groupIcons[g.icon]} {g.name}
              </button>
            ))}
            <div className="flex-1" />
            <button className="px-3 py-2 text-xs" style={{ color: C.textMuted }}>+ 新分組</button>
          </div>

          {/* Watchlist table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr className="sticky top-0" style={{ background: C.bg1 }}>
                  {['代碼', '名稱', '現價', '漲跌', '漲跌%', '成交量', '開盤', '最高', '最低', 'PE', '殖利率', '外資', '投信', '走勢'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium border-b whitespace-nowrap" style={{ color: C.textMuted, borderColor: C.border, fontSize: 11 }}>
                      {h}
                    </th>
                  ))}
                  {activeGroup === 'ai-pick' && <th className="px-3 py-2 text-left font-medium border-b" style={{ color: C.textMuted, borderColor: C.border, fontSize: 11 }}>信號</th>}
                </tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr
                    key={s.symbol}
                    onClick={() => setSelectedStock(selectedStock === s.symbol ? null : s.symbol)}
                    className="cursor-pointer transition-colors"
                    style={{
                      background: selectedStock === s.symbol ? C.bg3 : 'transparent',
                    }}
                    onMouseEnter={e => { if (selectedStock !== s.symbol) (e.currentTarget.style.background = C.bg2) }}
                    onMouseLeave={e => { if (selectedStock !== s.symbol) (e.currentTarget.style.background = 'transparent') }}
                  >
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: C.accent }}>{s.symbol}</td>
                    <td className="px-3 py-2" style={{ color: C.text }}>{s.name}</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: clr(s.change) }}>{fmt(s.price)}</td>
                    <td className="px-3 py-2" style={{ color: clr(s.change) }}>{fmtP(s.change)}</td>
                    <td className="px-3 py-2 font-medium" style={{ color: clr(s.change), background: clrBg(s.change) }}>
                      {fmtPct(s.pct)}
                    </td>
                    <td className="px-3 py-2" style={{ color: C.textDim }}>{fmt(s.volume)}</td>
                    <td className="px-3 py-2" style={{ color: C.textDim }}>{fmt(s.open)}</td>
                    <td className="px-3 py-2" style={{ color: C.textDim }}>{fmt(s.high)}</td>
                    <td className="px-3 py-2" style={{ color: C.textDim }}>{fmt(s.low)}</td>
                    <td className="px-3 py-2" style={{ color: C.textDim }}>{s.pe > 0 ? s.pe.toFixed(1) : '-'}</td>
                    <td className="px-3 py-2" style={{ color: s.yield >= 5 ? C.warn : C.textDim }}>{s.yield > 0 ? s.yield.toFixed(1) + '%' : '-'}</td>
                    <td className="px-3 py-2" style={{ color: clr(s.foreign) }}>{fmt(s.foreign)}</td>
                    <td className="px-3 py-2" style={{ color: clr(s.trust) }}>{fmt(s.trust)}</td>
                    <td className="px-3 py-1"><Sparkline up={s.change >= 0} /></td>
                    {activeGroup === 'ai-pick' && s.signal && (
                      <td className="px-3 py-2"><SignalBadge score={s.signal} /></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail panel (expandable) */}
          {selected && (
            <div className="border-t p-4" style={{ borderColor: C.border, background: C.bg1, minHeight: 220 }}>
              <div className="flex items-start gap-6">
                {/* Left: Stock info */}
                <div className="shrink-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-bold" style={{ color: C.accent }}>{selected.symbol}</span>
                    <span className="text-lg font-semibold" style={{ color: C.text }}>{selected.name}</span>
                    <span className="text-2xl font-bold tabular-nums" style={{ color: clr(selected.change) }}>{fmt(selected.price)}</span>
                    <span className="text-sm" style={{ color: clr(selected.change) }}>{fmtP(selected.change)} ({fmtPct(selected.pct)})</span>
                  </div>
                  <div className="grid grid-cols-4 gap-x-6 gap-y-2 text-xs">
                    {[
                      ['開盤', fmt(selected.open)], ['最高', fmt(selected.high)], ['最低', fmt(selected.low)], ['成交量', fmt(selected.volume) + '張'],
                      ['MA5', fmt(selected.ma5)], ['MA20', fmt(selected.ma20)], ['RSI(14)', selected.rsi.toFixed(1)], ['PE', selected.pe > 0 ? selected.pe.toFixed(1) : '-'],
                      ['殖利率', selected.yield > 0 ? selected.yield.toFixed(1) + '%' : '-'], ['外資', fmt(selected.foreign)], ['投信', fmt(selected.trust)], ['', ''],
                    ].map(([label, val], i) => label ? (
                      <div key={i}>
                        <span style={{ color: C.textMuted }}>{label} </span>
                        <span className="font-medium tabular-nums" style={{ color: C.text }}>{val}</span>
                      </div>
                    ) : <div key={i} />)}
                  </div>
                  {selected.signal && selected.reason && (
                    <div className="mt-3 px-3 py-2 rounded text-xs" style={{ background: C.warnBg, color: C.warn }}>
                      <Brain size={14} className="inline" /> AI 信號 <SignalBadge score={selected.signal} /> — {selected.reason}
                    </div>
                  )}
                </div>
                {/* Right: Chart placeholder */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex gap-2 text-xs">
                    {['1D', '5D', '1M', '3M', '1Y'].map(t => (
                      <button key={t} className="px-2 py-1 rounded" style={{ background: t === '1D' ? C.bg3 : 'transparent', color: t === '1D' ? C.text : C.textMuted }}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="rounded flex items-center justify-center" style={{ background: C.bg2, border: `1px solid ${C.border}`, height: 140 }}>
                    <div className="text-center">
                      <svg width="200" height="80" viewBox="0 0 200 80">
                        {/* Simple candlestick placeholder */}
                        {Array.from({ length: 15 }, (_, i) => {
                          const o = 20 + Math.random() * 40
                          const c = 20 + Math.random() * 40
                          const h = Math.max(o, c) + Math.random() * 10
                          const l = Math.min(o, c) - Math.random() * 10
                          const up = c < o
                          return (
                            <g key={i}>
                              <line x1={i * 13 + 6} y1={h} x2={i * 13 + 6} y2={l} stroke={up ? C.up : C.down} strokeWidth="1" />
                              <rect x={i * 13 + 3} y={Math.min(o, c)} width="6" height={Math.abs(c - o) || 1} fill={up ? C.up : C.down} />
                            </g>
                          )
                        })}
                      </svg>
                      <p className="text-xs mt-1" style={{ color: C.textMuted }}>K 線圖（將接入即時數據）</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === RIGHT: Orders / Positions / Risk === */}
        <div className="flex flex-col lg:w-[380px] w-full" style={{ background: C.bg1 }}>
          {/* Right tabs */}
          <div className="flex border-b" style={{ borderColor: C.border }}>
            {([['orders', '交易', todayOrders.length, <ClipboardList key="o" size={14} />], ['positions', '持倉', positions.length, <DollarSign key="p" size={14} />], ['risk', '風控', null, <Shield key="r" size={14} />]] as const).map(([key, label, count, icon]) => (
              <button
                key={key}
                onClick={() => setRightTab(key)}
                className="flex-1 py-2.5 text-xs font-medium transition-colors"
                style={{
                  color: rightTab === key ? C.text : C.textMuted,
                  borderBottom: rightTab === key ? `2px solid ${C.accent}` : '2px solid transparent',
                }}
              >
                <span className="inline-flex items-center gap-1">{icon} {label}</span>{count != null && <span className="ml-1 px-1.5 rounded-full text-[10px]" style={{ background: C.bg3 }}>{count}</span>}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-3">
            {/* Orders tab */}
            {rightTab === 'orders' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium" style={{ color: C.textDim }}>今日交易 ({todayOrders.length})</span>
                  <div className="flex gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: C.upBg, color: C.up }}>已實現 +$10,000</span>
                  </div>
                </div>
                {todayOrders.map((o, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ color: '#fff', background: o.action === 'BUY' ? C.up : C.down }}
                        >
                          {o.action === 'BUY' ? '買進' : '賣出'}
                        </span>
                        <span className="text-sm font-bold" style={{ color: C.accent }}>{o.symbol}</span>
                        <span className="text-xs" style={{ color: C.textDim }}>{o.name}</span>
                      </div>
                      <span className="text-[10px]" style={{
                        color: o.status === 'filled' ? C.down : o.status === 'partial' ? C.warn : C.textMuted,
                      }}>
                        {o.status === 'filled' ? '已成交' : o.status === 'partial' ? '部分成交' : '委託中'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span style={{ color: C.textMuted }}>{o.time}</span>
                      <span style={{ color: C.textDim }}>{o.qty} 張 × ${fmt(o.filled || o.price)}</span>
                      <span className="font-medium" style={{ color: C.text }}>${fmt((o.filled || o.price) * o.qty * 1000)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Positions tab */}
            {rightTab === 'positions' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium" style={{ color: C.textDim }}>持倉 ({positions.length})</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: C.up }}>
                    未實現 +${fmt(positions.reduce((s, p) => s + (p.current - p.avgCost) * p.qty * 1000, 0))}
                  </span>
                </div>
                {positions.map((p, i) => {
                  const pnl = (p.current - p.avgCost) * p.qty * 1000
                  const pnlPct = ((p.current - p.avgCost) / p.avgCost * 100)
                  const commission = p.current * p.qty * 1000 * 0.001425 * 0.28
                  const tax = p.current * p.qty * 1000 * 0.003
                  const netPnl = pnl - commission - tax
                  return (
                    <div key={i} className="rounded-lg p-3" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: C.accent }}>{p.symbol}</span>
                          <span className="text-xs" style={{ color: C.textDim }}>{p.name}</span>
                          <span className="text-[10px]" style={{ color: C.textMuted }}>{p.qty}張</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold tabular-nums" style={{ color: clr(pnl) }}>{pnl >= 0 ? '+' : ''}{fmt(Math.round(netPnl))}</div>
                          <div className="text-[10px] tabular-nums" style={{ color: clr(pnl) }}>{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] mb-2" style={{ color: C.textMuted }}>
                        <span>成本 {fmt(p.avgCost)}</span>
                        <span>現價 <span style={{ color: clr(p.current - p.avgCost) }}>{fmt(p.current)}</span></span>
                        <span>費用 {Math.round(commission + tax).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]" style={{ color: C.textMuted }}>
                        <span>停損 {fmt(p.stopLoss)}</span>
                        <div className="flex-1">
                          <StopTakeBar current={p.current} cost={p.avgCost} stopLoss={p.stopLoss} takeProfit={p.takeProfit} />
                        </div>
                        <span>停利 {fmt(p.takeProfit)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Risk tab */}
            {rightTab === 'risk' && (
              <div className="space-y-4">
                <div className="text-xs font-medium mb-2" style={{ color: C.textDim }}>風險儀表板</div>
                {/* Portfolio allocation donut */}
                <div className="flex items-center gap-4">
                  <DonutChart segments={[
                    { pct: 0.35, color: C.accent, label: '半導體' },
                    { pct: 0.25, color: C.up, label: '金融' },
                    { pct: 0.20, color: C.warn, label: 'AI' },
                    { pct: 0.12, color: '#8b5cf6', label: '航運' },
                    { pct: 0.08, color: C.textMuted, label: '現金' },
                  ]} />
                  <div className="text-xs space-y-1.5">
                    {[
                      ['半導體', '35%', C.accent], ['金融', '25%', C.up], ['AI', '20%', C.warn], ['航運', '12%', '#8b5cf6'], ['現金', '8%', C.textMuted],
                    ].map(([l, v, c], i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: c as string }} />
                        <span style={{ color: C.textDim }}>{l}</span>
                        <span className="font-medium tabular-nums" style={{ color: C.text }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk metrics */}
                <div className="space-y-3">
                  {[
                    { label: '單筆最大虧損', current: 1.2, limit: 2, unit: '%' },
                    { label: '當日虧損', current: 0.5, limit: 5, unit: '%' },
                    { label: '週虧損', current: 1.8, limit: 8, unit: '%' },
                    { label: '最大回撤', current: 8.2, limit: 15, unit: '%' },
                    { label: '總曝險', current: 72, limit: 80, unit: '%' },
                    { label: '單一個股上限', current: 12.5, limit: 15, unit: '%' },
                  ].map((r, i) => {
                    const ratio = r.current / r.limit
                    const barColor = ratio > 0.8 ? C.danger : ratio > 0.6 ? C.warn : C.down
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span style={{ color: C.textDim }}>{r.label}</span>
                          <span className="tabular-nums" style={{ color: ratio > 0.8 ? C.danger : C.text }}>
                            {r.current}{r.unit} / {r.limit}{r.unit}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: C.bg3 }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${ratio * 100}%`, background: barColor }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-lg p-3 text-xs" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
                  <div className="font-medium mb-2" style={{ color: C.text }}>風控配置：穩健型</div>
                  <div className="grid grid-cols-2 gap-2" style={{ color: C.textDim }}>
                    <span>凱利係數：½ Kelly</span>
                    <span>融資上限：30%</span>
                    <span>當沖上限：30%</span>
                    <span>產業上限：30%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === BOTTOM: Performance + Strategy === */}
      <div className="border-t" style={{ borderColor: C.border, background: C.bg1, minHeight: 200 }}>
        <div className="flex border-b" style={{ borderColor: C.border }}>
          {([['performance', '📈 綜合績效'], ['strategy', '🎯 策略管理']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setBottomTab(key)}
              className="px-5 py-2.5 text-sm font-medium"
              style={{
                color: bottomTab === key ? C.text : C.textMuted,
                borderBottom: bottomTab === key ? `2px solid ${C.accent}` : '2px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {bottomTab === 'performance' && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 lg:w-[480px]">
                {[
                  { label: '累計損益', value: `+$${fmt(perfData.totalPnl)}`, color: C.up },
                  { label: '今日損益', value: `+$${fmt(perfData.todayPnl)}`, color: C.up },
                  { label: '勝率', value: `${(perfData.winRate * 100).toFixed(1)}%`, color: C.text },
                  { label: '夏普比率', value: perfData.sharpe.toFixed(2), color: perfData.sharpe > 1.5 ? C.up : C.text },
                  { label: '最大回撤', value: `${(perfData.maxDrawdown * 100).toFixed(1)}%`, color: C.warn },
                  { label: '獲利因子', value: perfData.profitFactor.toFixed(2), color: C.text },
                  { label: '總交易次數', value: perfData.totalTrades.toString(), color: C.text },
                  { label: '平均持有天數', value: perfData.avgHoldDays.toFixed(1), color: C.text },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: C.textMuted }}>{s.label}</div>
                    <div className="text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {/* Equity curve */}
              <div className="flex-1 rounded-lg p-3" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
                <div className="text-xs font-medium mb-2" style={{ color: C.textDim }}>權益曲線（近 60 交易日）</div>
                <EquityCurve />
              </div>
            </div>
          )}

          {bottomTab === 'strategy' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {strategies.map((s, i) => (
                <div key={i} className="rounded-lg p-4" style={{ background: C.bg2, border: `1px solid ${s.active ? C.accent : C.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold" style={{ color: C.text }}>{s.name}</span>
                    <div className="flex items-center gap-1">
                      {s.paper && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: C.warnBg, color: C.warn }}>模擬</span>}
                      <div
                        className="w-8 h-4 rounded-full flex items-center cursor-pointer transition-colors"
                        style={{ background: s.active ? C.accent : C.bg3, justifyContent: s.active ? 'flex-end' : 'flex-start', padding: 2 }}
                      >
                        <div className="w-3 h-3 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span style={{ color: C.textMuted }}>勝率 </span>
                      <span className="font-medium tabular-nums" style={{ color: C.text }}>{(s.winRate * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span style={{ color: C.textMuted }}>夏普 </span>
                      <span className="font-medium tabular-nums" style={{ color: C.text }}>{s.sharpe.toFixed(1)}</span>
                    </div>
                    <div>
                      <span style={{ color: C.textMuted }}>報酬 </span>
                      <span className="font-medium tabular-nums" style={{ color: C.up }}>+{(s.return * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span style={{ color: C.textMuted }}>類型 </span>
                      <span className="font-medium" style={{ color: C.textDim }}>{s.type}</span>
                    </div>
                  </div>
                  <div className="mt-3 rounded flex items-center justify-center" style={{ background: C.bg3, height: 50 }}>
                    <span className="text-[10px]" style={{ color: C.textMuted }}>回測曲線 placeholder</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
