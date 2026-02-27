export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

export default async function ApprovalsPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  let items: any[] = []
  try {
    const { data } = await supabase.from('approval_queue').select('*').eq('status', '待審核').order('created_at', { ascending: false }).limit(20)
    items = data || []
  } catch {}

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">簽核中心</h1>
      {!items.length
        ? <p className="text-gray-500">目前無待簽核項目 ✅</p>
        : (
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{item.subject}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.from_name} · {new Date(item.created_at).toLocaleString('zh-TW')}</p>
                    {item.summary && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">{item.summary}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={`/api/hub/approve?id=${item.id}&action=approve`} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg">批准</a>
                    <a href={`/api/hub/approve?id=${item.id}&action=reject`} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg">退回</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
