'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import {
  Flame, CheckCircle2, Clock, BarChart3,
  ChevronDown, ChevronUp, FileText, AlertTriangle,
  Zap, Activity, Loader2, XCircle, CheckSquare, Ban,
} from 'lucide-react';

// ── Supabase client (singleton) ──
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ──
interface TaskStep {
  id: number;
  task_id: number;
  step_number: number;
  description: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

interface BoardTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  progress?: number;
  steps?: TaskStep[];
}

interface CompletedTask extends BoardTask {
  report_id?: number;
  report_title?: string;
  md_url?: string;
}

interface SystemStats {
  completedCount: number;
  totalTokens: number;
  lastStepTime: string | null;
  stuckCount: number;
}

// ── Helpers ──
const PRIORITY_COLOR: Record<string, string> = {
  P0: '#ef4444', P1: '#f97316', P2: '#fbbf24', P3: '#8A8F98',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小時前`;
  return `${Math.floor(hrs / 24)} 天前`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function isStuck(task: BoardTask): boolean {
  const lastUpdate = task.steps?.length
    ? task.steps.reduce((latest, s) => {
        const t = s.completed_at || s.started_at || '';
        return t > latest ? t : latest;
      }, '')
    : task.updated_at;
  return Date.now() - new Date(lastUpdate || task.updated_at).getTime() > 10 * 60 * 1000;
}

const stepIcon = (status: string) => {
  switch (status) {
    case '已完成': return <CheckCircle2 size={14} style={{ color: '#4ade80', flexShrink: 0 }} />;
    case '執行中': return <Loader2 size={14} style={{ color: '#5E6AD2', flexShrink: 0, animation: 'spin 1s linear infinite' }} />;
    case '失敗': return <XCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />;
    default: return <Clock size={14} style={{ color: '#8A8F98', flexShrink: 0 }} />;
  }
};

// ── Section wrapper ──
function Section({ icon, title, count, children }: {
  icon: React.ReactNode; title: string; count?: number; children: React.ReactNode;
}) {
  return (
    <div className="today-section" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      minHeight: '200px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        {icon}
        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#EDEDEF' }}>{title}</span>
        {count !== undefined && (
          <span style={{
            marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600,
            color: '#8A8F98', background: 'rgba(255,255,255,0.06)',
            padding: '0.125rem 0.5rem', borderRadius: '999px',
          }}>{count}</span>
        )}
      </div>
      <div className="today-section-content" style={{ flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

// ── Progress bar for running tasks ──
function TaskProgressBar({ progress, stuck }: { progress: number; stuck: boolean }) {
  const p = progress ?? 0;

  // Color rules
  let barColor = '#8A8F98'; // grey for 0
  let label = `${p}%`;
  let showSpinner = false;

  if (stuck && p > 0 && p < 100) {
    barColor = '#eab308'; // orange warning
    label = `⚠️ ${p}%`;
  } else if (p === 0) {
    barColor = '#8A8F98';
    label = '待派發';
  } else if (p === 10) {
    barColor = '#5E6AD2';
    showSpinner = true;
  } else if (p >= 11 && p <= 89) {
    barColor = '#5E6AD2';
  } else if (p === 95) {
    barColor = '#f97316';
    label = '95% 待審查';
  } else if (p >= 100) {
    barColor = '#4ade80';
    label = '100%';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
      <div style={{
        flex: 1, height: '6px', borderRadius: '3px',
        background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.max(p, 2)}%`,
          height: '100%', borderRadius: '3px',
          background: barColor,
          transition: 'width 0.5s ease, background 0.5s ease',
        }} />
      </div>
      <span style={{
        fontSize: '0.65rem', fontWeight: 600, color: barColor,
        whiteSpace: 'nowrap', minWidth: '3rem', textAlign: 'right',
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      }}>
        {showSpinner && <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />}
        {label}
      </span>
    </div>
  );
}

