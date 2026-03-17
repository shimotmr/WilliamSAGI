'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface WecomMessage {
  id: number
  content: string
  sender_name: string
  send_time: string
  company?: string
}

export default function WecomPage() {
  const [messages, setMessages] = useState<WecomMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hub/wecom?limit=50')
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="WeCom 訊息歸類" description="企業微信訊息查看與分類" />
      {loading ? (
        <div style={{ color: '#8A8F98', padding: '4rem 0', textAlign: 'center' }}>載入中…</div>
      ) : messages.length === 0 ? (
        <div style={{ color: '#8A8F98', padding: '4rem 0', textAlign: 'center' }}>暫無訊息</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {messages.map(m => (
            <div key={m.id} style={{
              padding: '1rem', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.sender_name}</span>
                <span style={{ fontSize: '0.75rem', color: '#8A8F98' }}>
                  {new Date(m.send_time).toLocaleString('zh-TW')}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#ccc', margin: 0 }}>{m.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
