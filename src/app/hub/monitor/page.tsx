'use client';

import { useEffect, useState } from 'react';

export default function MonitorPage() {
  const [status, setStatus] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetch('/api/system-status')
      .then(r => r.json())
      .then(d => setStatus(d))
      .catch(() => {});
    const t = setInterval(() => {
      fetch('/api/system-status').then(r => r.json()).then(setStatus).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const sys   = (status as Record<string, Record<string, unknown>>).system || {};
  const sess  = (status as Record<string, Record<string, unknown>>).sessions || {};
  const stor  = (status as Record<string, Record<string, unknown>>).storage || {};
  const gw    = (status as Record<string, Record<string, unknown>>).gateway || {};

  const Metric = ({ label, value, accent = '#5E6AD2' }: { label: string; value: string | number; accent?: string }) => (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '1.25rem',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: accent, letterSpacing: '-0.02em' }}>{value || '—'}</div>
    </div>
  );

  return (
    <div style={{ color: '#EDEDEF' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>系統監控</h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>即時系統狀態</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Metric label="System Status" value={String(sys.status || 'OK')} accent="#4ade80" />
        <Metric label="Uptime" value={String(sys.uptime || '—')} />
        <Metric label="Active Sessions" value={String(sess.active || 0)} />
        <Metric label="Sub-Agents" value={String(sess.subAgents || 0)} accent="#f59e0b" />
        <Metric label="Gateway" value={String(gw.status || '—')} accent="#60a5fa" />
        <Metric label="Disk Available" value={String(stor.available || '—')} />
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px', padding: '1.5rem',
      }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', color: '#4ade80', lineHeight: 1.8 }}>
          <div>$ openclaw status</div>
          <div style={{ color: '#8A8F98' }}>{JSON.stringify(status, null, 2).slice(0, 500)}...</div>
        </div>
      </div>
    </div>
  );
}
