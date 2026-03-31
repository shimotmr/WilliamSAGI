'use client';

import { useEffect, useState } from 'react';
import ModelBenchmarkTable from '@/components/ModelBenchmarkTable';

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

export default function BenchmarkPage() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const candidates = [
          '/data/model-benchmark-2026-03-29.json',
          '/data/model-benchmark-2026-03-17.json',
          '/data/model-benchmark-mock.json',
        ];

        let response: Response | null = null;
        for (const path of candidates) {
          const current = await fetch(path);
          if (current.ok) {
            response = current;
            break;
          }
        }

        if (!response) {
          throw new Error('無法載入 benchmark 數據');
        }
        
        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        console.error('載入數據失敗:', err);
        setError(err instanceof Error ? err.message : '載入失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-4"></div>
          <p className="text-gray-300 text-lg">載入 Benchmark 數據中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center bg-red-900/30 border border-red-500 rounded-lg p-8 max-w-md">
          <h2 className="text-red-400 text-xl font-bold mb-2">載入失敗</h2>
          <p className="text-gray-300">{error || '無法載入數據'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI 模型 Benchmark 比較
          </h1>
          <p className="text-gray-400 text-lg">
            測試日期: {new Date(data.testDate).toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Benchmark Table */}
        <ModelBenchmarkTable data={data} />

        {/* Footer Notes */}
        <div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-3">評分說明</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="inline-block w-4 h-4 bg-red-400 rounded mr-2"></span>
              <span className="text-gray-300">0-3 分：需改進</span>
            </div>
            <div>
              <span className="inline-block w-4 h-4 bg-yellow-400 rounded mr-2"></span>
              <span className="text-gray-300">4-6 分：中等表現</span>
            </div>
            <div>
              <span className="inline-block w-4 h-4 bg-green-400 rounded mr-2"></span>
              <span className="text-gray-300">7-10 分：優秀</span>
            </div>
          </div>
          <p className="text-gray-400 mt-4 text-xs">
            * 延遲超過 10000ms 顯示為 &quot;10s+&quot;
            <br />
            * 點擊測試名稱可展開查看完整回應
            <br />
            * 可按總分或單項分數排序，支援篩選不同提供商
          </p>
        </div>
      </div>
    </div>
  );
}
