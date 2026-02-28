'use client';

import { useEffect, useState } from 'react';

interface Agent {
  name: string;
  role: string;
  model: string;
  status: string;
  tasksCompleted: number;
  successRate: number;
}

const AGENT_ACCENT: Record<string, string> = {
  travis:  '#5E6AD2',
  blake:   '#4ade80',
  rex:     '#f59e0b',
  oscar:   '#60a5fa',
  warren:  '#a78bfa',
  griffin: '#ef4444',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetch('/api/hub/agents')
      .then(r => r.json())
      .then(d => setAgents(d.agents || d.data || []))
      .catch(() => {});
  }, []);

  return (
    <div style={{ color: '#EDEDEF' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Agents</h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>Agent 狀態與配置</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {(agents.length ? agents : [
          { name: 'Travis', role: 'Manager', model: 'Claude Sonnet', status: 'online', tasksCompleted: 0, successRate: 99 },
          { name: 'Blake', role: 'Builder', model: 'MiniMax M2.5', status: 'standby', tasksCompleted: 0, successRate: 87 },
          { name: 'Rex', role: 'Thinker', model: 'Kimi K2.5', status: 'standby', tasksCompleted: 0, successRate: 91 },
          { name: 'Oscar', role: 'Operator', model: 'MiniMax M2.5', status: 'standby', tasksCompleted: 0, successRate: 89 },
          { name: 'Warren', role: 'Trader', model: 'MiniMax M2.5', status: 'standby', tasksCompleted: 0, successRate: 85 },
          { name: 'Griffin', role: 'Guardian', model: 'MiniMax M2.5', status: 'standby', tasksCompleted: 0, successRate: 94 },
        ]).map(agent => {
          const key = agent.name.toLowerCase();
          const accent = AGENT_ACCENT[key] || '#5E6AD2';
          return (
            <div key={agent.name} style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${accent}30`,
              borderRadius: '16px', padding: '1.5rem',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, ${accent}, transparent)`,
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', border: `1px solid ${accent}30`,
                }}>
                  {agent.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#EDEDEF' }}>{agent.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8A8F98' }}>{agent.role}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: agent.status === 'online' ? '#4ade80' : '#8A8F98',
                    boxShadow: agent.status === 'online' ? '0 0 6px #4ade80' : 'none',
                  }} />
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginBottom: '0.75rem' }}>
                <span style={{ color: accent }}>{agent.model}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.75rem', color: '#8A8F98' }}>完成任務<br/><span style={{ fontSize: '1rem', fontWeight: 600, color: '#EDEDEF' }}>{agent.tasksCompleted}</span></div>
                <div style={{ fontSize: '0.75rem', color: '#8A8F98', textAlign: 'right' }}>成功率<br/><span style={{ fontSize: '1rem', fontWeight: 600, color: accent }}>{agent.successRate}%</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
