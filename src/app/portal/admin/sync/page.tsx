'use client'
import { useState } from 'react'
type UploadType = 'leads' | 'inventory' | 'cases'
const CONFIGS: Record<UploadType,{label:string;desc:string;accept:string}> = {
  leads:     {label:'詢問清單 (Leads)',desc:'Excel/CSV → leads 表',accept:'.xlsx,.csv'},
  inventory: {label:'庫存報表',       desc:'Excel → inventory 表',accept:'.xlsx,.csv'},
  cases:     {label:'DMS 案件',       desc:'Excel/CSV → cases 表',accept:'.xlsx,.csv'},
}
export default function SyncPage() {
  const [type, setType] = useState<UploadType>('leads')
  const [file, setFile] = useState<File|null>(null)
  const [status, setStatus] = useState('')
  const upload = async () => {
    if (!file) return
    setStatus('上傳中...')
    const form = new FormData()
    form.append('file', file)
    form.append('type', type)
    try {
      const res = await fetch('/api/portal/sync-upload', {method:'POST', body:form})
      const data = await res.json()
      setStatus(data.ok ? `✅ 匯入 ${data.rows} 筆` : `❌ ${data.error}`)
    } catch { setStatus('❌ 上傳失敗') }
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">資料同步入口</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex gap-2 mb-4">
          {(Object.keys(CONFIGS) as UploadType[]).map(t=>(
            <button key={t} onClick={()=>setType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${type===t?'bg-blue-600 text-white':'bg-gray-100 text-gray-600'}`}>
              {CONFIGS[t].label}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mb-4">{CONFIGS[type].desc}</p>
        <input type="file" accept={CONFIGS[type].accept} onChange={e=>setFile(e.target.files?.[0]||null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 mb-4"/>
        <button onClick={upload} disabled={!file} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50">上傳匯入</button>
        {status && <p className="mt-3 text-sm font-medium">{status}</p>}
      </div>
    </div>
  )
}
