'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  board: string;
}

const STATUS_COLOR: Record<string, string> = {
  '執行中': '#5E6AD2',
  '待派發': '#fbbf24',
  '待執行': '#8A8F98',
  '已完成': '#4ade80',
  '失敗': '#ef4444',
};

const PRIORITY_COLOR: Record<string, string> = {
  P0: '#ef4444', P1: '#f97316', P2: '#fbbf24', P3: '#8A8F98',
};

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hub/board')
      .then(r => r.json())
      .then(d => { setTasks(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const groups = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const s = t.status || '其他';
    acc[s] = acc[s] || [];
    acc[s].push(t);
    return acc;
  }, {});

  return (
    <div style={{ color: '#EDEDEF' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>任務看板</h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>Agent 任務派發與執行狀態</p>
      </div>

      {loading ? (
        <div style={{ color: '#8A8F98', padding: '4rem 0', textAlign: 'center' }}>載入中…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {['執行中','待派發','待執行','已完成','失敗'].map(status => {
            const list = groups[status] || [];
            if (list.length === 0) return null;
            return (
              <div key={status} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px', padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLOR[status] || '#8A8F98' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#EDEDEF' }}>{status}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#8A8F98' }}>{list.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {list.slice(0, 8).map(t => (
                    <div key={t.id} style={{
                      padding: '0.75rem', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.375rem' }}>
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 700, padding: '0.125rem 0.375rem',
                          borderRadius: '4px', background: `${PRIORITY_COLOR[t.priority] || '#8A8F98'}20`,
                          color: PRIORITY_COLOR[t.priority] || '#8A8F98', flexShrink: 0, marginTop: '0.1rem',
                        }}>{t.priority}</span>
                        <span style={{ fontSize: '0.8125rem', color: '#EDEDEF', lineHeight: 1.4 }}>{t.title}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#8A8F98' }}>#{t.id} · {t.assignee || '—'}</span>
                    </div>
                  ))}
                  {list.length > 8 && (
                    <p style={{ fontSize: '0.75rem', color: '#8A8F98', textAlign: 'center', padding: '0.25rem 0' }}>+{list.length - 8} 筆</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
