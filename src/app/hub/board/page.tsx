'use client';
// 🔒 AUDIT: 2026-03-08 | score=100/100 | full-audit

import { CSSProperties, useEffect, useMemo, useState } from 'react';

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  board?: string;
  description?: string;
  updated_at?: string;
}

type BoardStatus = '執行中' | '待派發' | '待執行' | '已完成' | '失敗';

type GroupMode = 'status' | 'priority' | 'assignee' | 'category';

interface AuditEntry {
  id: string;
  taskId: number;
  action: string;
  from?: string;
  to?: string;
  time: string;
}

const STATUSES: BoardStatus[] = ['執行中', '待派發', '待執行', '已完成', '失敗'];

const STATUS_COLOR: Record<string, string> = {
  執行中: '#5E6AD2',
  待派發: '#fbbf24',
  待執行: '#8A8F98',
  已完成: '#4ade80',
  失敗: '#ef4444',
};

const PRIORITY_COLOR: Record<string, string> = {
  P0: '#ef4444',
  P1: '#f97316',
  P2: '#fbbf24',
  P3: '#8A8F98',
};

const STORAGE_KEY = 'wecom-board-v1';

function nowIso() {
  return new Date().toISOString();
}

function fmtTime(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('zh-TW', { hour12: false });
  } catch {
    return iso;
  }
}

