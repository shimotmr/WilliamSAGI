'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpCircle,
  BadgeCheck,
  Bot,
  ChevronDown,
  ChevronUp,
  Cpu,
  ExternalLink,
  Filter,
  Globe,
  Loader2,
  Package,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wrench,
} from 'lucide-react';

type CategoryKey = 'overview' | 'model' | 'tool' | 'package' | 'skill' | 'extension' | 'frontend' | 'api';

type Recommendation = {
  action: string;
  label: string;
  why: string[];
};

type ItemRisk = {
  securityStatus: string;
  reviewStatus: string;
  negativeSignals: string[];
  activitySignals?: string[];
  advisories: {
    count: number;
    critical: number;
    high: number;
  };
};

type ExternalRiskHit = {
  title: string;
  link: string;
  publishedAt?: string | null;
  sourceName: string;
  riskScore: number;
};

type ItemSupport = {
  level: string;
  note: string;
};

type UpgradeItem = {
  id: string;
  name: string;
  category: Exclude<CategoryKey, 'overview'>;
  subcategory: string;
  tags: string[];
  scanFrequency: string;
  sourceType: string;
  sourceUrl?: string | null;
  currentVersion?: string | null;
  latestVersion?: string | null;
  versionComparison: number;
  support: ItemSupport;
  risk: ItemRisk;
  recommendation: Recommendation;
  macosFit: string[];
  featureSuggestions: string[];
  summary: string;
  installedStatus: string;
  externalRiskHits?: ExternalRiskHit[];
  priority?: {
    score: number;
    tier: string;
    reasons: string[];
  };
  nextActions?: string[];
};

type AgentRecommendation = {
  agent: string;
  primary: string | null;
  fallbacks: string[];
  notes: string[];
};

type UpgradeDataset = {
  generatedAt: string;
  summary: {
    totalTargets: number;
    categoryCounts: Record<string, number>;
    recommendationCounts: Record<string, number>;
    urgent: { name: string; label: string; summary: string }[];
    topPriority?: { name: string; tier: string; score: number; summary: string; nextActions?: string[] }[];
    macFitHighlights: string[];
  };
  categoryTags: Record<string, string[]>;
  items: UpgradeItem[];
  modelRecommendations: {
    vectors: Record<string, string[]>;
    agents: AgentRecommendation[];
  };
  externalRiskSummary?: {
    sourceCount?: number;
    matchedTargets?: number;
    topTargets?: { targetId: string; count: number }[];
  };
};

type ActionState = {
  loading: boolean;
  message: string | null;
  tone: 'success' | 'error' | 'info' | null;
};

const tabs: { key: CategoryKey; label: string; icon: typeof Filter }[] = [
  { key: 'overview', label: '總覽', icon: Filter },
  { key: 'model', label: '模型', icon: Cpu },
  { key: 'tool', label: '工具', icon: Wrench },
  { key: 'package', label: 'Python', icon: Package },
  { key: 'skill', label: 'Skills', icon: Sparkles },
  { key: 'extension', label: 'Extensions', icon: Bot },
  { key: 'frontend', label: '前端', icon: Activity },
  { key: 'api', label: 'APIs', icon: Globe },
];

const recommendationClass: Record<string, string> = {
  已最新: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  建議升級: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  觀察等待: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300',
  等待OpenClaw支援: 'border-purple-400/30 bg-purple-400/10 text-purple-300',
  安全疑慮: 'border-red-400/30 bg-red-400/10 text-red-300',
  手動檢查: 'border-white/20 bg-white/10 text-gray-200',
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  const className = recommendationClass[label] || 'border-white/15 bg-white/5 text-gray-300';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>;
}

