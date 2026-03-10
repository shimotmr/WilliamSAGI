'use client';

import { useEffect, useState } from 'react';

interface Report {
  id: number;
  title: string;
  author: string;
  report_type: string;
  created_at: string;
}

const TYPE_COLOR: Record<string, string> = {
  '分析報告': '#5E6AD2', '研究報告': '#60a5fa', '技術文檔': '#4ade80',
  '決策建議': '#f59e0b', '審查報告': '#a78bfa', '操作手冊': '#8A8F98',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hub/reports?limit=50')
      .then(r => r.json())
      .then(d => { setReports(d.reports || d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ color: '#EDEDEF' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>報告庫</h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>Agent 分析與研究報告</p>
      </div>

      {loading ? (
        <div style={{ color: '#8A8F98', textAlign: 'center', padding: '4rem 0' }}>載入中…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {reports.map(r => {
            const accent = TYPE_COLOR[r.report_type] || '#8A8F98';
            return (
              <a key={r.id} href={`/hub/reports/${r.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  transition: 'border-color 150ms',
                }}>
                  <div style={{ width: '3px', height: '40px', borderRadius: '2px', background: accent, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#EDEDEF', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8A8F98' }}>
                      <span style={{ color: accent }}>{r.report_type}</span>
                      {' · '}{r.author}
                      {' · '}{new Date(r.created_at).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#8A8F98' }}>#{r.id}</span>
                </div>
              </a>
            );
          })}
          {reports.length === 0 && (
            <div style={{ color: '#8A8F98', textAlign: 'center', padding: '4rem 0' }}>暫無報告</div>
          )}
        </div>
      )}
    </div>
  );
}
