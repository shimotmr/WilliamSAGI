'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Breadcrumb from '@/components/Breadcrumb'

const STAGE_COLORS: Record<string,string> = {
  '簽約':'text-green-600','出貨':'text-blue-600','報價':'text-yellow-600','詢價':'text-gray-500','結案':'text-gray-400',
}

export default function PortalDashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/portal/dashboard').then(r=>r.json()).then(setData)
  }, [])

  const s = data?.summary || {}
  const stageMap = data?.stageMap || {}
  const recent = data?.recentCases || []

  return (
    <div className="p-6 space-y-6">
      <Header context="portal" />
      <Breadcrumb items={[{label:'Portal',href:'/portal'},{label:'Dashboard'}]} />
      <h1 className="text-2xl font-bold">業務儀表板</h1>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-400 mb-1">本月業績</p>
          <p className="text-2xl font-bold">{s.monthActual != null ? `${(s.monthActual/10000).toFixed(0)}萬` : '-'}</p>
          {s.monthRate != null && <p className={`text-sm mt-1 font-medium ${s.monthRate>=100?'text-green-600':'text-orange-500'}`}>達成率 {s.monthRate}%</p>}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-400 mb-1">本月目標</p>
          <p className="text-2xl font-bold">{s.monthTarget != null ? `${(s.monthTarget/10000).toFixed(0)}萬` : '-'}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-400 mb-1">Pipeline 預期</p>
          <p className="text-2xl font-bold">{s.pipeline != null ? `${(s.pipeline/10000).toFixed(0)}萬` : '-'}</p>
          <p className="text-xs text-gray-400 mt-1">詢價+報價中</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-400 mb-1">進行中報價</p>
          <p className="text-2xl font-bold">{s.activeQuotes ?? '-'}</p>
          <p className="text-xs text-gray-400 mt-1">已送出待回覆</p>
        </div>
      </div>

      {/* 案件狀態分布 */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">案件狀態分布</h2>
          <Link href="/portal/cases" className="text-xs text-blue-600 hover:underline">查看全部 →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['詢價','報價','簽約','出貨'].map(stage => (
            <div key={stage} className="text-center p-3 bg-gray-50 rounded-xl">
              <p className={`text-2xl font-bold ${STAGE_COLORS[stage]}`}>{stageMap[stage]?.count ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">{stage}</p>
              <p className="text-xs text-gray-400">{stageMap[stage]?.amount ? `${(stageMap[stage].amount/10000).toFixed(0)}萬` : '-'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 最近案件 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3 border-b">
          <h2 className="font-semibold">最近更新案件</h2>
          <Link href="/portal/cases" className="text-xs text-blue-600 hover:underline">查看全部 →</Link>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-50">
            {recent.map((c:any) => (
              <tr key={c.id} className="hover:bg-gray-50 px-5">
                <td className="p-3 pl-5 font-medium">{c.end_customer}</td>
                <td className="p-3 text-gray-500 text-xs">{c.dealer}</td>
                <td className="p-3"><span className={`text-xs font-medium ${STAGE_COLORS[c.stage]}`}>{c.stage}</span></td>
                <td className="p-3 text-right text-sm">{c.amount ? `${(c.amount/10000).toFixed(1)}萬` : '-'}</td>
                <td className="p-3 pr-5 text-gray-400 text-xs">{c.rep}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 快速連結 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {href:'/portal/cases',label:'案件管理',icon:'📋'},
          {href:'/portal/performance',label:'業績達成',icon:'📊'},
          {href:'/portal/products',label:'產品目錄',icon:'🤖'},
          {href:'/portal/quotations',label:'報價管理',icon:'📄'},
          {href:'/portal/employees',label:'員工通訊錄',icon:'👥'},
          {href:'/portal/knowledge',label:'SOP知識庫',icon:'📚'},
          {href:'/portal/admin/dealers',label:'經銷商',icon:'🏢'},
          {href:'/portal/admin/allowlist',label:'白名單',icon:'🔑'},
        ].map(l=>(
          <Link key={l.href} href={l.href} className="bg-white rounded-xl shadow p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="text-2xl">{l.icon}</span>
            <span className="text-sm font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
