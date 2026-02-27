export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
export default async function TodayPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: tasks } = await supabase.from('board_tasks').select('id,title,status,priority,assignee').in('status',['執行中','待執行','待派發']).limit(20)
  const pc: Record<string,string> = {'P0':'bg-red-500 text-white','P1':'bg-orange-400 text-white','P2':'bg-yellow-400 text-white','P3':'bg-gray-300 text-gray-700'}
  const sc: Record<string,string> = {'執行中':'bg-blue-100 text-blue-700','待執行':'bg-yellow-100 text-yellow-700','待派發':'bg-gray-100 text-gray-600'}
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">今日總覽</h1>
      <p className="text-gray-500 mb-6">{new Date().toLocaleDateString('zh-TW',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      <div className="space-y-2">
        {(tasks||[]).map((t:any)=>(
          <div key={t.id} className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded font-bold ${pc[t.priority]??'bg-gray-200'}`}>{t.priority}</span>
            <span className="flex-1 text-sm font-medium">{t.title}</span>
            <span className={`text-xs px-2 py-1 rounded ${sc[t.status]??'bg-gray-100'}`}>{t.status}</span>
            <span className="text-xs text-gray-400">{t.assignee}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
