/**
 * Shioaji API Client — 打 Mac mini FastAPI 後端
 */

const SHIOAJI_API_URL = process.env.NEXT_PUBLIC_SHIOAJI_API_URL || 'https://shioaji.williamhsiao.tw'
const SHIOAJI_TOKEN = process.env.NEXT_PUBLIC_SHIOAJI_TOKEN || 'shioaji-william-2026'

async function shioajiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = `${SHIOAJI_API_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${SHIOAJI_TOKEN}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Shioaji API ${res.status}: ${text}`)
  }
  return res.json()
}

// ── Types ──

export interface Snapshot {
  code: string
  name: string
  exchange: string
  open: number
  high: number
  low: number
  close: number
  change_price: number
  change_rate: number
  change_type: string
  average_price: number
  volume: number
  total_volume: number
  amount: number
  total_amount: number
  yesterday_volume: number
  buy_price: number
  buy_volume: number
  sell_price: number
  sell_volume: number
  volume_ratio: number
  tick_type: string
  ts: number
}

export interface Position {
  code: string
  direction: string
  quantity: number
  price: number
  last_price: number
  pnl: number
  yd_quantity?: number
  cond?: string
}

export interface TradeOrder {
  contract: { code: string; name: string }
  order: {
    id: string; action: string; price: number; quantity: number
    price_type: string; order_type: string; seqno: string; ordno: string
  }
  status: {
    id: string; status: string; status_code: string
    order_datetime: string; deals: { price: number; quantity: number }[]
  }
}

export interface AccountBalance {
  status: string
  acc_balance: number
  date: string
  errmsg: string
}

export interface TradingLimits {
  trading_limit: number
  trading_used: number
  trading_available: number
  margin_limit: number
  margin_used: number
  margin_available: number
  error?: string
}

export interface ContractResult {
  code: string
  name: string
  exchange: string
  reference: number
  limit_up: number
  limit_down: number
  day_trade: string
  type: string
}

export interface ProfitLoss {
  id: number
  code: string
  quantity: number
  price: number
  pnl: number
  date: string
  pr_ratio?: number
  cond?: string
}

// ── API Functions ──

export async function getHealth() {
  return shioajiFetch<{ ok: boolean; connected: boolean; time: string }>('/api/health')
}

export async function getSnapshots(symbols: string[]) {
  return shioajiFetch<{ snapshots: Snapshot[] }>(
    `/api/quote/snapshot?symbols=${symbols.join(',')}`
  )
}

export async function getAccountBalance() {
  return shioajiFetch<AccountBalance>('/api/account/balance')
}

export async function getTradingLimits() {
  return shioajiFetch<TradingLimits>('/api/account/trading-limits')
}

export async function getStockPositions() {
  return shioajiFetch<{ positions: Position[] }>('/api/positions/stock')
}

export async function getFuturesPositions() {
  return shioajiFetch<{ positions: Position[] }>('/api/positions/futures')
}

export async function getOrders() {
  return shioajiFetch<{ orders: TradeOrder[] }>('/api/orders')
}

export async function placeOrder(order: {
  symbol: string; action: string; price: number; quantity: number
  price_type?: string; order_type?: string; order_lot?: string
}) {
  return shioajiFetch<{ ok: boolean; trade: TradeOrder }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  })
}

export async function cancelOrder(tradeId: string) {
  return shioajiFetch<{ ok: boolean }>(`/api/orders/${tradeId}`, { method: 'DELETE' })
}

export async function searchContracts(q: string) {
  return shioajiFetch<{ results: ContractResult[] }>(`/api/contracts/search?q=${encodeURIComponent(q)}`)
}

export async function getProfitLoss(beginDate: string, endDate: string) {
  return shioajiFetch<{ profit_loss: ProfitLoss[] }>(
    `/api/profit-loss?begin_date=${beginDate}&end_date=${endDate}`
  )
}

export async function getProfitLossSummary(beginDate: string, endDate: string) {
  return shioajiFetch<{ items: any[]; total: any }>(
    `/api/profit-loss/summary?begin_date=${beginDate}&end_date=${endDate}`
  )
}

export async function getSettlements() {
  return shioajiFetch<{ settlements: { date: string; amount: number; T: number }[] }>('/api/settlements')
}

export async function getKbars(symbol: string, start: string, end: string) {
  return shioajiFetch<{ ts: string[]; Open: number[]; High: number[]; Low: number[]; Close: number[]; Volume: number[] }>(
    `/api/quote/kbars?symbol=${symbol}&start=${start}&end=${end}`
  )
}
