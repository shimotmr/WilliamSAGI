'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Clock3,
  Cpu,
  Loader2,
  Microscope,
  Trophy,
  TrendingUp,
} from 'lucide-react';

type Dimension = {
  id: string;
  group: string;
  label: string;
};

type ComparisonDimension = {
  dimensionId: string;
  latestScore: number;
  previousScore: number;
  delta: number;
  direction: 'up' | 'down';
};

type RunComparison = {
  latestRunId: string;
  previousRunId: string;
  latestAverage: number;
  previousAverage: number;
  deltaAverage: number;
  summary: string;
  topDimensionDiffs: ComparisonDimension[];
};

type ModelItem = {
  id: string;
  displayName: string;
  overallScore: number | null;
  latestCore9Average?: number | null;
  latestResearchAverage?: number | null;
  capabilityDescription?: string | null;
  lastBenchmarkAt?: string | null;
  censored?: boolean | null;
  comparisons?: {
    core9?: RunComparison | null;
    researchAddon?: RunComparison | null;
  } | null;
};

type RunDimension = {
  score: number;
  createdAt?: string | null;
};

type RunItem = {
  runId: string;
  modelId: string;
  suiteId: string;
  startedAt: string;
  averageScore: number;
  dimensions: Record<string, RunDimension>;
};

type Dataset = {
  generatedAt: string;
  summary: {
    liveModelCount: number;
    profileCount: number;
    benchmarkRowCount: number;
    runCount: number;
    coreSuiteLabel: string;
    researchSuiteLabel: string;
  };
  dimensions: Dimension[];
  models: ModelItem[];
  runs: RunItem[];
  topModels: ModelItem[];
};

const MEDAL = ['🥇', '🥈', '🥉'];