// ── Collapsible task card for 進行中 ──
function RunningTaskCard({ task }: { task: BoardTask }) {
  const [open, setOpen] = useState(true);
  const stuck = isStuck(task);

  return (
    <div className="today-task-card" style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${stuck ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: '12px', padding: '0.875rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, padding: '0.125rem 0.375rem',
          borderRadius: '4px',
          background: `${PRIORITY_COLOR[task.priority] || '#8A8F98'}20`,
          color: PRIORITY_COLOR[task.priority] || '#8A8F98',
          flexShrink: 0, marginTop: '0.15rem',
        }}>{task.priority}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#EDEDEF', lineHeight: 1.4, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: '#8A8F98' }}>#{task.id} · {task.assignee || '—'}</span>
            <span style={{ fontSize: '0.7rem', color: '#8A8F98' }}>· {timeAgo(task.updated_at)}</span>
            {stuck && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                fontSize: '0.65rem', fontWeight: 600, color: '#eab308',
                background: 'rgba(234,179,8,0.12)', padding: '0.125rem 0.375rem',
                borderRadius: '4px',
              }}>
                <AlertTriangle size={10} /> 可能卡住
              </span>
            )}
          </div>
        </div>
        {task.steps && task.steps.length > 0 && (
          <button onClick={() => setOpen(!open)} style={{
            background: 'none', border: 'none', color: '#8A8F98', cursor: 'pointer',
            padding: '0.25rem', flexShrink: 0,
          }}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <TaskProgressBar progress={task.progress ?? 0} stuck={stuck} />

      {open && task.steps && task.steps.length > 0 && (
        <div style={{
          marginTop: '0.625rem', paddingTop: '0.625rem',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', flexDirection: 'column', gap: '0.375rem',
        }}>
          {task.steps.map(step => (
            <div key={step.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              fontSize: '0.75rem', color: '#8A8F98', lineHeight: 1.4,
            }}>
              {stepIcon(step.status)}
              <span style={{ color: step.status === '執行中' ? '#EDEDEF' : undefined }}>
                {step.description || `步驟 ${step.step_number}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──
export default function TodayDashboard() {
  const [running, setRunning] = useState<BoardTask[]>([]);
  const [completed, setCompleted] = useState<CompletedTask[]>([]);
  const [pending, setPending] = useState<BoardTask[]>([]);
  const [stats, setStats] = useState<SystemStats>({ completedCount: 0, totalTokens: 0, lastStepTime: null, stuckCount: 0 });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Tick every 30s so timeAgo refreshes
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch functions ──
  const fetchRunning = useCallback(async () => {
    const { data: tasks } = await supabase
      .from('board_tasks')
      .select('*')
      .eq('status', '執行中')
      .order('updated_at', { ascending: false });

    if (!tasks || tasks.length === 0) { setRunning([]); return; }

    const ids = tasks.map(t => t.id);
    const { data: steps } = await supabase
      .from('task_steps')
      .select('*')
      .in('task_id', ids)
      .order('step_number', { ascending: true });

    const stepMap = (steps || []).reduce<Record<number, TaskStep[]>>((acc, s) => {
      acc[s.task_id] = acc[s.task_id] || [];
      acc[s.task_id].push(s);
      return acc;
    }, {});

    setRunning(tasks.map(t => ({ ...t, steps: stepMap[t.id] || [] })));
  }, []);

  const fetchCompleted = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: tasks } = await supabase
      .from('board_tasks')
      .select('*')
      .eq('status', '已完成')
      .gte('completed_at', today)
      .order('completed_at', { ascending: false })
      .limit(20);

    if (!tasks) { setCompleted([]); return; }

    // Try to join reports
    const ids = tasks.map(t => t.id);
    const { data: reports } = await supabase
      .from('reports')
      .select('id, title, md_url, export_task_id')
      .in('export_task_id', ids);

    const reportMap = (reports || []).reduce<Record<number, { id: number; title: string; md_url: string }>>((acc, r) => {
      acc[r.export_task_id] = { id: r.id, title: r.title, md_url: r.md_url };
      return acc;
    }, {});

    setCompleted(tasks.map(t => ({
      ...t,
      report_id: reportMap[t.id]?.id,
      report_title: reportMap[t.id]?.title,
      md_url: reportMap[t.id]?.md_url,
    })));
  }, []);

  const fetchPending = useCallback(async () => {
    const { data } = await supabase
      .from('board_tasks')
      .select('*')
      .eq('status', '待確認')
      .order('created_at', { ascending: false })
      .limit(10);
    setPending(data || []);
  }, []);

  const fetchStats = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const [countRes, tokenRes, lastStepRes] = await Promise.all([
      supabase.from('board_tasks').select('id', { count: 'exact', head: true }).eq('status', '已完成').gte('completed_at', today),
      supabase.from('model_usage_log').select('total_tokens').gte('created_at', today),
      supabase.from('task_steps').select('completed_at').order('completed_at', { ascending: false }).limit(1),
    ]);

    const totalTokens = (tokenRes.data || []).reduce((sum, r) => sum + (r.total_tokens || 0), 0);

    setStats(prev => ({
      ...prev,
      completedCount: countRes.count || 0,
      totalTokens,
      lastStepTime: lastStepRes.data?.[0]?.completed_at || null,
    }));
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchRunning(), fetchCompleted(), fetchPending(), fetchStats()]);
    setLoading(false);
  }, [fetchRunning, fetchCompleted, fetchPending, fetchStats]);

  // ── Initial load + realtime subscriptions ──
  useEffect(() => {
    fetchAll();

    const taskChannel = supabase
      .channel('today-board-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_tasks' }, () => {
        fetchRunning();
        fetchCompleted();
        fetchPending();
        fetchStats();
      })
      .subscribe();

    const stepChannel = supabase
      .channel('today-task-steps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_steps' }, () => {
        fetchRunning();
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(stepChannel);
    };
  }, [fetchAll]);

  // Compute stuck count from running tasks
  const stuckCount = useMemo(() => running.filter(isStuck).length, [running, now]);

  // ── Action handlers ──
  const handleApprove = async (id: number) => {
    await supabase.from('board_tasks').update({ status: '待執行' }).eq('id', id);
  };
  const handleCancel = async (id: number) => {
    await supabase.from('board_tasks').update({ status: '已取消' }).eq('id', id);
  };

  if (loading) {
    return (
      <div style={{ color: '#8A8F98', padding: '6rem 0', textAlign: 'center', fontSize: '0.875rem' }}>
        <Loader2 size={24} style={{ margin: '0 auto 0.75rem', animation: 'spin 1s linear infinite' }} />
        載入中…
      </div>
    );
  }

  return (
    <div style={{ color: '#EDEDEF', maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .today-section { padding: 1.25rem; }
        .today-section-content { overflow-y: visible; }
        @media (max-width: 768px) {
          .today-grid { grid-template-columns: 1fr !important; gap: 0.625rem !important; }
          .today-section { padding: 0.75rem !important; }
          .today-section-content { max-height: 300px; overflow-y: auto; }
          .today-task-card { padding: 0.625rem !important; }
          .today-stat-card { padding: 0.625rem !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          今日看板
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>
          即時任務總覽 · {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 2×2 Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
      }} className="today-grid">

        {/* ── 🔥 進行中 ── */}
        <Section
          icon={<Flame size={16} style={{ color: '#f97316' }} />}
          title="進行中"
          count={running.length}
        >
          {running.length === 0 ? (
            <div style={{ color: '#8A8F98', fontSize: '0.8125rem', padding: '1rem 0', textAlign: 'center' }}>
              目前沒有執行中的任務
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {running.map(task => (
                <RunningTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </Section>

        {/* ── ✅ 今日完成 ── */}
        <Section
          icon={<CheckCircle2 size={16} style={{ color: '#4ade80' }} />}
          title="今日完成"
          count={completed.length}
        >
          {completed.length === 0 ? (
            <div style={{ color: '#8A8F98', fontSize: '0.8125rem', padding: '1rem 0', textAlign: 'center' }}>
              今日尚無完成的任務
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {completed.map(task => (
                <div key={task.id} className="today-task-card" style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px', fontSize: '0.8125rem',
                }}>
                  <CheckCircle2 size={14} style={{ color: '#4ade80', flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#EDEDEF' }}>
                    {task.title}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#8A8F98', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {task.completed_at ? formatTime(task.completed_at) : ''}
                  </span>
                  {task.md_url && (
                    <a href={task.md_url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      fontSize: '0.7rem', color: '#5E6AD2', textDecoration: 'none',
                      background: 'rgba(94,106,210,0.12)', padding: '0.125rem 0.5rem',
                      borderRadius: '4px', flexShrink: 0, fontWeight: 600,
                    }}>
                      <FileText size={10} /> 報告
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── ⏸ 等你確認 ── */}
        <Section
          icon={<CheckSquare size={16} style={{ color: '#fbbf24' }} />}
          title="等你確認"
          count={pending.length}
        >
          {pending.length === 0 ? (
            <div style={{ color: '#8A8F98', fontSize: '0.8125rem', padding: '1rem 0', textAlign: 'center' }}>
              沒有待確認的任務
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {pending.map(task => (
                <div key={task.id} className="today-task-card" style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px', fontSize: '0.8125rem',
                }}>
                  <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#EDEDEF' }}>
                    {task.title}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#8A8F98', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {timeAgo(task.created_at)}
                  </span>
                  <button onClick={() => handleApprove(task.id)} style={{
                    background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)',
                    color: '#4ade80', borderRadius: '6px', padding: '0.25rem 0.625rem',
                    fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                  }}>核准</button>
                  <button onClick={() => handleCancel(task.id)} style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                    color: '#ef4444', borderRadius: '6px', padding: '0.25rem 0.625rem',
                    fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                  }}>取消</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 📊 系統狀態 ── */}
        <Section
          icon={<BarChart3 size={16} style={{ color: '#5E6AD2' }} />}
          title="系統狀態"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              {
                label: '今日完成',
                value: stats.completedCount.toString(),
                sub: '筆任務',
                color: '#4ade80',
                icon: <CheckCircle2 size={16} />,
              },
              {
                label: 'Token 用量',
                value: stats.totalTokens > 1000000
                  ? `${(stats.totalTokens / 1000000).toFixed(1)}M`
                  : stats.totalTokens > 1000
                  ? `${(stats.totalTokens / 1000).toFixed(0)}K`
                  : stats.totalTokens.toString(),
                sub: 'tokens',
                color: '#f97316',
                icon: <Zap size={16} />,
              },
              {
                label: '最近活動',
                value: stats.lastStepTime ? timeAgo(stats.lastStepTime) : '—',
                sub: '最後步驟',
                color: '#5E6AD2',
                icon: <Activity size={16} />,
              },
              {
                label: '卡住任務',
                value: stuckCount.toString(),
                sub: '>10 分鐘無動作',
                color: stuckCount > 0 ? '#eab308' : '#4ade80',
                icon: <AlertTriangle size={16} />,
              },
            ].map(stat => (
              <div key={stat.label} className="today-stat-card" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px', padding: '0.875rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <span style={{ fontSize: '0.7rem', color: '#8A8F98', fontWeight: 500 }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#8A8F98', marginTop: '0.25rem' }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
