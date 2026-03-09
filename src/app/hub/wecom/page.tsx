'use client';

import { useState, useEffect, useCallback } from 'react';

interface WeComMessage {
  id: number;
  msg_id: string;
  sender_name: string;
  content: string;
  msg_type: string;
  send_time: number;
  external_userid: string;
  open_kfid: string;
  source_event: string;
  parent_msg_id: string;
}

export default function WeComPage() {
  const [messages, setMessages] = useState<WeComMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.set('q', search);
      const res = await fetch(`/api/hub/wecom?${params}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchMessages();
    // 每 30 秒自動重整
    const timer = setInterval(fetchMessages, 30000);
    return () => clearInterval(timer);
  }, [fetchMessages]);

  const grouped = messages.reduce<Record<string, WeComMessage[]>>((acc, m) => {
    const key = m.parent_msg_id || m.external_userid || 'direct';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div style={{ color: '#EDEDEF', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>WeCom 訊息歸類</h1>
          <p style={{ fontSize: '0.8rem', color: '#8A8F98' }}>
            {messages.length} 則訊息
            {lastUpdate && ` · 更新於 ${lastUpdate.toLocaleTimeString('zh-TW')}`}
            {' · '}
            <span style={{ color: '#4ade80' }}>● 每 30 秒自動更新</span>
          </p>
        </div>
        <button
          onClick={fetchMessages}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 1rem', color: '#EDEDEF', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          立即更新
        </button>
      </div>

      <input
        type="text"
        placeholder="搜尋訊息內容或發送者..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 1rem', color: '#EDEDEF', marginBottom: '1.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', color: '#8A8F98', padding: '4rem 0' }}>載入中…</div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#8A8F98', padding: '4rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          <div>尚無訊息資料</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>傳訊息到 WeCom Bot 後自動更新</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(grouped).map(([groupKey, msgs]) => {
            const latest = msgs[0];
            const isGroup = msgs.length > 1;
            return (
              <div key={groupKey} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isGroup ? '0.75rem' : 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#EDEDEF' }}>
                    {latest.sender_name || latest.external_userid || '未知發送者'}
                    {isGroup && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#8A8F98', fontWeight: 400 }}>群組對話 {msgs.length} 則</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8A8F98' }}>
                    {latest.send_time ? new Date(latest.send_time * 1000).toLocaleString('zh-TW') : ''}
                  </div>
                </div>
                {msgs.slice(0, 3).map((m, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: i === 0 ? '#EDEDEF' : '#8A8F98', marginTop: i > 0 ? '0.35rem' : 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {isGroup && <span style={{ color: '#60a5fa', marginRight: '0.4rem' }}>{m.sender_name}:</span>}
                    {m.content || `[${m.msg_type}]`}
                  </div>
                ))}
                {msgs.length > 3 && <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginTop: '0.35rem' }}>…還有 {msgs.length - 3} 則</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
