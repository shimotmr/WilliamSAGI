'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

interface Test {
  name: string;
  score: number;
  latencyMs: number;
  response: string;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  totalScore: number;
  tests: Test[];
}

interface BenchmarkData {
  testDate: string;
  models: Model[];
}

type SortField = 'totalScore' | 'provider' | string; // string for test names
type SortDirection = 'asc' | 'desc' | null;

export default function ModelBenchmarkTable({ data }: { data: BenchmarkData }) {
  const [sortField, setSortField] = useState<SortField>('totalScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  // 獲取所有唯一的 provider
  const providers = useMemo(() => {
    const uniqueProviders = Array.from(new Set(data.models.map(m => m.provider)));
    return ['all', ...uniqueProviders.sort()];
  }, [data.models]);

  // 獲取所有測試名稱
  const testNames = useMemo(() => {
    if (data.models.length === 0) return [];
    return data.models[0].tests.map(t => t.name);
  }, [data.models]);

  // 篩選和排序數據
  const filteredAndSortedModels = useMemo(() => {
    let filtered = data.models;

    // 篩選 provider
    if (selectedProvider !== 'all') {
      filtered = filtered.filter(m => m.provider === selectedProvider);
    }

    // 排序
    if (sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: number;
        let bValue: number;

        if (sortField === 'totalScore') {
          aValue = a.totalScore;
          bValue = b.totalScore;
        } else if (sortField === 'provider') {
          return sortDirection === 'asc'
            ? a.provider.localeCompare(b.provider)
            : b.provider.localeCompare(a.provider);
        } else {
          // 按測試分數排序
          const aTest = a.tests.find(t => t.name === sortField);
          const bTest = b.tests.find(t => t.name === sortField);
          aValue = aTest?.score ?? 0;
          bValue = bTest?.score ?? 0;
        }

        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  }, [data.models, selectedProvider, sortField, sortDirection]);

  // 處理排序點擊
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 循環: desc -> asc -> null
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection(null);
        setSortField('totalScore');
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 獲取分數顏色
  const getScoreColor = (score: number): string => {
    if (score >= 7) return 'bg-green-500/80 text-white';
    if (score >= 4) return 'bg-yellow-500/80 text-gray-900';
    return 'bg-red-500/80 text-white';
  };

  // 獲取分數背景色（淡色）
  const getScoreBgColor = (score: number): string => {
    if (score >= 7) return 'bg-green-100/10';
    if (score >= 4) return 'bg-yellow-100/10';
    return 'bg-red-100/10';
  };

  // 格式化延遲
  const formatLatency = (ms: number): string => {
    if (ms > 10000) return '10s+';
    return `${ms}ms`;
  };

  // 切換行展開
  const toggleRowExpand = (modelId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(modelId)) {
      newExpanded.delete(modelId);
    } else {
      newExpanded.add(modelId);
    }
    setExpandedRows(newExpanded);
  };

  // 切換測試詳情展開
  const toggleTestExpand = (key: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedTests(newExpanded);
  };

  // 渲染排序圖示
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field || !sortDirection) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-500" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-400" />
      : <ChevronDown className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="space-y-4">
      {/* 篩選器 */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <label className="text-gray-300 text-sm font-medium mr-3">
          篩選提供商:
        </label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {providers.map(provider => (
            <option key={provider} value={provider}>
              {provider === 'all' ? '全部' : provider}
            </option>
          ))}
        </select>
        <span className="ml-4 text-gray-400 text-sm">
          共 {filteredAndSortedModels.length} 個模型
        </span>
      </div>

      {/* 表格容器 - 可橫向滑動 */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/80 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                  <button
                    onClick={() => handleSort('provider')}
                    className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                  >
                    提供商
                    <SortIcon field="provider" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                  模型
                </th>
                <th className="px-4 py-3 text-center text-gray-300 font-semibold">
                  <button
                    onClick={() => handleSort('totalScore')}
                    className="flex items-center gap-2 hover:text-blue-400 transition-colors mx-auto"
                  >
                    總分
                    <SortIcon field="totalScore" />
                  </button>
                </th>
                {testNames.map(testName => (
                  <th key={testName} className="px-4 py-3 text-center text-gray-300 font-semibold">
                    <button
                      onClick={() => handleSort(testName)}
                      className="flex items-center gap-2 hover:text-blue-400 transition-colors mx-auto whitespace-nowrap"
                    >
                      {testName}
                      <SortIcon field={testName} />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-gray-300 font-semibold">
                  詳情
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedModels.map((model) => (
                <>
                  <tr
                    key={model.id}
                    className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-300 font-medium">
                      {model.provider}
                    </td>
                    <td className="px-4 py-3 text-white font-semibold">
                      {model.name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-bold ${getScoreColor(model.totalScore)}`}>
                        {model.totalScore.toFixed(1)}
                      </span>
                    </td>
                    {testNames.map(testName => {
                      const test = model.tests.find(t => t.name === testName);
                      if (!test) return <td key={testName} className="px-4 py-3 text-center text-gray-500">-</td>;
                      
                      return (
                        <td key={testName} className={`px-4 py-3 text-center ${getScoreBgColor(test.score)}`}>
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-block px-2 py-1 rounded font-semibold ${getScoreColor(test.score)}`}>
                              {test.score.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatLatency(test.latencyMs)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleRowExpand(model.id)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {expandedRows.has(model.id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* 展開的詳細資訊 */}
                  {expandedRows.has(model.id) && (
                    <tr key={`${model.id}-detail`} className="border-t border-gray-700 bg-gray-900/50">
                      <td colSpan={3 + testNames.length + 1} className="px-4 py-4">
                        <div className="space-y-4">
                          <h4 className="text-white font-semibold mb-3">測試詳情</h4>
                          {model.tests.map((test, idx) => {
                            const testKey = `${model.id}-${idx}`;
                            const isExpanded = expandedTests.has(testKey);
                            const displayText = isExpanded 
                              ? test.response 
                              : test.response.slice(0, 200) + (test.response.length > 200 ? '...' : '');

                            return (
                              <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-300 font-medium">{test.name}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getScoreColor(test.score)}`}>
                                      {test.score.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      延遲: {formatLatency(test.latencyMs)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-gray-300 text-sm whitespace-pre-wrap">
                                  {displayText}
                                </div>
                                {test.response.length > 200 && (
                                  <button
                                    onClick={() => toggleTestExpand(testKey)}
                                    className="mt-2 text-blue-400 hover:text-blue-300 text-xs font-medium"
                                  >
                                    {isExpanded ? '收合' : '展開全文'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedModels.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          沒有符合條件的模型數據
        </div>
      )}
    </div>
  );
}
