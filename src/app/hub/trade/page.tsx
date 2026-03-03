'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function TradePage() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hub/trade/summary')
      .then(r => r.json())
      .then(d => { setSummary(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const links = [
    {href:'/hub/trade/quotes',  label:'即時行情',  icon:'📈'},
    {href:'/hub/trade/positions',label:'持倉',     icon:'💼'},
    {href:'/hub/trade/orders',  label:'委託單',    icon:'📋'},
    {href:'/hub/trade/order',   label:'下單',      icon:'🎯'},
    {href:'/hub/trade/history', label:'成交記錄',  icon:'🕒'},
  ]

  const isConnected = summary?.connected === true
  const pnl = summary?.totalPnl ?? null
  const syncedAt = summary?.syncedAt
    ? new Date(summary.syncedAt).toLocaleString('zh-TW')
    : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">程式交易</h1>
        <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
          isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}/>
          {isConnected ? `已連線 · ${summary?.account?.username ?? ''}` : '未連線'}
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[0,1,2].map(i => (
            <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-16 mb-2"/>
              <div className="h-8 bg-gray-200 rounded w-24"/>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              label: '可用餘額',
              val: summary?.account?.availableBalance != null
                ? `$${Number(summary.account.availableBalance).toLocaleString()}`
                : '-',
            },
            {
              label: '未實現損益',
              val: pnl != null ? `${pnl >= 0 ? '+' : ''}${Number(pnl).toLocaleString()}` : '-',
              pos: pnl != null ? pnl >= 0 : null,
            },
            {
              label: '持倉數',
              val: summary?.positionCount ?? '-',
            },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-gray-400 mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${
                c.pos === false ? 'text-red-500' :
                c.pos === true  ? 'text-green-600' : ''
              }`}>{c.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Account info */}
      {isConnected && summary?.account && (
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 flex flex-wrap gap-4">
          <span>📍 帳號：{summary.account.accountId}</span>
          <span>🏦 券商：{summary.account.brokerId}</span>
          <span>📊 類型：{summary.account.accountType}</span>
          {syncedAt && <span className="text-blue-400 ml-auto">最後同步：{syncedAt}</span>}
        </div>
      )}

      {/* Nav links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className="bg-white rounded-xl shadow p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-3xl">{l.icon}</span>
            <span className="font-medium">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Status note */}
      {!loading && !isConnected && (
        <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-700">
          ⚠️ 尚未取得帳戶資料。請確認 Mac mini 上的 shioaji_sync.py 已執行。
        </div>
      )}
      {!loading && isConnected && summary?.positionCount === 0 && (
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
          📋 目前無持倉。交易時段（09:00–14:30）資料每 5 分鐘自動同步。
        </div>
      )}
    </div>
  )
}
