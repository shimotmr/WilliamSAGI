export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
export default async function AlertsPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: alerts } = await supabase.from('alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(50).catch(() => ({ data: null }))
  const sc: Record<string,string> = {critical:'border-red-500 bg-red-50',high:'border-orange-400 bg-orange-50',medium:'border-yellow-400 bg-yellow-50'}
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">管理預警</h1>
      {!(alerts?.length) ? <p className="text-gray-500">目前無未處理警報 ✅</p> : (
        <div className="space-y-3">
          {alerts!.map((a: any) => (
            <div key={a.id} className={`rounded-xl shadow p-4 border-l-4 ${sc[a.severity]??'border-gray-300 bg-gray-50'}`}>
              <p className="font-medium text-sm">{a.message}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(a.created_at).toLocaleString('zh-TW')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
