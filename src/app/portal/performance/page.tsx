'use client'
import { useState, useEffect } from 'react'

interface RepPerf { rep: string; target: number; actual: number; rate: number }
interface TrendItem { month: number; target: number; actual: number; rate: number }
interface FunnelItem { stage: string; count: number; amount: number; rate: number }
interface RepRank { rep: string; target: number; actual: number; amount: number; rate: number }
interface DealerRank { dealer: string; count: number; amount: number; expected: number }
interface Expiring { rep: string; dealer: string; end_customer: string; ship_date: string; amount: number; stage: string; daysOverdue: number }

export default function PerformancePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<{
    summary: RepPerf[]
    totalTarget: number
    totalActual: number
    totalRate: number
    ytd: { target: number; actual: number; rate: number }
    monthlyTrend: TrendItem[]
    funnel: FunnelItem[]
    repRanking: RepRank[]
    dealerRanking: DealerRank[]
    expiring: Expiring[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview'|'trend'|'funnel'|'ranking'|'expiring'>('overview')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/portal/performance?year=${year}&month=${month}`)
      .then(r=>r.json()).then(d=>{setData(d); setLoading(false)})
  }, [year, month])

  const totalTarget = data?.totalTarget || 0
  const totalActual = data?.totalActual || 0
  const totalRate = data?.totalRate || 0

  const formatMoney = (v: number) => v >= 10000 ? `${(v/10000).toFixed(0)}萬` : `${v}`

  // 圖表顏色
  const getBarColor = (rate: number) => rate >= 100 ? 'bg-green-500' : rate >= 60 ? 'bg-blue-500' : 'bg-orange-400'
  const funnelColors = ['bg-blue-400','bg-green-400','bg-yellow-400','bg-red-400']

  if (loading) return <div className="p-6 text-gray-400">載入中...</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">業績達成</h1>
        <div className="flex gap-2">
          <select value={year} onChange={e=>setYear(+e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e=>setMonth(+e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m}>{m}月</option>)}
          </select>
        </div>
      </div>

      {/* Tab 導航 */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          {key:'overview',label:'總覽'},
          {key:'trend',label:'月度趨勢'},
          {key:'funnel',label:'Funnel'},
          {key:'ranking',label:'排名'},
          {key:'expiring',label:'過期預警'},
        ].map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key as typeof activeTab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab===t.key?'bg-white shadow text-blue-600':'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 總覽區域 */}
      {activeTab === 'overview' && (
        <>
          {/* YTD + 本月卡片 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow p-4 text-white">
              <p className="text-xs text-blue-100 mb-1">本月目標</p>
              <p className="text-2xl font-bold">{formatMoney(totalTarget)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow p-4 text-white">
              <p className="text-xs text-green-100 mb-1">本月業績</p>
              <p className="text-2xl font-bold">{formatMoney(totalActual)}</p>
            </div>
            <div className={`rounded-xl shadow p-4 ${totalRate>=100?'bg-green-50':totalRate>=60?'bg-blue-50':'bg-orange-50'}`}>
              <p className="text-xs text-gray-400 mb-1">本月達成率</p>
              <p className={`text-2xl font-bold ${totalRate>=100?'text-green-600':totalRate>=60?'text-blue-600':'text-orange-500'}`}>{totalRate}%</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow p-4 text-white">
              <p className="text-xs text-purple-100 mb-1">YTD 達成率</p>
              <p className="text-2xl font-bold">{data?.ytd?.rate || 0}%</p>
              <p className="text-xs text-purple-200">{formatMoney(data?.ytd?.actual||0)} / {formatMoney(data?.ytd?.target||0)}</p>
            </div>
          </div>

          {/* 個人達成表 */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-sm">個人達成</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-3 text-left">業務</th>
                  <th className="p-3 text-right">目標</th>
                  <th className="p-3 text-right">業績</th>
                  <th className="p-3 text-left">達成率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.summary||[]).map(r=>(
                  <tr key={r.rep}>
                    <td className="p-3 font-medium">{r.rep}</td>
                    <td className="p-3 text-right text-gray-500">{formatMoney(r.target)}</td>
                    <td className="p-3 text-right font-medium">{formatMoney(r.actual)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[100px]">
                          <div className={`h-2 rounded-full ${getBarColor(r.rate)}`} style={{width:`${Math.min(r.rate,100)}%`}}/>
                        </div>
                        <span className={`text-xs font-medium w-10 text-right ${r.rate>=100?'text-green-600':''}`}>{r.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {!(data?.summary?.length) && <tr><td colSpan={4} className="p-6 text-center text-gray-400">無資料</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 月度趨勢 */}
      {activeTab === 'trend' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-4">{year}年月度趨勢</h3>
          <div className="flex items-end gap-2 h-64">
            {(data?.monthlyTrend||[]).map(t=>(
              <div key={t.month} className="flex-1 flex flex-col items-center">
                <div className="w-full flex gap-1 h-48 items-end">
                  <div className="flex-1 bg-gray-200 rounded-t" style={{height:`${Math.min((t.target/(Math.max(...(data?.monthlyTrend||[]).map(x=>x.target)||[1])))*100),100)}%`}} title={`目標: ${formatMoney(t.target)}`}/>
                  <div className="flex-1 bg-blue-500 rounded-t" style={{height:`${Math.min((t.actual/(Math.max(...(data?.monthlyTrend||[]).map(x=>x.actual)||[1])))*100),100)}%`}} title={`業績: ${formatMoney(t.actual)}`}/>
                </div>
                <span className="text-xs text-gray-500 mt-2">{t.month}月</span>
                <span className={`text-xs font-medium ${t.rate>=100?'text-green-600':t.rate>=60?'text-blue-600':'text-orange-500'}`}>{t.rate}%</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 rounded"/>目標</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"/>業績</span>
          </div>
        </div>
      )}

      {/* Funnel */}
      {activeTab === 'funnel' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-4">案件漏斗</h3>
          <div className="space-y-3">
            {(data?.funnel||[]).map((f, i) => (
              <div key={f.stage} className="flex items-center gap-4">
                <span className="w-16 text-sm font-medium">{f.stage}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div className={`h-full ${funnelColors[i]} rounded-lg flex items-center justify-end pr-2`} style={{width:`${f.rate}%`}}>
                    <span className="text-xs font-medium text-white">{f.count}件</span>
                  </div>
                </div>
                <span className="w-20 text-right text-sm text-gray-500">{formatMoney(f.amount)}</span>
                <span className="w-12 text-right text-sm font-medium">{f.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 排名 */}
      {activeTab === 'ranking' && (
        <div className="grid grid-cols-2 gap-6">
          {/* 業務績效排名 */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-sm">業務績效排名 (YTD)</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">業務</th>
                  <th className="p-2 text-right">目標</th>
                  <th className="p-2 text-right">業績</th>
                  <th className="p-2 text-right">達成率</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data?.repRanking||[]).map((r, i)=>(
                  <tr key={r.rep} className={i<3?'bg-yellow-50':''}>
                    <td className="p-2 font-medium">{i+1}</td>
                    <td className="p-2">{r.rep}</td>
                    <td className="p-2 text-right text-gray-500">{formatMoney(r.target)}</td>
                    <td className="p-2 text-right font-medium">{formatMoney(r.actual)}</td>
                    <td className="p-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.rate>=100?'bg-green-100 text-green-700':r.rate>=60?'bg-blue-100 text-blue-700':'bg-orange-100 text-orange-700'}`}>{r.rate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 經銷商排名 */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-sm">經銷商排名</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">經銷商</th>
                  <th className="p-2 text-right">案件數</th>
                  <th className="p-2 text-right">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data?.dealerRanking||[]).map((d, i)=>(
                  <tr key={d.dealer}>
                    <td className="p-2 font-medium">{i+1}</td>
                    <td className="p-2">{d.dealer}</td>
                    <td className="p-2 text-right text-gray-500">{d.count}</td>
                    <td className="p-2 text-right font-medium">{formatMoney(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 過期預警 */}
      {activeTab === 'expiring' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b bg-red-50">
            <h3 className="font-semibold text-sm text-red-700">過期預警 (出貨日已過)</h3>
          </div>
          {(data?.expiring?.length) ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-3 text-left">業務</th>
                  <th className="p-3 text-left">經銷商</th>
                  <th className="p-3 text-left">終端客戶</th>
                  <th className="p-3 text-left">出貨日</th>
                  <th className="p-3 text-left">天數</th>
                  <th className="p-3 text-right">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.expiring.map(e=>(
                  <tr key={`${e.rep}-${e.ship_date}`} className="hover:bg-red-50">
                    <td className="p-3 font-medium">{e.rep}</td>
                    <td className="p-3 text-gray-600">{e.dealer}</td>
                    <td className="p-3">{e.end_customer}</td>
                    <td className="p-3 text-gray-500">{e.ship_date}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">超 {e.daysOverdue} 天</span></td>
                    <td className="p-3 text-right font-medium">{formatMoney(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-400">無過期案件</div>
          )}
        </div>
      )}
    </div>
  )
}
