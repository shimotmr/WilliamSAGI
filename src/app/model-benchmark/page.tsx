'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Cpu, Trophy, Clock, TrendingUp, ChevronRight, Loader2,
} from 'lucide-react';

// ── Supabase ──
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ── Types ──
interface ModelProfile {
  model_id: string;
  overall_score: number;
  capability_description: string | null;
  last_benchmark_at: string | null;
}

interface ModelBenchmark {
  model_id: string;
  dimension: string;
  score: number;
  response_time_ms: number | null;
  tokens_used: number | null;
  created_at: string;
}

// ── Constants ──
const DIMENSIONS = [
  'json_output',
  'task_split',
  'coding',
  'chinese_tc',
  'instruction_follow',
  'censorship_freedom',
  'speed',
  'token_efficiency',
  'long_context',
] as const;

const DIMENSION_LABELS: Record<string, string> = {
  json_output: 'JSON 輸出',
  task_split: '任務拆解',
  coding: '程式撰寫',
  chinese_tc: '繁中理解',
  instruction_follow: '指令遵循',
  censorship_freedom: '審查自由',
  speed: '速度',
  token_efficiency: 'Token 效率',
  long_context: '長上下文',
};

function scoreColor(score: number) {
  if (score >= 70) return '#4ade80';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function scoreBg(score: number) {
  if (score >= 70) return 'rgba(74,222,128,0.12)';
  if (score >= 40) return 'rgba(249,115,22,0.12)';
  return 'rgba(239,68,68,0.12)';
}

const MEDAL = ['🥇', '🥈', '🥉'];

// ── Radar Chart (pure SVG) ──
function RadarChart({
  data,
  label,
  color = '#5E6AD2',
  size = 280,
}: {
  data: Record<string, number>;
  label: string;
  color?: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const dims = DIMENSIONS;
  const n = dims.length;

  const angleStep = (2 * Math.PI) / n;
  const offset = -Math.PI / 2;

  const pointAt = (i: number, ratio: number) => {
    const a = offset + i * angleStep;
    return { x: cx + r * ratio * Math.cos(a), y: cy + r * ratio * Math.sin(a) };
  };

  const polygon = dims
    .map((d, i) => {
      const { x, y } = pointAt(i, (data[d] ?? 0) / 100);
      return `${x},${y}`;
    })
    .join(' ');

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-semibold text-white">{label}</span>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={dims.map((_, i) => { const p = pointAt(i, ring); return `${p.x},${p.y}`; }).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {dims.map((_, i) => {
          const p = pointAt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
        })}
        {/* Data polygon */}
        <polygon points={polygon} fill={`${color}33`} stroke={color} strokeWidth="2" />
        {/* Dots */}
        {dims.map((d, i) => {
          const { x, y } = pointAt(i, (data[d] ?? 0) / 100);
          return <circle key={d} cx={x} cy={y} r="3.5" fill={color} />;
        })}
        {/* Labels */}
        {dims.map((d, i) => {
          const p = pointAt(i, 1.18);
          const anchor = p.x < cx - 10 ? 'end' : p.x > cx + 10 ? 'start' : 'middle';
          return (
            <text key={d} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="central"
              fill="#8A8F98" fontSize="10" fontWeight="500">
              {DIMENSION_LABELS[d]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main Page ──
export default function ModelBenchmarkPage() {
  const [profiles, setProfiles] = useState<ModelProfile[]>([]);
  const [benchmarks, setBenchmarks] = useState<ModelBenchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    async function load() {
      const [pRes, bRes] = await Promise.all([
        supabase.from('model_profiles').select('*').order('overall_score', { ascending: false }),
        supabase.from('model_benchmarks').select('*').order('created_at', { ascending: false }),
      ]);
      setProfiles(pRes.data ?? []);
      setBenchmarks(bRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // latest benchmark per model+dimension
  const latestScores = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const b of benchmarks) {
      if (!map[b.model_id]) map[b.model_id] = {};
      if (!map[b.model_id][b.dimension]) {
        map[b.model_id][b.dimension] = b.score;
      }
    }
    return map;
  }, [benchmarks]);

  // history: model_id -> dimension -> score[]
  const history = useMemo(() => {
    const map: Record<string, Record<string, { score: number; date: string }[]>> = {};
    for (const b of benchmarks) {
      if (!map[b.model_id]) map[b.model_id] = {};
      if (!map[b.model_id][b.dimension]) map[b.model_id][b.dimension] = [];
      map[b.model_id][b.dimension].push({ score: b.score, date: b.created_at });
    }
    // reverse so oldest first
    for (const mid of Object.keys(map)) {
      for (const dim of Object.keys(map[mid])) {
        map[mid][dim].reverse();
      }
    }
    return map;
  }, [benchmarks]);

  // models with history (>1 entry in any dimension)
  const modelsWithHistory = useMemo(() => {
    return Object.entries(history).filter(([, dims]) =>
      Object.values(dims).some((arr) => arr.length > 1),
    ).map(([mid]) => mid);
  }, [history]);

  const COLORS = ['#5E6AD2', '#4ade80', '#f97316', '#ef4444', '#06b6d4', '#a78bfa', '#f472b6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-zinc-500">
        <Loader2 className="animate-spin mr-2" size={20} /> 載入中…
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/15">
            <Cpu size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">模型評比</h1>
            <p className="text-sm text-zinc-500">Model Benchmark Dashboard</p>
          </div>
        </div>
      </div>

      {/* ── Section 1: Leaderboard ── */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
          <Trophy size={18} className="text-yellow-400" /> 模型排行榜
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p, i) => (
            <div
              key={p.model_id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{MEDAL[i] ?? `#${i + 1}`}</span>
                  <span className="font-bold text-white text-base">{p.model_id}</span>
                </div>
                <span
                  className="text-2xl font-black tabular-nums"
                  style={{ color: scoreColor(p.overall_score) }}
                >
                  {p.overall_score}
                </span>
              </div>
              {p.capability_description && (
                <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                  {p.capability_description}
                </p>
              )}
              {p.last_benchmark_at && (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                  <Clock size={12} />
                  最後評比：{new Date(p.last_benchmark_at).toLocaleDateString('zh-TW')}
                </div>
              )}
            </div>
          ))}
        </div>
        {profiles.length === 0 && (
          <p className="text-center text-zinc-600 py-8">尚無模型資料</p>
        )}
      </section>

      {/* ── Section 2: Radar Charts ── */}
      {profiles.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <Cpu size={18} className="text-indigo-400" /> 雷達圖對比
          </h2>

          {/* Tabs */}
          {profiles.length > 2 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {profiles.map((p, i) => (
                <button
                  key={p.model_id}
                  onClick={() => setActiveTab(i)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: activeTab === i ? 'rgba(94,106,210,0.2)' : 'rgba(255,255,255,0.04)',
                    color: activeTab === i ? '#EDEDEF' : '#8A8F98',
                    border: `1px solid ${activeTab === i ? 'rgba(94,106,210,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {p.model_id}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-6 justify-center">
            {profiles.length <= 2 ? (
              profiles.map((p, i) => (
                <RadarChart
                  key={p.model_id}
                  data={latestScores[p.model_id] ?? {}}
                  label={p.model_id}
                  color={COLORS[i % COLORS.length]}
                />
              ))
            ) : (
              <RadarChart
                data={latestScores[profiles[activeTab]?.model_id] ?? {}}
                label={profiles[activeTab]?.model_id ?? ''}
                color={COLORS[activeTab % COLORS.length]}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Section 3: Dimension Comparison Table ── */}
      {profiles.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <ChevronRight size={18} className="text-emerald-400" /> 維度詳細對比
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-zinc-400 font-semibold">維度</th>
                  {profiles.map((p) => (
                    <th key={p.model_id} className="px-4 py-3 text-zinc-400 font-semibold text-center">
                      {p.model_id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map((dim) => (
                  <tr key={dim} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-zinc-300 font-medium">
                      {DIMENSION_LABELS[dim]}
                    </td>
                    {profiles.map((p) => {
                      const score = latestScores[p.model_id]?.[dim];
                      return (
                        <td key={p.model_id} className="px-4 py-3 text-center">
                          {score != null ? (
                            <span
                              className="inline-block px-2.5 py-1 rounded-md text-xs font-bold tabular-nums"
                              style={{ color: scoreColor(score), background: scoreBg(score) }}
                            >
                              {score}
                            </span>
                          ) : (
                            <span className="text-zinc-700">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Section 4: Benchmark History ── */}
      {modelsWithHistory.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <TrendingUp size={18} className="text-cyan-400" /> 評比歷史
          </h2>
          <div className="space-y-4">
            {modelsWithHistory.map((mid) => {
              const colorIdx = profiles.findIndex((p) => p.model_id === mid);
              const c = COLORS[colorIdx >= 0 ? colorIdx % COLORS.length : 0];
              return (
                <div
                  key={mid}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <h3 className="font-bold text-white mb-3">{mid}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-3 py-2 text-zinc-500">維度</th>
                          {history[mid] &&
                            Object.values(history[mid])
                              .reduce((a, b) => (a.length > b.length ? a : b), [])
                              .map((entry, i) => (
                                <th key={i} className="px-3 py-2 text-zinc-500 text-center">
                                  {new Date(entry.date).toLocaleDateString('zh-TW', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </th>
                              ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DIMENSIONS.filter((dim) => history[mid]?.[dim]?.length > 1).map((dim) => (
                          <tr key={dim} className="border-b border-white/5">
                            <td className="px-3 py-2 text-zinc-400">{DIMENSION_LABELS[dim]}</td>
                            {history[mid][dim].map((entry, i) => {
                              const prev = i > 0 ? history[mid][dim][i - 1].score : null;
                              const diff = prev != null ? entry.score - prev : null;
                              return (
                                <td key={i} className="px-3 py-2 text-center">
                                  <span style={{ color: scoreColor(entry.score) }} className="font-bold">
                                    {entry.score}
                                  </span>
                                  {diff != null && diff !== 0 && (
                                    <span
                                      className="ml-1 text-[10px]"
                                      style={{ color: diff > 0 ? '#4ade80' : '#ef4444' }}
                                    >
                                      {diff > 0 ? `+${diff}` : diff}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
