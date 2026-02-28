'use client';

import { useEffect, useState } from 'react';

export default function PortalDashboardPage() {
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetch('/api/hub/dashboard')
      .then(r => r.json())
      .then(d => setData(d.data || {}))
      .catch(() => {});
  }, []);

  const Card = ({ label, value, accent = '#5E6AD2', children }: {
    label: string; value?: string | number; accent?: string; children?: React.ReactNode;
  }) => (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px', padding: '1.5rem',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {value !== undefined && <div style={{ fontSize: '2rem', fontWeight: 800, color: accent, letterSpacing: '-0.04em' }}>{value}</div>}
      {children}
    </div>
  );

  return (
    <div style={{ color: '#EDEDEF', padding: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Portal</h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>業務系統概覽</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card label="本週完成" value={String((data as Record<string, unknown>).weekCompleted ?? '—')} accent="#4ade80" />
        <Card label="執行中任務" value={String((data as Record<string, unknown>).running ?? '—')} accent="#fbbf24" />
        <Card label="Agents" value="6" accent="#5E6AD2" />
      </div>
    </div>
  );
}