function scoreColor(score: number) {
  if (score >= 85) return '#4ade80';
  if (score >= 70) return '#60a5fa';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function scoreBg(score: number) {
  if (score >= 85) return 'rgba(74,222,128,0.12)';
  if (score >= 70) return 'rgba(96,165,250,0.12)';
  if (score >= 50) return 'rgba(245,158,11,0.12)';
  return 'rgba(239,68,68,0.12)';
}

function formatTime(value?: string | null) {
  if (!value) return '尚未測試';
  return new Date(value).toLocaleString('zh-TW', { hour12: false });
}

function formatDelta(delta?: number | null) {
  if (delta == null) return '—';
  return `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`;
}

function deltaTone(delta?: number | null) {
  if (delta == null) return 'text-zinc-400';
  if (delta > 0) return 'text-emerald-300';
  if (delta < 0) return 'text-red-300';
  return 'text-zinc-300';
}

function roleText(model: ModelItem) {
  const core = model.latestCore9Average ?? 0;
  const research = model.latestResearchAverage ?? 0;
  if (core >= 90 && research >= 85) return '綜合平衡';
  if (core >= research + 8 && core >= 80) return 'Core 強';
  if (research >= core + 8 && research >= 80) return 'Research 強';
  if (core >= 75 || research >= 75) return '特長備援';
  return '候選觀察';
}

function decisionText(model: ModelItem) {
  const core = model.latestCore9Average ?? 0;
  const research = model.latestResearchAverage ?? 0;
  const role = roleText(model);
  const coreDelta = model.comparisons?.core9?.deltaAverage ?? null;
  const researchDelta = model.comparisons?.researchAddon?.deltaAverage ?? null;

  if ((coreDelta != null && coreDelta >= 8) || (researchDelta != null && researchDelta >= 12)) {
    return '可升級候選';
  }
  if (role === '綜合平衡' || role === 'Core 強' || role === 'Research 強' || role === '特長備援') {
    return '維持現況';
  }
  if (core <= 55 && research <= 50) {
    return '不建議投入';
  }
  return '候選觀察';
}

function badgeTone(kind: string) {
  if (kind === '可升級候選') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (kind === '維持現況') return 'border-blue-400/30 bg-blue-400/10 text-blue-200';
  if (kind === '不建議投入') return 'border-red-400/30 bg-red-400/10 text-red-200';
  if (kind === '綜合平衡') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (kind === 'Core 強') return 'border-sky-400/30 bg-sky-400/10 text-sky-200';
  if (kind === 'Research 強') return 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200';
  if (kind === '特長備援') return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
  return 'border-white/10 bg-white/5 text-zinc-300';
}

function modelLabel(model?: ModelItem | null) {
  if (!model) return '尚無資料';
  return model.displayName;
}

function RadarChart({
  data,
  labels,
  label,
  color = '#5E6AD2',
  size = 280,
}: {
  data: Record<string, number>;
  labels: Record<string, string>;
  label: string;
  color?: string;
  size?: number;
}) {
  const dims = Object.keys(labels);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = dims.length;
  const angleStep = (2 * Math.PI) / n;
  const offset = -Math.PI / 2;

  const pointAt = (i: number, ratio: number) => {
    const angle = offset + i * angleStep;
    return { x: cx + r * ratio * Math.cos(angle), y: cy + r * ratio * Math.sin(angle) };
  };

  const polygon = dims
    .map((dimensionId, index) => {
      const { x, y } = pointAt(index, (data[dimensionId] ?? 0) / 100);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-semibold text-white">{label}</span>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={dims
              .map((_, index) => {
                const point = pointAt(index, ring);
                return `${point.x},${point.y}`;
              })
              .join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        {dims.map((_, index) => {
          const point = pointAt(index, 1);
          return (
            <line
              key={index}
              x1={cx}
              y1={cy}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}
        <polygon points={polygon} fill={`${color}33`} stroke={color} strokeWidth="2" />
        {dims.map((dimensionId, index) => {
          const { x, y } = pointAt(index, (data[dimensionId] ?? 0) / 100);
          return <circle key={dimensionId} cx={x} cy={y} r="3.5" fill={color} />;
        })}
        {dims.map((dimensionId, index) => {
          const point = pointAt(index, 1.18);
          const anchor = point.x < cx - 10 ? 'end' : point.x > cx + 10 ? 'start' : 'middle';
          return (
            <text
              key={dimensionId}
              x={point.x}
              y={point.y}
              textAnchor={anchor}
              dominantBaseline="central"
              fill="#8A8F98"
              fontSize="10"
              fontWeight="500"
            >
              {labels[dimensionId]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function ModelBenchmarkPage() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch('/data/local-model-lab-latest.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('無法載入統一 benchmark dataset');
        const payload = (await response.json()) as Dataset;
        if (!cancelled) setDataset(payload);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const coreDimensions = useMemo(
    () => (dataset?.dimensions ?? []).filter((dimension) => dimension.group === 'core9'),
    [dataset],
  );

  const dimensionLabels = useMemo(
    () => Object.fromEntries(coreDimensions.map((dimension) => [dimension.id, dimension.label])),
    [coreDimensions],
  );

  const profiles = useMemo(() => {
    if (!dataset) return [];
    return [...dataset.models]
      .filter((model) => model.latestCore9Average != null)
      .sort((left, right) => (right.latestCore9Average ?? 0) - (left.latestCore9Average ?? 0));
  }, [dataset]);

  const latestCoreRuns = useMemo(() => {
    const map: Record<string, RunItem> = {};
    for (const run of dataset?.runs ?? []) {
      if (run.suiteId !== 'core9-v1') continue;
      if (!map[run.modelId]) map[run.modelId] = run;
    }
    return map;
  }, [dataset]);

  const latestScores = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    Object.entries(latestCoreRuns).forEach(([modelId, run]) => {
      map[modelId] = Object.fromEntries(
        Object.entries(run.dimensions).map(([dimensionId, value]) => [dimensionId, value.score]),
      );
    });
    return map;
  }, [latestCoreRuns]);

  const history = useMemo(() => {
    const map: Record<string, { runId: string; startedAt: string; averageScore: number }[]> = {};
    for (const run of dataset?.runs ?? []) {
      if (run.suiteId !== 'core9-v1') continue;
      if (!map[run.modelId]) map[run.modelId] = [];
      map[run.modelId].push({
        runId: run.runId,
        startedAt: run.startedAt,
        averageScore: run.averageScore,
      });
    }
    return map;
  }, [dataset]);

  const decisionGroups = useMemo(() => {
    const models = dataset?.models ?? [];
    return {
      upgrade: models.filter((model) => decisionText(model) === '可升級候選'),
      maintain: models.filter((model) => decisionText(model) === '維持現況').slice(0, 6),
      avoid: models.filter((model) => decisionText(model) === '不建議投入').slice(0, 6),
    };
  }, [dataset]);

  const headlineModels = useMemo(() => {
    const models = dataset?.models ?? [];
    const bestCore = [...models]
      .filter((model) => model.latestCore9Average != null)
      .sort((a, b) => (b.latestCore9Average ?? -1) - (a.latestCore9Average ?? -1))[0] ?? null;
    const bestResearch = [...models]
      .filter((model) => model.latestResearchAverage != null)
      .sort((a, b) => (b.latestResearchAverage ?? -1) - (a.latestResearchAverage ?? -1))[0] ?? null;
    const bestUpgrade = [...models]
      .filter((model) => decisionText(model) === '可升級候選')
      .sort((a, b) => {
        const aDelta = Math.max(a.comparisons?.core9?.deltaAverage ?? -999, a.comparisons?.researchAddon?.deltaAverage ?? -999);
        const bDelta = Math.max(b.comparisons?.core9?.deltaAverage ?? -999, b.comparisons?.researchAddon?.deltaAverage ?? -999);
        return bDelta - aDelta;
      })[0] ?? null;
    return { bestCore, bestResearch, bestUpgrade };
  }, [dataset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-zinc-500">
        <Loader2 className="mr-2 animate-spin" size={20} /> 載入模型評比資料中…
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">
        無法載入統一 benchmark dataset，請先重新 publish Local Model Lab。
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 text-amber-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div className="space-y-1 text-sm leading-relaxed">
            <p className="font-semibold">本頁已切換到統一實驗室資料源</p>
            <p>
              這裡現在直接讀取 <code>/data/local-model-lab-latest.json</code>，不再混用舊版
              <code>model_profiles</code> / <code>model_benchmarks</code>。
            </p>
            <p className="text-amber-200/80">
              生成時間：{formatTime(dataset.generatedAt)}｜Core 9：{dataset.summary.coreSuiteLabel}｜Research：
              {dataset.summary.researchSuiteLabel}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-sky-400/20 bg-sky-400/5 p-4">
          <div className="text-xs text-sky-200/80">目前最佳主力</div>
          <div className="mt-1 text-base font-semibold text-white">{modelLabel(headlineModels.bestCore)}</div>
          <div className="mt-2 text-xs text-zinc-400">
            Core {headlineModels.bestCore?.latestCore9Average?.toFixed(2) ?? '—'}｜適合日常主線與結構化任務
          </div>
        </div>
        <div className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
          <div className="text-xs text-fuchsia-200/80">目前最佳研究</div>
          <div className="mt-1 text-base font-semibold text-white">{modelLabel(headlineModels.bestResearch)}</div>
          <div className="mt-2 text-xs text-zinc-400">
            Research {headlineModels.bestResearch?.latestResearchAverage?.toFixed(2) ?? '—'}｜適合比較、長文判讀與策略整理
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <div className="text-xs text-emerald-200/80">目前最佳升級候選</div>
          <div className="mt-1 text-base font-semibold text-white">{modelLabel(headlineModels.bestUpgrade)}</div>
          <div className="mt-2 text-xs text-zinc-400">
            {headlineModels.bestUpgrade
              ? `Core Δ ${formatDelta(headlineModels.bestUpgrade.comparisons?.core9?.deltaAverage ?? null)}｜Research Δ ${formatDelta(headlineModels.bestUpgrade.comparisons?.researchAddon?.deltaAverage ?? null)}`
              : '目前沒有明確需要往上升的候選'}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <div className="flex items-center gap-2 text-white">
            <TrendingUp className="h-4 w-4 text-emerald-300" />
            <h2 className="font-semibold">可升級候選</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">新舊版本差異已證明有明顯提升，值得往正式 runtime 或灰度驗證推進。</p>
          <div className="mt-4 space-y-3">
            {decisionGroups.upgrade.length ? (
              decisionGroups.upgrade.map((model) => (
                <div key={`${model.id}-upgrade`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-sm font-medium text-white">{model.displayName}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full border px-2.5 py-1 ${badgeTone(decisionText(model))}`}>{decisionText(model)}</span>
                    <span className={`rounded-full border px-2.5 py-1 ${badgeTone(roleText(model))}`}>{roleText(model)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">目前沒有需要立即升級的同模型候選。</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-blue-400/20 bg-blue-400/5 p-5">
          <div className="flex items-center gap-2 text-white">
            <Cpu className="h-4 w-4 text-blue-300" />
            <h2 className="font-semibold">維持現況</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">角色與分數已經合理，適合繼續放在多模型協作裡發揮長處。</p>
          <div className="mt-4 space-y-3">
            {decisionGroups.maintain.map((model) => (
              <div key={`${model.id}-maintain`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-medium text-white">{model.displayName}</div>
                <div className="mt-1 text-xs text-zinc-500">Core {model.latestCore9Average?.toFixed(2) ?? '—'} / Research {model.latestResearchAverage?.toFixed(2) ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-5">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-4 w-4 text-red-300" />
            <h2 className="font-semibold">不建議投入</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">分數已經證明不划算，除非有特殊情境，否則不建議再投入更多測試與排序權重。</p>
          <div className="mt-4 space-y-3">
            {decisionGroups.avoid.length ? (
              decisionGroups.avoid.map((model) => (
                <div key={`${model.id}-avoid`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-sm font-medium text-white">{model.displayName}</div>
                  <div className="mt-1 text-xs text-zinc-500">Core {model.latestCore9Average?.toFixed(2) ?? '—'} / Research {model.latestResearchAverage?.toFixed(2) ?? '—'}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">目前沒有被歸到這一區的模型。</div>
            )}
          </div>
        </div>
      </section>

      <div>
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
            <Microscope size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">模型評比</h1>
            <p className="text-sm text-zinc-400">統一讀取 Local Model Lab，避免舊分數混用。</p>
          </div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-zinc-400"><Cpu size={16} /> 模型數</div>
          <div className="text-2xl font-black text-white">{profiles.length}</div>
          <div className="text-xs text-zinc-500">目前有 Core 9 正式分數的模型</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-zinc-400"><Activity size={16} /> 測試批次</div>
          <div className="text-2xl font-black text-white">{dataset.summary.runCount}</div>
          <div className="text-xs text-zinc-500">含 Core 9 與 Research Add-on</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-zinc-400"><Clock3 size={16} /> 最新更新</div>
          <div className="text-base font-bold text-white">{formatTime(dataset.generatedAt)}</div>
          <div className="text-xs text-zinc-500">統一 publish 時間</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-zinc-400"><TrendingUp size={16} /> 高分模型</div>
          <div className="text-2xl font-black text-white">
            {profiles.filter((model) => (model.latestCore9Average ?? 0) >= 85).length}
          </div>
          <div className="text-xs text-zinc-500">Core 9 分數 85 以上</div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Trophy size={18} className="text-yellow-400" /> Core 9 排行榜
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((model, index) => (
            <div
              key={model.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-lg">{MEDAL[index] ?? `#${index + 1}`}</span>
                    <h3 className="truncate font-bold text-white">{model.displayName}</h3>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">最後測試：{formatTime(model.lastBenchmarkAt)}</p>
                </div>
                <span
                  className="shrink-0 rounded-xl px-3 py-1 text-lg font-black tabular-nums"
                  style={{
                    color: scoreColor(model.latestCore9Average ?? 0),
                    background: scoreBg(model.latestCore9Average ?? 0),
                  }}
                >
                  {(model.latestCore9Average ?? 0).toFixed(2)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-300">
                  Research：{model.latestResearchAverage != null ? model.latestResearchAverage.toFixed(2) : '未跑'}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-300">
                  審查：{model.censored ? '偏嚴' : '較自由'}
                </span>
              </div>

              {model.comparisons?.core9 && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-300">
                  <div className="mb-1 font-semibold text-white">與上一版比較</div>
                  <div className={`font-bold ${deltaTone(model.comparisons.core9.deltaAverage)}`}>
                    {formatDelta(model.comparisons.core9.deltaAverage)} 分
                  </div>
                  <div className="mt-1 text-zinc-400">{model.comparisons.core9.summary}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {profiles.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Cpu size={18} className="text-indigo-400" /> Core 9 雷達圖
          </h2>
          {profiles.length > 2 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {profiles.map((model, index) => (
                <button
                  key={model.id}
                  onClick={() => setActiveTab(index)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: activeTab === index ? 'rgba(94,106,210,0.2)' : 'rgba(255,255,255,0.04)',
                    color: activeTab === index ? '#EDEDEF' : '#8A8F98',
                    borderColor: activeTab === index ? 'rgba(94,106,210,0.3)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {model.displayName}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-6">
            {profiles.length <= 2
              ? profiles.map((model, index) => (
                  <RadarChart
                    key={model.id}
                    data={latestScores[model.id] ?? {}}
                    labels={dimensionLabels}
                    label={model.displayName}
                    color={['#5E6AD2', '#4ade80', '#f97316'][index % 3]}
                  />
                ))
              : (
                <RadarChart
                  data={latestScores[profiles[activeTab]?.id] ?? {}}
                  labels={dimensionLabels}
                  label={profiles[activeTab]?.displayName ?? ''}
                />
              )}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <ChevronRight size={18} className="text-emerald-400" /> Core 9 維度詳細對比
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-4 py-3 text-left font-semibold text-zinc-400">維度</th>
                {profiles.map((model) => (
                  <th key={model.id} className="px-4 py-3 text-center font-semibold text-zinc-400">
                    {model.displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coreDimensions.map((dimension) => (
                <tr key={dimension.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-zinc-300">{dimension.label}</td>
                  {profiles.map((model) => {
                    const score = latestScores[model.id]?.[dimension.id];
                    return (
                      <td key={model.id} className="px-4 py-3 text-center">
                        {score != null ? (
                          <span
                            className="inline-block rounded-md px-2.5 py-1 text-xs font-bold tabular-nums"
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

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <TrendingUp size={18} className="text-cyan-400" /> Core 9 測試歷史
        </h2>
        <div className="space-y-4">
          {profiles.map((model) => {
            const runs = history[model.id] ?? [];
            if (runs.length <= 1) return null;
            return (
              <div key={model.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-bold text-white">{model.displayName}</h3>
                  <span className="text-xs text-zinc-500">{runs.length} 次 Core 9 測試</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-3 py-2 text-left text-zinc-500">時間</th>
                        <th className="px-3 py-2 text-center text-zinc-500">平均分</th>
                        <th className="px-3 py-2 text-left text-zinc-500">Run ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...runs].reverse().map((run, index, array) => {
                        const prev = index < array.length - 1 ? array[index + 1].averageScore : null;
                        const delta = prev != null ? run.averageScore - prev : null;
                        return (
                          <tr key={run.runId} className="border-b border-white/5">
                            <td className="px-3 py-2 text-zinc-300">{formatTime(run.startedAt)}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="font-bold" style={{ color: scoreColor(run.averageScore) }}>
                                {run.averageScore.toFixed(2)}
                              </span>
                              {delta != null && (
                                <span className={`ml-2 ${deltaTone(delta)}`}>{formatDelta(delta)}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-zinc-500">{run.runId}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
