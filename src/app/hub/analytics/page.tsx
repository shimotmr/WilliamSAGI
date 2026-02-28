'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    Promise.all([
      fetch('/api/model-usage/summary').then(r=>r.json()),
      fetch('/api/hub/dashboard').then(r=>r.json()),
    ]).then(([usage, dash]) => {
      setData({ usage: usage.data || {}, dash: dash.data || {} });
    }).catch(() => {});
  }, []);

  const usage = (data.usage || {}) as Record<string, unknown>;
  const dash  = (data.dash  || {}) as Record<string, unknown>;

  const Card = ({ label, value, sub, accent = '#5E6AD2' }: { label: string; value: string|number; sub?: string; accent?: string }) => (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '14px', padding: '1.25rem',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: accent, letterSpacing: '-0.03em' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ color: '#EDEDEF' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>分析</h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>Token 用量與任務統計</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card label="本週完成任務" value={String((dash as Record<string, unknown>).weekCompleted ?? '—')} accent="#4ade80" />
        <Card label="執行中任務" value={String((dash as Record<string, unknown>).running ?? '—')} accent="#fbbf24" />
        <Card label="Prompt 用量" value={String((usage as Record<string, unknown>).totalPrompts ?? '—')} sub="本月" />
        <Card label="Token 用量" value={String((usage as Record<string, unknown>).totalTokens ?? '—')} sub="本月" accent="#60a5fa" />
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px', padding: '1.5rem',
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: '#EDEDEF' }}>Model Usage Breakdown</div>
        <div style={{ color: '#8A8F98', fontSize: '0.8125rem' }}>詳細圖表請查看 /hub/model-usage</div>
      </div>
    </div>
  );
}
