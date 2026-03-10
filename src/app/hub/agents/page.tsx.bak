'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Agent {
  name: string;
  display: string;
  role: string;
  emoji: string;
  color: string;
  status: string;
  isActive: boolean;
  tasksCompleted: number;
  tasksRunning: number;
  tasksPending: number;
  tasksTotal: number;
  successRate: number;
}

const T = {
  bg: '#050506',
  fg: '#EDEDEF',
  fgMuted: '#8A8F98',
  accent: '#5E6AD2',
  border: 'rgba(255,255,255,0.06)',
  green: '#4ade80',
  amber: '#fbbf24',
  red: '#f87171',
};

const DEFAULT_COLORS: Record<string, string> = {
  main:       '#5E6AD2',
  travis:     '#5E6AD2',
  coder:      '#4ade80',
  blake:      '#4ade80',
  'coder-b':  '#38bdf8',
  researcher: '#f59e0b',
  rex:        '#f59e0b',
  secretary:  '#60a5fa',
  oscar:      '#60a5fa',
  writer:     '#fb923c',
  designer:   '#e879f9',
  analyst:    '#a78bfa',
  trader:     '#fbbf24',
  warren:     '#fbbf24',
  inspector:  '#ef4444',
  griffin:    '#ef4444',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hub/agents')
      .then(r => r.json())
      .then(d => { setAgents(d.agents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const activeCount = agents.filter(a => a.isActive).length;
  const totalTasks = agents.reduce((s, a) => s + a.tasksCompleted, 0);

  return (
    <div style={{ color: T.fg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.03em', margin: 0,
          background: 'linear-gradient(to bottom,#EDEDEF,rgba(237,237,239,0.8))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Agents
        </h1>
        <p style={{ fontSize: '0.8125rem', color: T.fgMuted, margin: '0.25rem 0 0' }}>
          {activeCount} / {agents.length} 活躍 · 累計完成 {totalTasks} 個任務
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: T.fgMuted, gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2"
            style={{ animation: 'spin 0.8s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          載入中…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
          {agents.map(agent => {
            const color = agent.color && agent.color !== '#5E6AD2'
              ? agent.color
              : DEFAULT_COLORS[agent.name?.toLowerCase()] || DEFAULT_COLORS[agent.display?.toLowerCase()] || T.accent;

            return (
              <div key={agent.name} style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: `1px solid ${T.border}`,
                borderRadius: '16px',
                padding: '1.25rem 1.375rem',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px rgba(0,0,0,0.4), 0 0 60px ${color}10`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.transform = 'none';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}>
                {/* Top accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                }} />

                {/* Agent header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem', border: `1px solid ${color}30`,
                    boxShadow: `0 0 12px ${color}20`,
                  }}>
                    {agent.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: T.fg, letterSpacing: '-0.01em' }}>
                      {agent.display || agent.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: T.fgMuted }}>{agent.role}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: agent.isActive ? T.green : '#555',
                      boxShadow: agent.isActive ? `0 0 6px ${T.green}` : 'none',
                    }} />
                    <span style={{ fontSize: '0.6875rem', color: agent.isActive ? T.green : T.fgMuted }}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem',
                  marginBottom: '0.875rem',
                }}>
                  {[
                    { label: '完成', value: agent.tasksCompleted, color: T.green },
                    { label: '執行中', value: agent.tasksRunning, color: T.amber },
                    { label: '待執行', value: agent.tasksPending, color: T.accent },
                    { label: '總計', value: agent.tasksTotal, color: T.fg },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '1.125rem', fontWeight: 600, color: stat.color,
                        fontVariantNumeric: 'tabular-nums', lineHeight: 1.2,
                      }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: T.fgMuted, marginTop: '0.125rem' }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    flex: 1, height: '3px', background: 'rgba(255,255,255,0.06)',
                    borderRadius: '2px', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${agent.successRate}%`,
                      background: color, borderRadius: '2px',
                      boxShadow: `0 0 8px ${color}60`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <span style={{
                    fontSize: '0.6875rem', color: T.fgMuted, fontVariantNumeric: 'tabular-nums',
                    minWidth: '32px', textAlign: 'right',
                  }}>
                    {agent.successRate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
