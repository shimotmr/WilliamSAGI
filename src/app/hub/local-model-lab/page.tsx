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
};

type Dataset = {
  generatedAt: string;
  promptSets?: {
    core9?: string;
    researchAddon?: string;
  };
  summary: {
    liveModelCount: number;
    profileCount: number;
    benchmarkRowCount: number;
    runCount: number;
    coreSuiteLabel: string;
    researchSuiteLabel: string;
  };
  suites: Suite[];
  dimensions: Dimension[];
  models: ModelItem[];
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
  if (model.overallScore == null) return '這顆模型目前只有 live catalog，還沒有正式 benchmark。';
  if (model.overallScore >= 90) return '目前屬於本地主力候選，適合優先維持與追蹤。';
  if (model.overallScore >= 75) return '屬於可用強將，適合特定角色或作為備援。';
  if (model.overallScore >= 60) return '屬於可觀察候選，建議保留但先不要拉高權重。';
  return '目前偏弱，除非有特殊用途，不建議提高預設順位。';
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
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${scoreTone(model.overallScore)}`}>
                  {model.overallScore != null ? `${model.overallScore.toFixed(2)} 分` : '待測'}
                </span>
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
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