function RiskPill({ risk }: { risk: ItemRisk }) {
  if (risk.securityStatus === 'critical') {
    return <span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-2 py-1 text-[11px] text-red-300"><ShieldAlert className="h-3 w-3" />高風險</span>;
  }
  if (risk.securityStatus === 'warning' || risk.reviewStatus === 'monitor') {
    return <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-[11px] text-yellow-300"><AlertTriangle className="h-3 w-3" />需觀察</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300"><BadgeCheck className="h-3 w-3" />清晰</span>;
}

function ItemCard({ item }: { item: UpgradeItem }) {
  const [open, setOpen] = useState(false);
  const [actionState, setActionState] = useState<ActionState>({ loading: false, message: null, tone: null });
  const versionLine = [item.currentVersion || '—', item.latestVersion || '—'].join(' → ');

  async function triggerAction(action: 'followup' | 'smoke') {
    try {
      setActionState({ loading: true, message: null, tone: null });
      const response = await fetch('/api/hub/upgrade-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, action }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }
      if (payload.duplicate) {
        setActionState({
          loading: false,
          message: `已存在任務 #${payload.taskId}：${payload.title}`,
          tone: 'info',
        });
        return;
      }
      setActionState({
        loading: false,
        message: `已建立 #${payload.taskId}（${payload.assignee} / ${payload.priority}）`,
        tone: 'success',
      });
    } catch (error) {
      setActionState({
        loading: false,
        message: error instanceof Error ? error.message : '建立動作失敗',
        tone: 'error',
      });
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E1118] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{item.name}</h3>
            <Badge label={item.recommendation.label} />
            <RiskPill risk={item.risk} />
            <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-gray-400">{item.subcategory}</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">{versionLine}</div>
          <p className="mt-2 text-sm text-gray-300">{item.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <div>
            <div className="text-xs font-medium text-gray-400">OpenClaw 支援</div>
            <div className="mt-1 text-sm text-white">{item.support.level}</div>
            <div className="text-xs text-gray-500">{item.support.note}</div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-400">建議理由</div>
            <ul className="mt-1 space-y-1 text-sm text-gray-300">
              {item.recommendation.why.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>

          {!!item.nextActions?.length && (
            <div>
              <div className="text-xs font-medium text-gray-400">下一步建議</div>
              <ul className="mt-1 space-y-1 text-sm text-gray-300">
                {item.nextActions.map((action) => (
                  <li key={action}>- {action}</li>
                ))}
              </ul>
            </div>
          )}

          {item.featureSuggestions.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-400">升級 / 替換建議</div>
              <ul className="mt-1 space-y-1 text-sm text-gray-300">
                {item.featureSuggestions.map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
            </div>
          )}

          {item.macosFit.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-400">Mac mini / macOS 建議</div>
              <ul className="mt-1 space-y-1 text-sm text-gray-300">
                {item.macosFit.map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
            </div>
          )}

          {item.risk.negativeSignals.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-400">負面訊號</div>
              <ul className="mt-1 space-y-1 text-sm text-gray-300">
                {item.risk.negativeSignals.map((signal) => (
                  <li key={signal}>- {signal}</li>
                ))}
              </ul>
            </div>
          )}

          {!!item.risk.activitySignals?.length && (
            <div>
              <div className="text-xs font-medium text-gray-400">活性 / 維護訊號</div>
              <ul className="mt-1 space-y-1 text-sm text-gray-300">
                {item.risk.activitySignals.map((signal) => (
                  <li key={signal}>- {signal}</li>
                ))}
              </ul>
            </div>
          )}

          {!!item.externalRiskHits?.length && (
            <div>
              <div className="text-xs font-medium text-gray-400">外部風險來源</div>
              <ul className="mt-1 space-y-2 text-sm text-gray-300">
                {item.externalRiskHits.slice(0, 3).map((hit) => (
                  <li key={`${hit.sourceName}-${hit.link}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-gray-500">{hit.sourceName}</div>
                    <a href={hit.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200">
                      {hit.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-gray-400">快速動作</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => triggerAction('followup')}
                disabled={actionState.loading}
                className="rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs text-blue-200 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionState.loading ? '處理中...' : '建立追蹤卡'}
              </button>
              <button
                onClick={() => triggerAction('smoke')}
                disabled={actionState.loading}
                className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionState.loading ? '處理中...' : '建立 Smoke 卡'}
              </button>
            </div>
            {actionState.message && (
              <div
                className={`mt-2 text-xs ${
                  actionState.tone === 'success'
                    ? 'text-emerald-300'
                    : actionState.tone === 'error'
                      ? 'text-red-300'
                      : 'text-gray-400'
                }`}
              >
                {actionState.message}
              </div>
            )}
          </div>

          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200"
            >
              查看來源 <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function AgentFallbackCard({ agent }: { agent: AgentRecommendation }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white">{agent.agent}</div>
      <div className="mt-2 text-xs text-gray-400">Primary</div>
      <div className="mt-1 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
        {agent.primary || '尚未配置'}
      </div>
      <div className="mt-3 text-xs text-gray-400">Fallbacks</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {agent.fallbacks.map((fallback) => (
          <span key={fallback} className="rounded-full border border-white/10 bg-[#11151E] px-2 py-1 text-xs text-gray-300">
            {fallback}
          </span>
        ))}
      </div>
      <ul className="mt-3 space-y-1 text-xs text-gray-400">
        {agent.notes.map((note) => (
          <li key={note}>- {note}</li>
        ))}
      </ul>
    </div>
  );
}

export default function UpgradeTrackerPage() {
  const [data, setData] = useState<UpgradeDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryKey>('overview');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const response = await fetch(`/data/update-intelligence-latest.json?ts=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as UpgradeDataset;
        if (!active) return;
        setData(payload);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : '讀取失敗');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      if (activeTab !== 'overview' && item.category !== activeTab) return false;
      if (selectedTag && !item.tags.includes(selectedTag)) return false;
      return true;
    });
  }, [activeTab, data, selectedTag]);

  const tags = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'overview') return [];
    return data.categoryTags[activeTab] || [];
  }, [activeTab, data]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center p-8 text-gray-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        正在載入升級情報...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">
          無法載入升級情報：{error || '未知錯誤'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(94,106,210,0.18),transparent_35%),#090B10] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Update Intelligence Center</div>
            <h1 className="mt-2 text-2xl font-semibold text-white">升級追蹤 / 風險 / Agent Fallback</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-400">
              不是只看最新版，而是一起看 OpenClaw 支援、供應鏈風險、功能替換潛力，以及對 Mac mini 的實際幫助。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
            最後更新：{new Date(data.generatedAt).toLocaleString('zh-TW', { hour12: false })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={Activity} label="追蹤總數" value={data.summary.totalTargets} />
        <StatCard icon={ArrowUpCircle} label="建議升級" value={data.summary.recommendationCounts['建議升級'] || 0} />
        <StatCard icon={ShieldAlert} label="安全疑慮" value={data.summary.recommendationCounts['安全疑慮'] || 0} />
        <StatCard icon={RefreshCw} label="外部風險命中" value={data.externalRiskSummary?.matchedTargets || 0} />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSelectedTag(null);
              }}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition ${
                active
                  ? 'border-blue-400/30 bg-blue-400/10 text-blue-300'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white">總覽建議</div>
              <div className="mt-4 space-y-3">
                {data.summary.urgent.map((entry) => (
                  <div key={entry.name} className="rounded-2xl border border-white/10 bg-[#0C0F16] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-white">{entry.name}</div>
                      <Badge label={entry.label} />
                    </div>
                    <div className="mt-2 text-sm text-gray-300">{entry.summary}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white">Mac mini / macOS 重點</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                {data.summary.macFitHighlights.map((highlight) => (
                  <li key={highlight}>- {highlight}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">升級優先順序</div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {(data.summary.topPriority || []).map((entry) => (
                <div key={entry.name} className="rounded-2xl border border-white/10 bg-[#0C0F16] p-4">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-white">{entry.name}</div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300">
                      {entry.tier} / {entry.score}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-300">{entry.summary}</div>
                  {!!entry.nextActions?.length && (
                    <ul className="mt-3 space-y-1 text-xs text-gray-400">
                      {entry.nextActions.map((action) => (
                        <li key={action}>- {action}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">外部風險總覽</div>
            <div className="mt-3 text-sm text-gray-400">
              目前從 {data.externalRiskSummary?.sourceCount || 0} 個來源聚合；命中 {data.externalRiskSummary?.matchedTargets || 0} 個追蹤目標。
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(data.externalRiskSummary?.topTargets || []).map((entry) => (
                <span key={entry.targetId} className="rounded-full border border-white/10 bg-[#11151E] px-3 py-1 text-xs text-gray-300">
                  {entry.targetId} × {entry.count}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Bot className="h-4 w-4" />
              Agent Fallback 建議
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              {data.modelRecommendations.agents.map((agent) => (
                <AgentFallbackCard key={agent.agent} agent={agent} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">工作向量推薦</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(data.modelRecommendations.vectors).map(([vector, models]) => (
                <div key={vector} className="rounded-2xl border border-white/10 bg-[#0C0F16] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-500">{vector}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {models.map((model) => (
                      <span key={model} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-200">
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag((current) => (current === tag ? null : tag))}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    selectedTag === tag
                      ? 'border-white/30 bg-white/15 text-white'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
