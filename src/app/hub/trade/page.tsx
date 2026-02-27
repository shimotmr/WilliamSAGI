'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function TradePage() {
  const [summary, setSummary] = useState<any>(null)
  useEffect(() => {
    fetch('/api/hub/trade/summary').then(r=>r.json()).then(setSummary).catch(()=>{})
  }, [])

  const links = [
    {href:'/hub/trade/quotes',label:'即時行情',icon:'📈'},
    {href:'/hub/trade/positions',label:'持倉',icon:'💼'},
    {href:'/hub/trade/orders',label:'委託單',icon:'📋'},
    {href:'/hub/trade/order',label:'下單',icon:'🎯'},
    {href:'/hub/trade/history',label:'成交記錄',icon:'🕒'},
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">程式交易</h1>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {label:'總資產',val:summary.totalAsset?.toLocaleString()},
            {label:'今日損益',val:summary.todayPnl?.toLocaleString(),pos:summary.todayPnl>=0},
            {label:'持倉數',val:summary.positionCount},
          ].map(c=>(
            <div key={c.label} className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-gray-400 mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${c.pos===false?'text-red-500':c.pos?'text-green-600':''}`}>{c.val??'-'}</p>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {links.map(l=>(
          <Link key={l.href} href={l.href} className="bg-white rounded-xl shadow p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-3xl">{l.icon}</span>
            <span className="font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
      <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-700">
        ⚠️ 需要 Shioaji API 連線才能取得即時資料。請確認 <code>user_shioaji_credentials</code> 已設定。
      </div>
    </div>
  )
}
