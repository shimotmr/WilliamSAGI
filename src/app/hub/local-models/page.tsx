'use client';

import { useEffect, useState, useCallback } from 'react';
import { Cpu, RefreshCw, Zap, AlertTriangle, CheckCircle2, Loader2, Server, Globe, Wrench, Sparkles, Search } from 'lucide-react';

interface LMModel {
  id: string;
  object?: string;
  owned_by?: string;
}

interface TestResult {
  ms: number;
  reply: string;
  tokens?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

interface BridgeResponse {
  completion?: { content?: string };
  query?: string;
  model?: string;
  research_bundle?: {
    results?: Array<{ title?: string; url?: string }>;
    mountedSkills?: Array<{ name: string }>;
    autoSkillExecution?: { skill?: { name?: string } };
    autoSkillExecutions?: Array<{ skill?: { name?: string } }>;
    searchError?: string;
    internalKnowledge?: {
      success?: boolean;
      error?: string;
      results?: Array<{ title?: string; file?: string; snippet?: string }>;
    };
  };
  error?: string;
}

export default function LocalModelsPage() {
  const [models, setModels] = useState<LMModel[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TestResult | { error: string }>>({});
  const [bridgeForm, setBridgeForm] = useState({
    model: '',
    query: '請檢查 OpenClaw gateway health，並補一個 web search 重點。',
    provider: 'auto',
    maxResults: 2,
    fetchPages: 1,
    autoSkillRoute: true,
    autoSkillRouteMulti: true,
    strictSites: false,
    includeInternal: true,
    internalAgent: 'researcher',
    internalLimit: 4,
    skills: ['openclaw-ops'],
    sites: [] as string[],
    topics: [] as string[],
  });
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [bridgeResult, setBridgeResult] = useState<BridgeResponse | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/local-models');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '無法取得模型清單');
        setModels([]);
      } else {
        setModels(data.data ?? []);
      }
    } catch {
      setError('無法連線到伺服器');
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch('/api/local-models/skills');
      const data = await res.json();
      if (res.ok) {
        setSkills(data.skills ?? []);
      }
    } catch {
      setSkills([]);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    fetchSkills();
  }, [fetchModels, fetchSkills]);

  useEffect(() => {
    if (!bridgeForm.model && models.length > 0) {
      setBridgeForm(prev => ({ ...prev, model: models[0].id }));
    }
  }, [bridgeForm.model, models]);

  const testModel = async (modelId: string) => {
    setTesting(prev => ({ ...prev, [modelId]: true }));
    try {
      const res = await fetch('/api/local-models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResults(prev => ({ ...prev, [modelId]: { error: data.error || '測試失敗' } }));
      } else {
        setResults(prev => ({ ...prev, [modelId]: data }));
      }
    } catch {
      setResults(prev => ({ ...prev, [modelId]: { error: '請求失敗' } }));
    } finally {
      setTesting(prev => ({ ...prev, [modelId]: false }));
    }
  };

  const toggleSkill = (skill: string) => {
    setBridgeForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter(item => item !== skill) : [...prev.skills, skill],
    }));
  };

  const toggleListValue = (field: 'sites' | 'topics', value: string) => {
    setBridgeForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const runBridge = async () => {
    setBridgeLoading(true);
    setBridgeError(null);
    setBridgeResult(null);
    try {
      const res = await fetch('/api/local-models/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bridgeForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setBridgeError(data.error || 'bridge 執行失敗');
      } else {
        setBridgeResult(data);
      }
    } catch {
      setBridgeError('bridge 請求失敗');
    } finally {
      setBridgeLoading(false);
    }
  };

  const estimateSize = (id: string): string => {
    const match = id.match(/(\d+)[bB]/);
    if (match) return `~${match[1]}B params`;
    if (id.includes('mini')) return '~3-4B';
    if (id.includes('small')) return '~7-8B';
    return '—';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 rounded-xl">
            <Server className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">本地模型</h1>
            <p className="text-sm text-zinc-400">LM Studio · localhost:8080</p>
          </div>
        </div>
        <button
          onClick={fetchModels}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新整理
        </button>
      </div>

      {/* Status Banner */}
      {error ? (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-red-300 font-medium">服務未啟動</p>
            <p className="text-red-400/70 text-sm">{error}</p>
          </div>
        </div>
      ) : !loading && models.length > 0 ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-emerald-300">
            LM Studio 運行中 · <span className="font-mono">{models.length}</span> 個模型已載入
          </p>
        </div>
      ) : null}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          連線中...
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg">
              <Globe className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">離線模型 Web + Skill Bridge</h2>
              <p className="text-sm text-zinc-400">本地模型可混合使用搜尋結果與本地 skills</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-zinc-300">模型</span>
              <select
                value={bridgeForm.model}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, model: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              >
                <option value="">請選擇模型</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>{model.id}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-zinc-300">搜尋來源</span>
              <select
                value={bridgeForm.provider}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, provider: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              >
                {['auto', 'duckduckgo', 'brave', 'tavily'].map((provider) => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-sm text-zinc-300">查詢</span>
            <textarea
              value={bridgeForm.query}
              onChange={(e) => setBridgeForm(prev => ({ ...prev, query: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-zinc-300">最大結果數</span>
              <input
                type="number"
                min={0}
                max={8}
                value={bridgeForm.maxResults}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, maxResults: Number(e.target.value) }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-zinc-300">抓頁數</span>
              <input
                type="number"
                min={0}
                max={4}
                value={bridgeForm.fetchPages}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, fetchPages: Number(e.target.value) }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-zinc-300">內部知識 Agent</span>
              <select
                value={bridgeForm.internalAgent}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, internalAgent: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              >
                {['researcher', 'coder', 'writer'].map((agent) => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-zinc-300">內部知識數量</span>
              <input
                type="number"
                min={1}
                max={8}
                value={bridgeForm.internalLimit}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, internalLimit: Number(e.target.value) }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <Wrench className="w-4 h-4 text-violet-400" />
              可掛載 skills
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => {
                const active = bridgeForm.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? 'border-violet-500 bg-violet-500/15 text-violet-200'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Search className="w-4 h-4 text-sky-400" />
                來源限制
              </div>
              <div className="flex flex-wrap gap-2">
                {['github.com', 'reddit.com', 'huggingface.co', 'youtube.com'].map((site) => {
                  const active = bridgeForm.sites.includes(site);
                  return (
                    <button
                      key={site}
                      onClick={() => toggleListValue('sites', site)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? 'border-sky-500 bg-sky-500/15 text-sky-200'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {site}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                主題限制
              </div>
              <div className="flex flex-wrap gap-2">
                {['ai-agent-trends', 'local-models', 'dev-tooling'].map((topic) => {
                  const active = bridgeForm.topics.includes(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => toggleListValue('topics', topic)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? 'border-amber-500 bg-amber-500/15 text-amber-200'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={bridgeForm.autoSkillRoute}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, autoSkillRoute: e.target.checked }))}
              />
              單 skill 自動路由
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={bridgeForm.autoSkillRouteMulti}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, autoSkillRouteMulti: e.target.checked }))}
              />
              多 skill 自動路由
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={bridgeForm.includeInternal}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, includeInternal: e.target.checked }))}
              />
              附帶內部知識
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={bridgeForm.strictSites}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, strictSites: e.target.checked }))}
              />
              嚴格網域過濾
            </label>
          </div>

          <button
            onClick={runBridge}
            disabled={bridgeLoading || !bridgeForm.model || !bridgeForm.query.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
          >
            {bridgeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {bridgeLoading ? '執行中...' : '執行 Bridge'}
          </button>
        </div>

        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Bridge 結果</h2>
              <p className="text-sm text-zinc-400">先看 skill / 搜尋整合是否符合預期</p>
            </div>
          </div>

          {bridgeError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              ❌ {bridgeError}
            </div>
          )}

          {!bridgeError && !bridgeResult && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-500">
              尚未執行。建議先用 `openclaw-ops` 或 `context-anchor` 做 smoke。
            </div>
          )}

          {bridgeResult && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">回答</div>
                <pre className="whitespace-pre-wrap break-words text-sm text-zinc-200">{bridgeResult.completion?.content || '（無內容）'}</pre>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
                  <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">掛載 Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {(bridgeResult.research_bundle?.mountedSkills ?? []).map((skill) => (
                      <span key={skill.name} className="rounded-full bg-violet-500/10 px-2 py-1 text-xs text-violet-200">{skill.name}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
                  <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">自動路由</div>
                  <div className="space-y-1">
                    {bridgeResult.research_bundle?.autoSkillExecution?.skill?.name && <div>單一路由：{bridgeResult.research_bundle.autoSkillExecution.skill.name}</div>}
                    {(bridgeResult.research_bundle?.autoSkillExecutions ?? []).map((item, index) => (
                      <div key={`${item.skill?.name}-${index}`}>多路由：{item.skill?.name || '未知 skill'}</div>
                    ))}
                    {!bridgeResult.research_bundle?.autoSkillExecution?.skill?.name &&
                      !(bridgeResult.research_bundle?.autoSkillExecutions ?? []).length && (
                        <div className="text-zinc-500">這次沒有命中自動 skill 路由</div>
                      )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
                <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">搜尋來源</div>
                <div className="space-y-2">
                  {(bridgeResult.research_bundle?.results ?? []).slice(0, 5).map((item, index) => (
                    <div key={`${item.url}-${index}`} className="leading-relaxed">
                      <div className="text-zinc-100">{item.title || item.url}</div>
                      <div className="break-all text-xs text-sky-300">{item.url}</div>
                    </div>
                  ))}
                  {bridgeResult.research_bundle?.searchError && (
                    <div className="text-amber-300">搜尋錯誤：{bridgeResult.research_bundle.searchError}</div>
                  )}
                  {!(bridgeResult.research_bundle?.results ?? []).length && !bridgeResult.research_bundle?.searchError && (
                    <div className="text-zinc-500">這次沒有搜尋結果。</div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
                <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">內部知識</div>
                <div className="space-y-2">
                  {(bridgeResult.research_bundle?.internalKnowledge?.results ?? []).slice(0, 5).map((item, index) => (
                    <div key={`${item.file || item.title || 'internal'}-${index}`} className="leading-relaxed">
                      <div className="text-zinc-100">{item.file || item.title || '內部知識條目'}</div>
                      {item.snippet && <div className="text-xs text-zinc-400">{item.snippet}</div>}
                    </div>
                  ))}
                  {bridgeResult.research_bundle?.internalKnowledge?.error && (
                    <div className="text-amber-300">內部知識錯誤：{bridgeResult.research_bundle.internalKnowledge.error}</div>
                  )}
                  {!(bridgeResult.research_bundle?.internalKnowledge?.results ?? []).length &&
                    !bridgeResult.research_bundle?.internalKnowledge?.error && (
                      <div className="text-zinc-500">這次沒有命中內部知識結果。</div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Cards */}
      {!loading && models.length > 0 && (
        <div className="grid gap-4">
          {models.map((m) => {
            const result = results[m.id];
            const isTesting = testing[m.id];
            const hasResult = result && !('error' in result);
            const hasError = result && 'error' in result;

            return (
              <div
                key={m.id}
                className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="w-4 h-4 text-violet-400 shrink-0" />
                      <h3 className="text-white font-semibold truncate">{m.id}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>大小: {estimateSize(m.id)}</span>
                      {m.owned_by && <span>來源: {m.owned_by}</span>}
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        已載入
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => testModel(m.id)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isTesting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    {isTesting ? '測試中...' : '測試推理'}
                  </button>
                </div>

                {/* Test Result */}
                {hasResult && (
                  <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg text-sm">
                    <div className="flex items-center gap-4 text-zinc-300">
                      <span>⚡ <strong className="text-emerald-400">{(result as TestResult).ms}ms</strong></span>
                      {(result as TestResult).tokens?.total_tokens && (
                        <span>🔢 {(result as TestResult).tokens!.total_tokens} tokens</span>
                      )}
                      <span className="text-zinc-500">回應: &quot;{(result as TestResult).reply}&quot;</span>
                    </div>
                  </div>
                )}
                {hasError && (
                  <div className="mt-3 p-3 bg-red-500/10 rounded-lg text-sm text-red-400">
                    ❌ {(result as { error: string }).error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && models.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <Cpu className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>LM Studio 已連線但沒有載入任何模型</p>
          <p className="text-sm mt-1">請在 LM Studio 中載入模型</p>
        </div>
      )}
    </div>
  );
}
