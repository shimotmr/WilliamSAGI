'use client'
import Link from 'next/link'

export default function MarketingPage() {
  const sections = [
    {href:'/portal/marketing/videos',label:'產品影片',icon:'🎬',desc:'Pudu 機器人產品介紹影片'},
    {href:'/portal/marketing/slides',label:'簡報資源',icon:'📊',desc:'銷售簡報、提案文件'},
    {href:'/portal/marketing/walker-docs',label:'步行者文件',icon:'📄',desc:'Walker 系列技術文件'},
  ]
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">數位行銷資源庫</h1>
      <p className="text-gray-500 text-sm mb-6">業務用影片、簡報、技術文件集中管理</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map(s=>(
          <Link key={s.href} href={s.href} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">{s.icon}</div>
            <h2 className="font-semibold mb-1">{s.label}</h2>
            <p className="text-sm text-gray-500">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
