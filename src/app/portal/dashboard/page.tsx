'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  summary: {
    monthTarget: number;
    monthActual: number;
    monthRate: number;
    pipeline: number;
    activeQuotes: number;
  };
  stageMap: Record<string,{count:number,amount:number}>;
  recentCases: Array<{
    id: string;
    end_customer: string;
    dealer: string;
    stage: string;
    amount: number;
    ship_date: string;
    rep: string;
  }>;
}

export default function PortalDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  const Card = ({ label, value, sub, accent = '#5E6AD2', children }: {
    label: string; value?: string | number; sub?: string; accent?: string; children?: React.ReactNode;
  }) => (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px', padding: '1.5rem',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {value !== undefined && (
        <div style={{ fontSize: '2rem', fontWeight: 800, color: accent, letterSpacing: '-0.04em' }}>
          {typeof value === 'number' && value >= 10000 ? `${(value/10000).toFixed(0)}萬` : value}
        </div>
      )}
      {sub && <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginTop: '0.25rem' }}>{sub}</div>}
      {children}
    </div>
  );

  const formatStage = (stage: string) => {
    const map: Record<string,string> = { '進行中':'進行中', '已出貨':'已出貨', '待出貨':'待出貨', '失敗':'失敗' };
    return map[stage] || stage;
  };

  const stageColor = (stage: string) => {
    const colors: Record<string,string> = { '進行中':'#6B7280', '已出貨':'#3B82F6', '待出貨':'#F59E0B', '失敗':'#EF4444' };
    return colors[stage] || '#6B7280';
  };

  if (loading) {
    return <div style={{ color: '#EDEDEF', padding: '1.5rem' }}>載入中...</div>;
  }

  const stageMap = data?.stageMap || {};
  const totalCases = Object.values(stageMap).reduce((s,v) => s + v.count, 0);
  const totalAmount = Object.values(stageMap).reduce((s,v) => s + v.amount, 0);

  return (
    <div style={{ color: '#EDEDEF', padding: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Portal</h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>業務系統概覽</p>
      </div>

      {/* 統計卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card label="本月目標" value={data?.summary?.monthTarget || 0} accent="#3B82F6" />
        <Card label="本月業績" value={data?.summary?.monthActual || 0} accent="#10B981" sub={data?.summary?.monthRate ? `${data.summary.monthRate}% 達成` : ''} />
        <Card label="Pipeline" value={data?.summary?.pipeline || 0} accent="#F59E0B" />
        <Card label="案件總數" value={totalCases} accent="#8B5CF6" sub={`金額: ${(totalAmount/10000).toFixed(0)}萬`} />
      </div>

      {/* 各階段分布 */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#8A8F98' }}>案件階段分布</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(stageMap).map(([stage, v]) => (
            <div key={stage} style={{ 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '1rem',
              borderLeft: `3px solid ${stageColor(stage)}`
            }}>
              <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginBottom: '0.25rem' }}>{formatStage(stage)}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stageColor(stage) }}>{v.count}</div>
              <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{(v.amount/10000).toFixed(0)}萬</div>
            </div>
          ))}
        </div>
      </div>

      {/* 最近更新 */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#8A8F98' }}>最近更新</h2>
        <div style={{ 
          background: 'rgba(255,255,255,0.04)', 
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', overflow: 'hidden' 
        }}>
          {(data?.recentCases?.length) ? (
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', color: '#8A8F98', fontWeight: 500, fontSize: '0.75rem' }}>客戶</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#8A8F98', fontWeight: 500, fontSize: '0.75rem' }}>經銷商</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#8A8F98', fontWeight: 500, fontSize: '0.75rem' }}>狀態</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#8A8F98', fontWeight: 500, fontSize: '0.75rem', textAlign: 'right' }}>金額</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#8A8F98', fontWeight: 500, fontSize: '0.75rem' }}>業務</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCases.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < data.recentCases.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{c.end_customer}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#9CA3AF' }}>{c.dealer}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 500,
                        background: `${stageColor(c.stage)}20`, color: stageColor(c.stage)
                      }}>
                        {c.stage}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 500 }}>{c.amount ? (c.amount/10000).toFixed(1)+'萬' : '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#9CA3AF' }}>{c.rep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>無最近更新</div>
          )}
        </div>
      </div>
    </div>
  );
}