function getTimeline(task: Task, audits: AuditEntry[]) {
  const fromAudit = audits
    .filter((a) => a.taskId === task.id)
    .sort((a, b) => (a.time > b.time ? -1 : 1))
    .slice(0, 8)
    .map((a) => ({ title: a.action, time: a.time, detail: a.from && a.to ? `${a.from} → ${a.to}` : '' }));

  const base = [
    { title: '任務建立', time: task.updated_at || nowIso(), detail: `#${task.id}` },
    {
      title: '最後更新',
      time: task.updated_at || nowIso(),
      detail: `${task.assignee || '未指派'} · ${task.priority || '未設定'}`,
    },
  ];

  return [...fromAudit, ...base].slice(0, 10);
}

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>('status');
  const [filterStatus, setFilterStatus] = useState<string>('全部');
  const [filterPriority, setFilterPriority] = useState<string>('全部');
  const [filterAssignee, setFilterAssignee] = useState<string>('全部');
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [audits, setAudits] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetch('/api/hub/board')
      .then((r) => r.json())
      .then((d) => {
        setTasks(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setCategories(parsed.categories || {});
      setAudits(parsed.audits || []);
      setExpanded(parsed.expanded || {});
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ categories, audits: audits.slice(0, 300), expanded });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [categories, audits, expanded]);

  const assignees = useMemo(
    () => ['全部', ...Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean)))],
    [tasks]
  );

  const priorities = useMemo(
    () => ['全部', ...Array.from(new Set(tasks.map((t) => t.priority).filter(Boolean)))],
    [tasks]
  );

  const categoryValues = useMemo(
    () => ['全部', ...Array.from(new Set(Object.values(categories).filter(Boolean)))],
    [categories]
  );

  const logAudit = (entry: Omit<AuditEntry, 'id' | 'time'>) => {
    const row: AuditEntry = { ...entry, id: `${Date.now()}-${Math.random()}`, time: nowIso() };
    setAudits((prev) => [row, ...prev].slice(0, 300));
  };

  const setTaskStatus = (taskId: number, nextStatus: BoardStatus) => {
    setTasks((prev) => {
      const current = prev.find((t) => t.id === taskId);
      if (!current || current.status === nextStatus) return prev;
      logAudit({ taskId, action: '狀態移動', from: current.status, to: nextStatus });
      return prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus, updated_at: nowIso() } : t));
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const cat = categories[t.id] || '未分類';
      if (filterStatus !== '全部' && t.status !== filterStatus) return false;
      if (filterPriority !== '全部' && t.priority !== filterPriority) return false;
      if (filterAssignee !== '全部' && t.assignee !== filterAssignee) return false;
      if (filterCategory !== '全部' && cat !== filterCategory) return false;
      return true;
    });
  }, [tasks, categories, filterStatus, filterPriority, filterAssignee, filterCategory]);

  const groups = useMemo(() => {
    const out: Record<string, Task[]> = {};
    for (const t of filteredTasks) {
      let key = t.status || '其他';
      if (groupMode === 'priority') key = t.priority || '未設定';
      if (groupMode === 'assignee') key = t.assignee || '未指派';
      if (groupMode === 'category') key = categories[t.id] || '未分類';
      if (!out[key]) out[key] = [];
      out[key].push(t);
    }
    if (groupMode === 'status') {
      for (const s of STATUSES) out[s] = out[s] || [];
    }
    return out;
  }, [filteredTasks, groupMode, categories]);

  const groupKeys = useMemo(() => {
    if (groupMode === 'status') return STATUSES;
    return Object.keys(groups).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  }, [groupMode, groups]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  const updateCategory = (taskId: number, value: string) => {
    const old = categories[taskId] || '未分類';
    const next = value.trim() || '未分類';
    setCategories((prev) => ({ ...prev, [taskId]: next }));
    if (old !== next) logAudit({ taskId, action: '分類變更', from: old, to: next });
  };

  return (
    <div style={{ color: '#EDEDEF' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          WeCom 看板 v1（雙卡模型）
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>Bundle Card 拖曳執行 · Summary Card 時間軸與審計</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <select value={groupMode} onChange={(e) => setGroupMode(e.target.value as GroupMode)} style={selStyle}>
          <option value="status">依狀態分欄</option>
          <option value="priority">依優先級分欄</option>
          <option value="assignee">依負責人分欄</option>
          <option value="category">依自定分類分欄</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selStyle}>
          <option>全部</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={selStyle}>
          {priorities.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={selStyle}>
          {assignees.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={selStyle}>
          {categoryValues.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#8A8F98', padding: '4rem 0', textAlign: 'center' }}>載入中…</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.9rem' }}>
              {groupKeys.map((group) => {
                const list = groups[group] || [];
                return (
                  <div
                    key={group}
                    onDragOver={(e) => {
                      if (groupMode !== 'status') return;
                      e.preventDefault();
                    }}
                    onDrop={() => {
                      if (groupMode !== 'status' || !dragTaskId || !STATUSES.includes(group as BoardStatus)) return;
                      setTaskStatus(dragTaskId, group as BoardStatus);
                      setDragTaskId(null);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '14px',
                      padding: '0.85rem',
                      minHeight: '220px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 999, background: STATUS_COLOR[group] || '#8A8F98' }} />
                      <strong style={{ fontSize: '0.85rem' }}>{group}</strong>
                      <span style={{ marginLeft: 'auto', color: '#8A8F98', fontSize: '0.75rem' }}>{list.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {list.map((t) => {
                        const isOpen = !!expanded[t.id];
                        return (
                          <div
                            key={t.id}
                            draggable={groupMode === 'status'}
                            onDragStart={() => setDragTaskId(t.id)}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: 10,
                              padding: '0.65rem',
                              cursor: groupMode === 'status' ? 'grab' : 'default',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span
                                style={{
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  padding: '0.125rem 0.35rem',
                                  borderRadius: 4,
                                  background: `${PRIORITY_COLOR[t.priority] || '#8A8F98'}20`,
                                  color: PRIORITY_COLOR[t.priority] || '#8A8F98',
                                }}
                              >
                                {t.priority || '—'}
                              </span>
                              <span style={{ fontSize: '0.8rem', lineHeight: 1.35 }}>{t.title}</span>
                            </div>

                            <div style={{ marginTop: '0.45rem', fontSize: '0.7rem', color: '#8A8F98' }}>
                              #{t.id} · {t.assignee || '未指派'} · {categories[t.id] || '未分類'}
                            </div>

                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => {
                                  setSelectedTaskId(t.id);
                                  const next = !isOpen;
                                  setExpanded((prev) => ({ ...prev, [t.id]: next }));
                                  logAudit({ taskId: t.id, action: next ? '展開摘要卡' : '收合摘要卡' });
                                }}
                                style={btnStyle}
                              >
                                {isOpen ? '收合 Summary' : '展開 Summary'}
                              </button>
                              <input
                                placeholder="分類"
                                defaultValue={categories[t.id] || ''}
                                onBlur={(e) => updateCategory(t.id, e.target.value)}
                                style={inputStyle}
                              />
                            </div>

                            {isOpen && (
                              <div style={{ marginTop: '0.55rem', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.72rem', color: '#AEB3BE', marginBottom: '0.3rem' }}>Summary Card</div>
                                <div style={{ fontSize: '0.72rem', color: '#8A8F98' }}>{t.description || '無描述'}</div>
                                <div style={{ marginTop: '0.4rem', fontSize: '0.68rem', color: '#8A8F98' }}>
                                  最後更新：{fmtTime(t.updated_at)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: '0.9rem',
                height: 'fit-content',
                position: 'sticky',
                top: 16,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.9rem' }}>Summary + Timeline</div>
              {!selectedTask ? (
                <div style={{ color: '#8A8F98', fontSize: '0.8rem' }}>點任務「展開 Summary」可查看細節</div>
              ) : (
                <>
                  <div style={{ fontSize: '0.86rem', marginBottom: '0.35rem' }}>
                    #{selectedTask.id} {selectedTask.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#8A8F98', marginBottom: '0.55rem' }}>
                    {selectedTask.status} · {selectedTask.priority} · {selectedTask.assignee || '未指派'} ·{' '}
                    {categories[selectedTask.id] || '未分類'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#AEB3BE', marginBottom: '0.4rem' }}>Timeline</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {getTimeline(selectedTask, audits).map((ev, idx) => (
                      <div key={`${selectedTask.id}-${idx}`} style={{ borderLeft: '2px solid rgba(94,106,210,0.55)', paddingLeft: '0.5rem' }}>
                        <div style={{ fontSize: '0.74rem' }}>{ev.title}</div>
                        <div style={{ fontSize: '0.68rem', color: '#8A8F98' }}>{fmtTime(ev.time)}</div>
                        {!!ev.detail && <div style={{ fontSize: '0.68rem', color: '#8A8F98' }}>{ev.detail}</div>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.75rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.45rem', fontSize: '0.85rem' }}>審計紀錄（Audit）</div>
                <div style={{ maxHeight: 280, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {audits.length === 0 ? (
                    <div style={{ color: '#8A8F98', fontSize: '0.75rem' }}>尚無紀錄</div>
                  ) : (
                    audits.slice(0, 30).map((a) => (
                      <div key={a.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '0.45rem' }}>
                        <div style={{ fontSize: '0.73rem' }}>
                          #{a.taskId} {a.action}
                        </div>
                        <div style={{ fontSize: '0.67rem', color: '#8A8F98' }}>
                          {a.from && a.to ? `${a.from} → ${a.to} · ` : ''}
                          {fmtTime(a.time)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const selStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: '#EDEDEF',
  borderRadius: 8,
  padding: '0.35rem 0.5rem',
  fontSize: '0.78rem',
};

const btnStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(94,106,210,0.22)',
  color: '#EDEDEF',
  borderRadius: 6,
  fontSize: '0.68rem',
  padding: '0.2rem 0.42rem',
  cursor: 'pointer',
};

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: 'rgba(255,255,255,0.05)',
  color: '#EDEDEF',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  fontSize: '0.68rem',
  padding: '0.2rem 0.38rem',
};
