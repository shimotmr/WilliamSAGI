'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock3,
  Cpu,
  Database,
  FlaskConical,
  HardDrive,
  Loader2,
  Microscope,
  Scale,
} from 'lucide-react';

type Dimension = {
  id: string;
  group: string;
  label: string;
  description: string;
  fixedPrompt: boolean;
};

type Suite = {
  id: string;
  label: string;
  purpose: string;
  scoreWeight: number;
  dimensions: string[];
};

type ModelFile = {
  path?: string | null;
  sizeBytes?: number | null;
  sizeGB?: number | null;
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
  suiteId: string;
  latestBenchmarkVersion?: string | null;
  previousBenchmarkVersion?: string | null;
  latestStartedAt?: string | null;
  previousStartedAt?: string | null;
  latestAverage: number;
  previousAverage: number;
  deltaAverage: number;
  summary: string;
  improvedDimensions: string[];
  degradedDimensions: string[];
  topDimensionDiffs: ComparisonDimension[];
};

type ModelItem = {
  id: string;
  displayName: string;
  provider: string;
  origin?: string | null;
  overallScore: number | null;
  censored?: boolean | null;
  avgSpeedMs?: number | null;
  capabilityDescription?: string | null;
  lastBenchmarkAt?: string | null;
  latestRunId?: string | null;
  latestCore9Average?: number | null;
  latestResearchRunId?: string | null;
  latestResearchAverage?: number | null;
  comparisons?: {
    core9?: RunComparison | null;
    researchAddon?: RunComparison | null;
  } | null;
  modelFile?: ModelFile | null;
};

type RunDimension = {
  score: number;
  responseTimeMs?: number | null;
  tokensUsed?: number | null;
  rawResponse?: string | null;
  promptUsed?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  benchmarkVersion?: string | null;
};

type RunItem = {
  runId: string;
  modelId: string;
  suiteId: string;
  benchmarkVersion?: string | null;
  startedAt: string;
  endedAt: string;
  averageScore: number;
  dimensionCount: number;
  dimensions: Record<string, RunDimension>;
  comparisonToPrevious?: RunComparison | null;
};

type Dataset = {
  generatedAt: string;
  blockedCandidatesVersion?: string | null;
  promptSets?: {
    core9?: string;
    researchAddon?: string;
  };
  summary: {
    liveModelCount: number;
    profileCount: number;
    benchmarkRowCount: number;
    runCount: number;
    blockedCandidateCount?: number;
    coreSuiteLabel: string;
    researchSuiteLabel: string;
  };
  suites: Suite[];
  dimensions: Dimension[];
  models: ModelItem[];
  blockedCandidates?: {
    id: string;
    displayName: string;
    family?: string | null;
    origin?: string | null;
    status?: string | null;
    stage?: string | null;
    downloaded?: boolean | null;
    downloadedAt?: string | null;
    modelPath?: string | null;
    modelSizeGB?: number | null;
    blockReason?: string | null;
    evidence?: string[];
    recommendation?: string | null;
    nextAction?: string | null;
    updatedAt?: string | null;
  }[];
  runs: RunItem[];
  topModels: ModelItem[];
  storage: {
    labRoot: string;
    runsDir: string;
    answersDir: string;
    reportsDir: string;
    datasetsDir: string;
  };
};

function formatTime(value?: string | null) {
  if (!value) return '尚未測試';
  return new Date(value).toLocaleString('zh-TW', { hour12: false });
}

function scoreTone(score?: number | null) {
  if (score == null) return 'text-zinc-400 border-white/10 bg-white/5';
  if (score >= 90) return 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10';
  if (score >= 75) return 'text-blue-300 border-blue-400/30 bg-blue-400/10';
  if (score >= 60) return 'text-amber-300 border-amber-400/30 bg-amber-400/10';
  return 'text-red-300 border-red-400/30 bg-red-400/10';
}

