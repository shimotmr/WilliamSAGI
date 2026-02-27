'use client'
import { useState, useEffect } from 'react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [usage, setUsage] = useState<any[]>([])

  useEffect(() => {
    // 從 cookie 取 JWT payload（base64 decode）
    const token = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1]
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setProfile(payload)
      } catch {}
    }
    // 最近 7 天 model usage
    fetch('/api/hub/model-usage?days=7').then(r=>r.json()).then(d => setUsage(d.usage || []))
  }, [])

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">個人資訊</h1>
      {profile && (
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
              {profile.name?.[0] || profile.email?.[0] || 'W'}
            </div>
            <div>
              <p className="text-lg font-semibold">{profile.name || '-'}</p>
              <p className="text-gray-500 text-sm">{profile.email}</p>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{profile.role}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-400 text-xs">Token 到期</p><p>{profile.exp ? new Date(profile.exp*1000).toLocaleDateString('zh-TW') : '-'}</p></div>
            <div><p className="text-gray-400 text-xs">登入身份</p><p>{profile.sub}</p></div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-3">近 7 天 AI 使用量</h2>
        {usage.length ? (
          <div className="space-y-2">
            {usage.slice(0,8).map((u:any,i:number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{u.model || u.provider}</span>
                <span className="font-medium">{u.total_tokens?.toLocaleString() || u.count} tokens</span>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400 text-sm">無使用資料</p>}
      </div>
    </div>
  )
}
