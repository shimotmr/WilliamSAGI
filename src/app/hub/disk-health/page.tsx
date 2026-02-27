'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CleanupLog {
  id: number;
  cleanup_date: string;
  trigger_reason: string;
  before_usage_percent: number;
  after_usage_percent: number;
  space_freed_mb: number;
  items_deleted: any[];
  notes: string;
  performed_by: string;
}

interface HealthHistory {
  id: number;
  check_date: string;
  total_gb: number;
  used_gb: number;
  free_gb: number;
  usage_percent: number;
  openclaw_size_mb: number;
  clawd_size_mb: number;
  alert_level: string;
  notes: string;
}

interface Overview {
  latest_health: HealthHistory | null;
  recent_cleanups: CleanupLog[];
  health_trend: HealthHistory[];
}

export default function DiskHealthPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [cleanupLogs, setCleanupLogs] = useState<CleanupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'cleanup' | 'trend'>('overview');

  useEffect(() => {
    fetchOverview();
    fetchCleanupLogs();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/disk-health?type=overview');
      const data = await res.json();
      setOverview(data);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCleanupLogs = async () => {
    try {
      const res = await fetch('/api/disk-health?type=cleanup_log');
      const data = await res.json();
      setCleanupLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch cleanup logs:', error);
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'green': return 'text-green-600 bg-green-50';
      case 'yellow': return 'text-yellow-600 bg-yellow-50';
      case 'orange': return 'text-orange-600 bg-orange-50';
      case 'red': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 95) return 'text-red-600';
    if (percent >= 80) return 'text-orange-600';
    if (percent >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto text-center py-12">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">磁碟健康度監控</h1>
              <p className="text-sm text-gray-600 mt-1">系統空間使用分析與清理記錄</p>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              返回首頁
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* 當前狀態卡片 */}
        {overview?.latest_health && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">當前磁碟狀態</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">使用率</div>
                <div className={`text-2xl font-bold ${getUsageColor(overview.latest_health.usage_percent)}`}>
                  {overview.latest_health.usage_percent}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {overview.latest_health.used_gb}GB / {overview.latest_health.total_gb}GB
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">可用空間</div>
                <div className="text-2xl font-bold text-gray-900">
                  {overview.latest_health.free_gb}GB
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">.openclaw</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(overview.latest_health.openclaw_size_mb / 1024).toFixed(1)}GB
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">clawd</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(overview.latest_health.clawd_size_mb / 1024).toFixed(1)}GB
                </div>
              </div>
            </div>
            <div className="mt-4">
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getAlertColor(overview.latest_health.alert_level)}`}>
                {overview.latest_health.alert_level.toUpperCase()}
              </span>
              <span className="ml-3 text-sm text-gray-600">
                最後檢查：{new Date(overview.latest_health.check_date).toLocaleString('zh-TW')}
              </span>
            </div>
          </div>
        )}

        {/* 分頁切換 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('overview')}
            className={`px-4 py-2 rounded-lg transition ${
              view === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            總覽
          </button>
          <button
            onClick={() => setView('cleanup')}
            className={`px-4 py-2 rounded-lg transition ${
              view === 'cleanup' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            清理記錄
          </button>
          <button
            onClick={() => setView('trend')}
            className={`px-4 py-2 rounded-lg transition ${
              view === 'trend' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            趨勢圖
          </button>
        </div>

        {/* 內容區 */}
        {view === 'overview' && overview && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">最近清理記錄</h2>
            <div className="space-y-4">
              {overview.recent_cleanups.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(log.cleanup_date).toLocaleDateString('zh-TW')}
                    </div>
                    <div className="text-xs text-gray-600">
                      {log.performed_by}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">{log.notes}</div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>清理前：{log.before_usage_percent}%</span>
                    <span>→</span>
                    <span>清理後：{log.after_usage_percent}%</span>
                    <span className="text-green-600 font-medium">
                      釋放 {(log.space_freed_mb / 1024).toFixed(1)}GB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'cleanup' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">完整清理記錄</h2>
            <div className="space-y-4">
              {cleanupLogs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(log.cleanup_date).toLocaleString('zh-TW')}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {log.trigger_reason}
                      </span>
                      <span className="text-xs text-gray-600">{log.performed_by}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mb-3">{log.notes}</div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                    <span>清理前：{log.before_usage_percent}%</span>
                    <span>→</span>
                    <span>清理後：{log.after_usage_percent}%</span>
                    <span className="text-green-600 font-medium">
                      ↓ {(log.space_freed_mb / 1024).toFixed(1)}GB
                    </span>
                  </div>
                  {log.items_deleted && log.items_deleted.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-700">
                        查看刪除項目 ({log.items_deleted.length} 個)
                      </summary>
                      <div className="mt-2 space-y-2">
                        {log.items_deleted.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs p-2 bg-white rounded border">
                            <div className="font-mono text-gray-700">{item.path}</div>
                            <div className="flex items-center gap-3 mt-1 text-gray-600">
                              <span>{item.size}</span>
                              <span>•</span>
                              <span>{item.category}</span>
                              <span>•</span>
                              <span>{item.reason}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'trend' && overview && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">使用率趨勢（最近 7 天）</h2>
            <div className="space-y-2">
              {overview.health_trend.map((record) => (
                <div key={record.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600 w-32">
                    {new Date(record.check_date).toLocaleDateString('zh-TW')}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-4 relative">
                      <div
                        className={`h-4 rounded-full ${
                          record.usage_percent >= 95 ? 'bg-red-500' :
                          record.usage_percent >= 80 ? 'bg-orange-500' :
                          record.usage_percent >= 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${record.usage_percent}%` }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900">
                          {record.usage_percent}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 w-24 text-right">
                    {record.used_gb}GB / {record.total_gb}GB
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
