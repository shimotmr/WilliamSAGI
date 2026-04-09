'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpCircle,
  BadgeCheck,
  Bot,
  CheckSquare,
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
  Square,
  Wrench,
  X,
} from 'lucide-react';

type CategoryKey = 'overview' | 'model' | 'tool' | 'package' | 'skill' | 'extension' | 'frontend' | 'api';
type UpgradeActionMode = 'followup' | 'smoke';

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
  detailSummary?: string;
  releaseHighlights?: string[];
  systemBenefits?: string[];
  evaluationNotes?: string[];
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

type RefreshPayload = {
  ok: boolean;
  error?: string;
  before?: { generatedAt?: string | null; totalTargets?: number };
  after?: { generatedAt?: string | null; totalTargets?: number };
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

type UpgradeTaskState = {
  id: number;
  title: string;
  status: string;
  assignee?: string | null;
  priority?: string | null;
  created_at?: string | null;
};

type UpgradeActionStatesPayload = {
  ok: boolean;
  error?: string;
  states?: Record<string, { followup: UpgradeTaskState | null; smoke: UpgradeTaskState | null }>;
  history?: UpgradeActionHistoryEntry[];
};

type UpgradeActionHistoryEntry = {
  taskId: number;
  itemId: string;
  itemName: string;
  action: UpgradeActionMode;
  title: string;
  status: string;
  assignee?: string | null;
  priority?: string | null;
  createdAt?: string | null;
};

type BatchActionResponse = {
  ok: boolean;
  error?: string;
  action?: UpgradeActionMode;
  createdCount?: number;
  duplicateCount?: number;
  failedCount?: number;
  results?: Array<{
    ok: boolean;
    duplicate?: boolean;
    itemId: string;
    itemName?: string;
    action: UpgradeActionMode;
    taskId?: number;
    title?: string;
    status?: string;
    assignee?: string | null;
    priority?: string | null;
    createdAt?: string | null;
    error?: string;
  }>;
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

function toneClass(tone: ActionState['tone']) {
  if (tone === 'success') return 'text-emerald-300';
  if (tone === 'error') return 'text-red-300';
  return 'text-gray-400';
}

function formatTime(value?: string | null) {
  if (!value) return '未知時間';
  return new Date(value).toLocaleString('zh-TW', { hour12: false });
}

function buildActionMessage(
  payload: {
    duplicate?: boolean;
    taskId?: number;
    title?: string;
    assignee?: string | null;
    priority?: string | null;
  },
  action: UpgradeActionMode
) {
  if (payload.duplicate) {
    return `已存在${action === 'smoke' ? ' Smoke' : ''}任務 #${payload.taskId}：${payload.title}`;
  }
  return `已建立${action === 'smoke' ? ' Smoke' : ''}任務 #${payload.taskId}（${payload.assignee} / ${payload.priority}）`;
}

function actionLabel(action: UpgradeActionMode) {
  return action === 'smoke' ? 'Smoke 卡' : '追蹤卡';
}

function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'blue' | 'emerald';
}) {
  const className =
    tone === 'blue'
      ? 'border-blue-400/30 bg-blue-400/10 text-blue-200'
      : tone === 'emerald'
        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
        : 'border-white/10 bg-white/5 text-gray-300';

  return <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] ${className}`}>{label}</span>;
}

function DetailDrawer({
  item,
  onClose,
}: {
  item: UpgradeItem | null;
  onClose: () => void;
}) {
  if (!item) return null;

  const sections = [
    { title: '更新重點', items: item.releaseHighlights || [] },
    { title: '對我們系統的好處', items: item.systemBenefits || [] },
    { title: '導入評估 / 注意事項', items: item.evaluationNotes || [] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <button type="button" className="flex-1 cursor-default" onClick={onClose} aria-label="關閉詳情面板" />
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#090B10] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Upgrade Detail</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-white">{item.name}</h2>
              <Badge label={item.recommendation.label} />
              <StatusBadge label={item.subcategory} />
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-300">{item.detailSummary || item.summary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-gray-500">版本</div>
            <div className="mt-2 text-sm text-white">
              {(item.currentVersion || '—') + ' → ' + (item.latestVersion || '—')}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-gray-500">OpenClaw 支援</div>
            <div className="mt-2 text-sm text-white">{item.support.level}</div>
            <div className="mt-1 text-xs text-gray-400">{item.support.note}</div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white">{section.title}</div>
              {section.items.length === 0 ? (
                <div className="mt-3 text-sm text-gray-500">這個項目目前還沒有足夠自動摘要，建議搭配官方 release notes 一起看。</div>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  {section.items.map((entry) => (
                    <li key={entry}>- {entry}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">既有建議</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              {item.nextActions?.map((entry) => <li key={entry}>- {entry}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">風險訊號</div>
            {item.risk.negativeSignals.length === 0 ? (
              <div className="mt-3 text-sm text-gray-500">目前沒有額外負面訊號。</div>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                {item.risk.negativeSignals.map((entry) => <li key={entry}>- {entry}</li>)}
              </ul>
            )}
          </div>
        </div>

        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200 transition hover:bg-cyan-400/15"
          >
            查看官方來源 / changelog
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

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

function ItemCard({
  item,
  selected,
  taskState,
  onToggleSelect,
  onActionComplete,
  onOpenDetail,
}: {
  item: UpgradeItem;
  selected: boolean;
  taskState?: { followup: UpgradeTaskState | null; smoke: UpgradeTaskState | null };
  onToggleSelect: (itemId: string) => void;
  onActionComplete: (itemId: string, action: UpgradeActionMode) => Promise<void>;
  onOpenDetail: (item: UpgradeItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [actionState, setActionState] = useState<ActionState>({ loading: false, message: null, tone: null });
  const versionLine = [item.currentVersion || '—', item.latestVersion || '—'].join(' → ');

  async function triggerAction(action: UpgradeActionMode) {
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
      await onActionComplete(item.id, action);
      setActionState({
        loading: false,
        message: buildActionMessage(payload, action),
        tone: payload.duplicate ? 'info' : 'success',
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
            <button
              type="button"
              onClick={() => onToggleSelect(item.id)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white"
              aria-label={selected ? `取消選取 ${item.name}` : `選取 ${item.name}`}
            >
              {selected ? <CheckSquare className="h-4 w-4 text-cyan-300" /> : <Square className="h-4 w-4" />}
            </button>
            <h3 className="text-sm font-semibold text-white">{item.name}</h3>
            <Badge label={item.recommendation.label} />
            <RiskPill risk={item.risk} />
            <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-gray-400">{item.subcategory}</span>
            {taskState?.followup && <StatusBadge label={`已建追蹤卡 #${taskState.followup.id}`} tone="blue" />}
            {taskState?.smoke && <StatusBadge label={`已建 Smoke #${taskState.smoke.id}`} tone="emerald" />}
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
          <div className="flex flex-wrap gap-2">
            {taskState?.followup && (
              <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs text-blue-100">
                追蹤卡 #{taskState.followup.id} / {taskState.followup.status} / {taskState.followup.assignee || '未指派'}
              </div>
            )}
            {taskState?.smoke && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
                Smoke 卡 #{taskState.smoke.id} / {taskState.smoke.status} / {taskState.smoke.assignee || '未指派'}
              </div>
            )}
          </div>

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
                onClick={() => onOpenDetail(item)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 transition hover:bg-white/10"
              >
                查看更新評估
              </button>
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
            {actionState.message && <div className={`mt-2 text-xs ${toneClass(actionState.tone)}`}>{actionState.message}</div>}
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
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [refreshTone, setRefreshTone] = useState<'success' | 'error' | 'info' | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchState, setBatchState] = useState<ActionState>({ loading: false, message: null, tone: null });
  const [taskStates, setTaskStates] = useState<Record<string, { followup: UpgradeTaskState | null; smoke: UpgradeTaskState | null }>>({});
  const [history, setHistory] = useState<UpgradeActionHistoryEntry[]>([]);
  const [detailItem, setDetailItem] = useState<UpgradeItem | null>(null);

  async function loadDataset() {
    const response = await fetch(`/data/update-intelligence-latest.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as UpgradeDataset;
  }

  async function loadActionStates() {
    const response = await fetch(`/api/hub/upgrade-actions?ts=${Date.now()}`, { cache: 'no-store' });
    const payload = (await response.json()) as UpgradeActionStatesPayload;
    if (!response.ok || !payload.ok) {
      console.warn('upgrade action states unavailable:', payload.error || `HTTP ${response.status}`);
      setTaskStates({});
      setHistory([]);
      return;
    }
    setTaskStates(payload.states || {});
    setHistory(payload.history || []);
  }

  async function reloadAll() {
    const [nextData] = await Promise.all([loadDataset(), loadActionStates()]);
    setData(nextData);
    setError(null);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const nextData = await loadDataset();
        if (!active) return;
        setData(nextData);
        setError(null);
        try {
          await loadActionStates();
        } catch (stateError) {
          console.warn('upgrade action state load skipped:', stateError);
        }
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

  async function handleManualRefresh() {
    try {
      setRefreshing(true);
      setRefreshMessage(null);
      setRefreshTone(null);

      const response = await fetch('/api/hub/upgrade-tracker-refresh', {
        method: 'POST',
      });
      const payload = (await response.json()) as RefreshPayload;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `HTTP ${response.status}`);
      }

      await reloadAll();

      const before = payload.before?.generatedAt ? formatTime(payload.before.generatedAt) : '未知';
      const after = payload.after?.generatedAt ? formatTime(payload.after.generatedAt) : '未知';
      const changed = payload.before?.generatedAt !== payload.after?.generatedAt;

      setRefreshTone(changed ? 'success' : 'info');
      setRefreshMessage(changed ? `已更新資料集：${before} → ${after}` : `已重新執行更新，時間仍為 ${after}`);
    } catch (refreshError) {
      setRefreshTone('error');
      setRefreshMessage(refreshError instanceof Error ? refreshError.message : '手動更新失敗');
    } finally {
      setRefreshing(false);
    }
  }

  async function refreshActionsOnly() {
    try {
      await loadActionStates();
    } catch (loadError) {
      setBatchState({
        loading: false,
        message: loadError instanceof Error ? loadError.message : '無法同步任務狀態',
        tone: 'error',
      });
    }
  }

  async function handleSingleActionComplete() {
    await refreshActionsOnly();
  }

  async function handleBatchAction(action: UpgradeActionMode) {
    if (selectedIds.length === 0) {
      setBatchState({ loading: false, message: '請先勾選至少一個項目', tone: 'info' });
      return;
    }

    try {
      setBatchState({ loading: true, message: null, tone: null });
      const response = await fetch('/api/hub/upgrade-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: selectedIds, action }),
      });
      const payload = (await response.json()) as BatchActionResponse;
      if (!response.ok) {
        throw new Error(payload.error || `HTTP ${response.status}`);
      }

      await refreshActionsOnly();
      const created = payload.createdCount || 0;
      const duplicates = payload.duplicateCount || 0;
      const failed = payload.failedCount || 0;
      setBatchState({
        loading: false,
        message: `批次建立${actionLabel(action)}完成：新增 ${created}、已存在 ${duplicates}、失敗 ${failed}`,
        tone: failed > 0 ? 'error' : created > 0 ? 'success' : 'info',
      });
      if (failed === 0) {
        setSelectedIds([]);
      }
    } catch (error) {
      setBatchState({
        loading: false,
        message: error instanceof Error ? error.message : '批次建立失敗',
        tone: 'error',
      });
    }
  }

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

  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id));

  function toggleSelection(itemId: string) {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((value) => value !== itemId) : [...current, itemId]
    );
  }

  function toggleVisibleSelection() {
    const visibleIds = filteredItems.map((item) => item.id);
    if (visibleIds.length === 0) return;
    setSelectedIds((current) => {
      if (visibleIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

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
      <DetailDrawer item={detailItem} onClose={() => setDetailItem(null)} />
      <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(94,106,210,0.18),transparent_35%),#090B10] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Update Intelligence Center</div>
            <h1 className="mt-2 text-2xl font-semibold text-white">升級追蹤 / 風險 / Agent Fallback</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-400">
              不是只看最新版，而是一起看 OpenClaw 支援、供應鏈風險、功能替換潛力，以及對 Mac mini 的實際幫助。
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 lg:items-end">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
              最後更新：{formatTime(data.generatedAt)}
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '更新中...' : '手動更新'}
            </button>
          </div>
        </div>
        {refreshMessage && (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              refreshTone === 'success'
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                : refreshTone === 'error'
                  ? 'border-red-400/20 bg-red-400/10 text-red-200'
                  : 'border-white/10 bg-white/5 text-gray-300'
            }`}
          >
            {refreshMessage}
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={Activity} label="追蹤總數" value={data.summary.totalTargets} />
        <StatCard icon={ArrowUpCircle} label="建議升級" value={data.summary.recommendationCounts['建議升級'] || 0} />
        <StatCard icon={ShieldAlert} label="安全疑慮" value={data.summary.recommendationCounts['安全疑慮'] || 0} />
        <StatCard icon={RefreshCw} label="外部風險命中" value={data.externalRiskSummary?.matchedTargets || 0} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">建卡狀態 / 批次操作</div>
            <div className="mt-1 text-sm text-gray-400">
              已選 {selectedIds.length} 項。手動更新只會刷新 dataset，不會自動替勾選項目建卡。
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleVisibleSelection}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10"
            >
              {allVisibleSelected ? '取消本頁全選' : '全選目前列表'}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10"
            >
              清空勾選
            </button>
            <button
              onClick={() => handleBatchAction('followup')}
              disabled={batchState.loading}
              className="rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-200 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              批次建立追蹤卡
            </button>
            <button
              onClick={() => handleBatchAction('smoke')}
              disabled={batchState.loading}
              className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              批次建立 Smoke 卡
            </button>
          </div>
        </div>
        {batchState.message && <div className={`mt-3 text-sm ${toneClass(batchState.tone)}`}>{batchState.message}</div>}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Activity className="h-4 w-4" />
          最近操作紀錄
        </div>
        {history.length === 0 ? (
          <div className="mt-3 text-sm text-gray-400">目前尚無 upgrade tracker 操作紀錄。</div>
        ) : (
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {history.slice(0, 8).map((entry) => (
              <div key={`${entry.taskId}-${entry.action}`} className="rounded-2xl border border-white/10 bg-[#0C0F16] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium text-white">{entry.itemName}</div>
                  <StatusBadge label={actionLabel(entry.action)} tone={entry.action === 'smoke' ? 'emerald' : 'blue'} />
                  <StatusBadge label={`#${entry.taskId}`} />
                </div>
                <div className="mt-2 text-sm text-gray-300">{entry.title}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {formatTime(entry.createdAt)} / {entry.assignee || '未指派'} / {entry.priority || '無優先級'} / {entry.status}
                </div>
              </div>
            ))}
          </div>
        )}
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
              <ItemCard
                key={item.id}
                item={item}
                selected={selectedIds.includes(item.id)}
                taskState={taskStates[item.id]}
                onToggleSelect={toggleSelection}
                onActionComplete={handleSingleActionComplete}
                onOpenDetail={setDetailItem}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
