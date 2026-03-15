'use client';

import { useEffect, useState, useCallback } from 'react';
import { Cpu, RefreshCw, Zap, AlertTriangle, CheckCircle2, Loader2, Server } from 'lucide-react';

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

export default function LocalModelsPage() {
  const [models, setModels] = useState<LMModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TestResult | { error: string }>>({});

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

  useEffect(() => { fetchModels(); }, [fetchModels]);

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
