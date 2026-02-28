export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Header from '@/components/Header'
import Breadcrumb from '@/components/Breadcrumb'

export default async function ReportsPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: reports } = await supabase.from('reports').select('id,title,author,type,created_at').order('created_at', { ascending: false }).limit(50)
  return (
    <div className="p-6">
      <Header context="hub" />
      <Breadcrumb items={[{label:'Hub',href:'/hub'},{label:'報告'}]} />
      <h1 className="text-2xl font-bold mt-4 mb-6">報告庫</h1>
      <div className="space-y-3">
        {(reports || []).map((r: any) => (
          <div key={r.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
            <div><p className="font-medium">{r.title}</p><p className="text-sm text-gray-500">{r.author} · {r.type} · {new Date(r.created_at).toLocaleDateString('zh-TW')}</p></div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">#{r.id}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
