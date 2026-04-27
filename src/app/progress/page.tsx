'use client';

import { useState } from 'react';
import { useSmartPolling } from '../hooks/useSmartPolling';

interface Task {
  task_id: string;
  status: 'running' | 'completed' | 'failed';
  last_line: string;
  lines: number;
  started_at: string;
  full_log?: string;
}

const STATUS_COLORS: Record<string, string> = {
  running: '#22c55e',
  completed: '#6b7280',
  failed: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  running: 'RUNNING',
  completed: 'DONE',
  failed: 'FAILED',
};

export default function ProgressPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/progress');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
        setError(null);
      }
    } catch {
      setError('Progress API unreachable');
    }
  };

  const fetchDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/progress?id=${id}`);
      const data = await res.json();
      setExpandedLog(data.full_log || '');
    } catch {
      setExpandedLog('Failed to load log');
    }
  };

  useSmartPolling(fetchTasks, 60000);

  const toggle = (id: string) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      fetchDetail(id);
    }
  };

  const activeTasks = tasks.filter((t) => t.status === 'running');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#e5e5e5',
        fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", Menlo, monospace',
        padding: '2rem',
      }}
    >
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>
          ⚡ Task Progress Monitor
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Active Tasks ({activeTasks.length}) · Total ({tasks.length})
        </p>
        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            ⚠ {error}
          </p>
        )}
      </header>

      {tasks.length === 0 && !error && (
        <p style={{ color: '#6b7280' }}>No active progress logs found.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tasks.map((task) => (
          <div
            key={task.task_id}
            onClick={() => toggle(task.task_id)}
            style={{
              background: '#141414',
              border: `1px solid ${expanded === task.task_id ? '#333' : '#1f1f1f'}`,
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: STATUS_COLORS[task.status],
                  boxShadow:
                    task.status === 'running'
                      ? `0 0 8px ${STATUS_COLORS[task.status]}`
                      : 'none',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                #{task.task_id}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: STATUS_COLORS[task.status],
                  border: `1px solid ${STATUS_COLORS[task.status]}33`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {STATUS_LABELS[task.status]}
              </span>
              <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: 'auto' }}>
                {task.started_at && `started ${task.started_at}`} · {task.lines} lines
              </span>
            </div>

            <p
              style={{
                margin: '0.5rem 0 0 1.5rem',
                color: '#9ca3af',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {task.last_line || '—'}
            </p>

            {expanded === task.task_id && (
              <pre
                style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  background: '#0a0a0a',
                  border: '1px solid #1f1f1f',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  color: '#d4d4d4',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                {expandedLog || 'Loading...'}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