function summaryText(model: ModelItem) {
  const core = model.latestCore9Average;
  const research = model.latestResearchAverage;
  if (core == null && research == null) return '這顆模型目前只有 live catalog，還沒有正式 benchmark。';
  if ((core ?? 0) >= 92 && (research ?? 0) >= 80) return '目前屬於綜合平衡主力，適合放在常用路徑與關鍵任務。';
  if ((core ?? 0) >= 90) return '這顆模型偏向日常主力，適合速度、穩定度與結構化輸出要求高的任務。';
  if ((research ?? 0) >= 90) return '這顆模型偏向研究與深思任務，適合難題、比較、長文判讀與策略整理。';
  if ((core ?? 0) >= 75 || (research ?? 0) >= 75) return '屬於可用強將，適合特定角色或作為備援。';
  if ((core ?? 0) >= 60 || (research ?? 0) >= 60) return '屬於可觀察候選，建議保留但先不要拉高權重。';
  return '目前偏弱，除非有特殊用途，不建議提高預設順位。';
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

function roleTone(role: string) {
  if (role === '綜合平衡') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (role === 'Core 強') return 'border-blue-400/30 bg-blue-400/10 text-blue-200';
  if (role === 'Research 強') return 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200';
  if (role === '特長備援') return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
  return 'border-white/10 bg-white/5 text-zinc-300';
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

function decisionTone(decision: string) {
  if (decision === '可升級候選') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (decision === '維持現況') return 'border-blue-400/30 bg-blue-400/10 text-blue-200';
  if (decision === '不建議投入') return 'border-red-400/30 bg-red-400/10 text-red-200';
  return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
}

function modelLabel(model?: ModelItem | null) {
  if (!model) return '尚無資料';
  return model.displayName;
}

function deltaTone(delta?: number | null) {
  if (delta == null) return 'text-zinc-400';
  if (delta > 0) return 'text-emerald-300';
  if (delta < 0) return 'text-red-300';
  return 'text-zinc-300';
}

function formatDelta(delta?: number | null) {
  if (delta == null) return '—';
  return `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`;
}

export default function LocalModelLabPage() {
  const [data, setData] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [showStorage, setShowStorage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch('/data/local-model-lab-latest.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('無法載入本地模型實驗室資料');
        const payload = (await response.json()) as Dataset;
        if (!cancelled) setData(payload);
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

  const dimensionMap = useMemo(() => {
    const map = new Map<string, Dimension>();
    data?.dimensions.forEach((dimension) => map.set(dimension.id, dimension));
    return map;
  }, [data]);

  const capabilityGroups = useMemo(() => {
    const models = data?.models ?? [];
    const coreStrong = [...models]
      .filter((model) => model.latestCore9Average != null)
      .sort((a, b) => (b.latestCore9Average ?? -1) - (a.latestCore9Average ?? -1))
      .slice(0, 3);
    const researchStrong = [...models]
      .filter((model) => model.latestResearchAverage != null)
      .sort((a, b) => (b.latestResearchAverage ?? -1) - (a.latestResearchAverage ?? -1))
      .slice(0, 3);
    const balanced = [...models]
      .filter((model) => model.latestCore9Average != null || model.latestResearchAverage != null)
      .map((model) => ({
        model,
        balanceScore: ((model.latestCore9Average ?? 0) * 0.6) + ((model.latestResearchAverage ?? 0) * 0.4),
      }))
      .sort((a, b) => b.balanceScore - a.balanceScore)
      .slice(0, 3);
    return { coreStrong, researchStrong, balanced };
  }, [data]);

  const decisionGroups = useMemo(() => {
    const models = data?.models ?? [];
    const upgradeCandidates = models.filter((model) => decisionText(model) === '可升級候選');
    const maintain = models.filter((model) => decisionText(model) === '維持現況');
    const avoid = models.filter((model) => decisionText(model) === '不建議投入');
    return {
      upgradeCandidates,
      maintain,
      avoid,
    };
  }, [data]);

  const headlineModels = useMemo(() => {
    const models = data?.models ?? [];
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
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        載入本地模型實驗室資料中…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">
        無法載入本地模型實驗室資料，請先執行 publish。
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-500/15 p-3 text-indigo-300">
                <Microscope className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">本地模型實驗室</h1>
                <p className="text-sm text-zinc-400">
                  以固定題庫、固定 schema、固定 SSD 路徑累積本地模型測試資料。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300">
                {data.summary.liveModelCount} 顆 live 模型
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300">
                {data.summary.runCount} 次測試批次
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300">
                {data.summary.blockedCandidateCount ?? 0} 個 blocked 候選
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300">
                {data.summary.benchmarkRowCount} 筆維度結果
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right text-xs text-zinc-400">
            <div>資料生成時間</div>
            <div className="mt-1 font-medium text-zinc-200">{formatTime(data.generatedAt)}</div>
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

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-white">
            <Scale className="h-4 w-4 text-blue-300" />
            <h2 className="font-semibold">評測框架</h2>
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            主分數固定看 <span className="text-zinc-200">Core 9</span>，研究補充看 <span className="text-zinc-200">Research Add-on 8</span>。
          </p>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            {data.suites.map((suite) => (
              <div key={suite.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="font-medium text-white">{suite.label}</div>
                <div className="mt-1 text-xs text-zinc-400">{suite.purpose}</div>
                <div className="mt-2 text-xs text-zinc-500">{suite.dimensions.length} 個維度</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-white">
            <BookOpen className="h-4 w-4 text-emerald-300" />
            <h2 className="font-semibold">固定輸出策略</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>每次測試都寫入同一份 dataset。</li>
            <li>每個 run 都會在 SSD 留下 manifest 與單題答案。</li>
            <li>後續可直接把新模型與新量化接到同一條路徑。</li>
          </ul>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
            <div>Core 9 題庫版本：{data.promptSets?.core9 ?? '未記錄'}</div>
            <div className="mt-1">Research 題庫版本：{data.promptSets?.researchAddon ?? '未記錄'}</div>
            <div className="mt-1">Blocked 候選版本：{data.blockedCandidatesVersion ?? '未記錄'}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowStorage((value) => !value)}
          >
            <div className="flex items-center gap-2 text-white">
              <HardDrive className="h-4 w-4 text-amber-300" />
              <h2 className="font-semibold">SSD 路徑</h2>
            </div>
            {showStorage ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>
          <p className="mt-3 text-sm text-zinc-400">
            所有實驗資料統一放在外接 SSD 底下，之後不需要再分散找報告。
          </p>
          {showStorage ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
              <div>Lab: {data.storage.labRoot}</div>
              <div>Runs: {data.storage.runsDir}</div>
              <div>Answers: {data.storage.answersDir}</div>
              <div>Reports: {data.storage.reportsDir}</div>
              <div>Datasets: {data.storage.datasetsDir}</div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-blue-400/20 bg-blue-400/5 p-5">
          <div className="flex items-center gap-2 text-white">
            <Cpu className="h-4 w-4 text-blue-300" />
            <h2 className="font-semibold">Core 強</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">適合日常主力、結構化輸出、穩定工作流與低風險派發。</p>
          <div className="mt-4 space-y-3">
            {capabilityGroups.coreStrong.map((model, index) => (
              <div key={`${model.id}-core`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">#{index + 1} {model.displayName}</div>
                    <div className="mt-1 text-xs text-zinc-500">{roleText(model)}</div>
                  </div>
                  <div className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-xs text-blue-200">
                    Core {model.latestCore9Average?.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-5">
          <div className="flex items-center gap-2 text-white">
            <BookOpen className="h-4 w-4 text-fuchsia-300" />
            <h2 className="font-semibold">Research 強</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">適合研究、比較、長文判讀、策略整理與深度任務。</p>
          <div className="mt-4 space-y-3">
            {capabilityGroups.researchStrong.map((model, index) => (
              <div key={`${model.id}-research`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">#{index + 1} {model.displayName}</div>
                    <div className="mt-1 text-xs text-zinc-500">{roleText(model)}</div>
                  </div>
                  <div className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-1 text-xs text-fuchsia-200">
                    Research {model.latestResearchAverage?.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <div className="flex items-center gap-2 text-white">
            <Scale className="h-4 w-4 text-emerald-300" />
            <h2 className="font-semibold">綜合平衡</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">同時兼顧實戰與研究，適合做主力候選與多模型協作核心。</p>
          <div className="mt-4 space-y-3">
            {capabilityGroups.balanced.map(({ model, balanceScore }, index) => (
              <div key={`${model.id}-balanced`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">#{index + 1} {model.displayName}</div>
                    <div className="mt-1 text-xs text-zinc-500">{roleText(model)}</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
                    平衡 {balanceScore.toFixed(2)}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                  <span>Core {model.latestCore9Average?.toFixed(2) ?? '—'}</span>
                  <span>Research {model.latestResearchAverage?.toFixed(2) ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <div className="flex items-center gap-2 text-white">
            <Activity className="h-4 w-4 text-emerald-300" />
            <h2 className="font-semibold">可升級候選</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">同模型新舊版本差異明顯變好，值得進一步安排灰度測試或 runtime 接線。</p>
          <div className="mt-4 space-y-3">
            {decisionGroups.upgradeCandidates.length ? (
              decisionGroups.upgradeCandidates.map((model) => (
                <div key={`${model.id}-upgrade`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{model.displayName}</div>
                      <div className="mt-1 text-xs text-zinc-500">{summaryText(model)}</div>
                    </div>
                    <div className={`rounded-full border px-2.5 py-1 text-xs ${decisionTone('可升級候選')}`}>升級候選</div>
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
            <Scale className="h-4 w-4 text-blue-300" />
            <h2 className="font-semibold">維持現況</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">這些模型目前角色清楚、分數合理，適合保留在多模型協作裡各司其職。</p>
          <div className="mt-4 space-y-3">
            {decisionGroups.maintain.slice(0, 6).map((model) => (
              <div key={`${model.id}-maintain`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">{model.displayName}</div>
                    <div className="mt-1 text-xs text-zinc-500">{roleText(model)}・Core {model.latestCore9Average?.toFixed(2) ?? '—'} / Research {model.latestResearchAverage?.toFixed(2) ?? '—'}</div>
                  </div>
                  <div className={`rounded-full border px-2.5 py-1 text-xs ${decisionTone('維持現況')}`}>維持</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-5">
          <div className="flex items-center gap-2 text-white">
            <Database className="h-4 w-4 text-red-300" />
            <h2 className="font-semibold">不建議投入</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">分數過低或已證明不划算，除非有特殊用途，否則不建議繼續加權或擴大測試。</p>
          <div className="mt-4 space-y-3">
            {decisionGroups.avoid.length ? (
              decisionGroups.avoid.map((model) => (
                <div key={`${model.id}-avoid`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{model.displayName}</div>
                      <div className="mt-1 text-xs text-zinc-500">Core {model.latestCore9Average?.toFixed(2) ?? '—'} / Research {model.latestResearchAverage?.toFixed(2) ?? '—'}</div>
                    </div>
                    <div className={`rounded-full border px-2.5 py-1 text-xs ${decisionTone('不建議投入')}`}>不建議</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">目前沒有被歸到這一區的模型。</div>
            )}
          </div>
        </div>
      </section>

      {data.blockedCandidates?.length ? (
        <section className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-white">
            <HardDrive className="h-4 w-4 text-amber-300" />
            <h2 className="text-lg font-semibold">Blocked 候選</h2>
          </div>
          <div className="space-y-3">
            {data.blockedCandidates.map((candidate) => (
              <article key={candidate.id} className="rounded-3xl border border-amber-400/20 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{candidate.displayName}</h3>
                    <p className="mt-1 text-xs text-zinc-500">{candidate.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-amber-200">
                      {candidate.stage ?? 'blocked'}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300">
                      {candidate.modelSizeGB ? `${candidate.modelSizeGB} GB` : '大小未記錄'}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{candidate.blockReason ?? '目前無法進入正式 benchmark 路徑。'}</p>
                <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-zinc-500">來源</div>
                    <div className="mt-1 text-zinc-200">{candidate.origin ?? '未記錄'}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-zinc-500">最後更新</div>
                    <div className="mt-1 text-zinc-200">{formatTime(candidate.updatedAt)}</div>
                  </div>
                </div>
                {candidate.evidence?.length ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-sm font-medium text-white">阻塞證據</div>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">
                      {candidate.evidence.map((item, index) => (
                        <li key={`${candidate.id}-${index}`}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {candidate.recommendation ? (
                  <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm leading-6 text-emerald-100">
                    建議：{candidate.recommendation}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-white">
          <Cpu className="h-4 w-4 text-indigo-300" />
          <h2 className="text-lg font-semibold">目前模型與角色定位</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.models.map((model) => (
            <article key={model.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{model.displayName}</h3>
                  <p className="mt-1 text-xs text-zinc-500">{model.id}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${decisionTone(decisionText(model))}`}>
                    {decisionText(model)}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${roleTone(roleText(model))}`}>
                    {roleText(model)}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${scoreTone(model.overallScore)}`}>
                    {model.overallScore != null ? `${model.overallScore.toFixed(2)} 分` : '待測'}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-300">{summaryText(model)}</p>
              <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-zinc-500">最後評測</div>
                  <div className="mt-1 text-zinc-200">{formatTime(model.lastBenchmarkAt)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-zinc-500">模型大小</div>
                  <div className="mt-1 text-zinc-200">
                    {model.modelFile?.sizeGB ? `${model.modelFile.sizeGB} GB` : '未記錄'}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-zinc-500">資料來源</div>
                  <div className="mt-1 text-zinc-200">{model.origin ?? '未記錄'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-zinc-500">平均延遲</div>
                  <div className="mt-1 text-zinc-200">{model.avgSpeedMs ? `${model.avgSpeedMs} ms` : '未記錄'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-zinc-500">審查標記</div>
                  <div className="mt-1 text-zinc-200">{model.censored == null ? '未記錄' : model.censored ? '偏嚴' : '正常'}</div>
                </div>
              </div>
              {model.comparisons?.core9 ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">Core 9 新舊差異</div>
                    <div className={`text-sm font-semibold ${deltaTone(model.comparisons.core9.deltaAverage)}`}>
                      {formatDelta(model.comparisons.core9.deltaAverage)} 分
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{model.comparisons.core9.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                    <span>新版：{formatTime(model.comparisons.core9.latestStartedAt)}</span>
                    <span>舊版：{formatTime(model.comparisons.core9.previousStartedAt)}</span>
                  </div>
                  {model.comparisons.core9.topDimensionDiffs.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {model.comparisons.core9.topDimensionDiffs.slice(0, 3).map((item) => (
                        <span
                          key={item.dimensionId}
                          className={`rounded-full border px-2.5 py-1 text-[11px] ${
                            item.delta > 0
                              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                              : 'border-red-400/30 bg-red-400/10 text-red-200'
                          }`}
                        >
                          {(dimensionMap.get(item.dimensionId)?.label ?? item.dimensionId)} {formatDelta(item.delta)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {model.comparisons?.researchAddon ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">Research Add-on 差異</div>
                    <div className={`text-sm font-semibold ${deltaTone(model.comparisons.researchAddon.deltaAverage)}`}>
                      {formatDelta(model.comparisons.researchAddon.deltaAverage)} 分
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{model.comparisons.researchAddon.summary}</p>
                </div>
              ) : null}
              {model.capabilityDescription ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-zinc-400">
                  {model.capabilityDescription}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-white">
          <FlaskConical className="h-4 w-4 text-fuchsia-300" />
          <h2 className="text-lg font-semibold">最近測試批次</h2>
        </div>
        <div className="space-y-3">
          {data.runs.slice(0, 12).map((run) => {
            const expanded = openRunId === run.runId;
            return (
              <div key={run.runId} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 text-left"
                  onClick={() => setOpenRunId(expanded ? null : run.runId)}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{run.modelId}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs ${scoreTone(run.averageScore)}`}>
                        {run.suiteId === 'research-addon-v1' ? 'Research' : 'Core 9'} {run.averageScore.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatTime(run.startedAt)}</span>
                      <span className="inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" />{run.dimensionCount} 維</span>
                      <span className="inline-flex items-center gap-1"><Activity className="h-3.5 w-3.5" />{run.benchmarkVersion ?? '未標記版本'}</span>
                    </div>
                  </div>
                  {expanded ? <ChevronUp className="mt-1 h-4 w-4 text-zinc-500" /> : <ChevronDown className="mt-1 h-4 w-4 text-zinc-500" />}
                </button>
                {expanded ? (
                  <>
                    {run.comparisonToPrevious ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-medium text-white">與上一版比較</div>
                          <div className={`text-sm font-semibold ${deltaTone(run.comparisonToPrevious.deltaAverage)}`}>
                            {formatDelta(run.comparisonToPrevious.deltaAverage)} 分
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-zinc-400">{run.comparisonToPrevious.summary}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {run.comparisonToPrevious.topDimensionDiffs.slice(0, 4).map((item) => (
                            <span
                              key={item.dimensionId}
                              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                                item.delta > 0
                                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                                  : 'border-red-400/30 bg-red-400/10 text-red-200'
                              }`}
                            >
                              {(dimensionMap.get(item.dimensionId)?.label ?? item.dimensionId)} {formatDelta(item.delta)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(run.dimensions).map(([dimensionId, entry]) => (
                        <div key={dimensionId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="text-sm font-medium text-white">
                            {dimensionMap.get(dimensionId)?.label ?? dimensionId}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className={`rounded-full border px-2 py-0.5 ${scoreTone(entry.score)}`}>{entry.score} 分</span>
                            <span className="text-zinc-500">{entry.responseTimeMs ?? '—'} ms</span>
                          </div>
                          {entry.benchmarkVersion ? (
                            <div className="mt-2 text-[11px] text-zinc-500">{entry.benchmarkVersion}</div>
                          ) : null}
                          {entry.notes ? (
                            <p className="mt-2 text-xs leading-5 text-zinc-400">{entry.notes}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
