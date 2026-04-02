'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface Report {
  id: number;
  title: string;
  author: string;
  report_type: string;
  created_at: string;
}

const TYPE_COLOR: Record<string, string> = {
  '分析報告': '#5E6AD2', '研究報告': '#60a5fa', '技術文檔': '#4ade80',
  '決策建議': '#f59e0b', '審查報告': '#a78bfa', '操作手冊': '#8A8F98',
};

const CORE_SOP_IDS = new Set([1410, 1411]);

function isSopReport(report: Report) {
  if (CORE_SOP_IDS.has(report.id)) return true;
  const title = report.title.toLowerCase();
  return (
    report.report_type === '技術文檔' ||
    report.report_type === '操作手冊' ||
    title.includes('sop') ||
    title.includes('sagi') ||
    title.includes('系統邏輯')
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [total, setTotal] = useState(0);

  const PAGE_SIZE = 100;

  useEffect(() => {
    fetch(`/api/hub/reports?limit=${PAGE_SIZE}&offset=0`)
      .then(r => r.json())
      .then(d => {
        setReports(d.reports || d.data || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') || '');
    setTab(params.get('tab') || 'all');
  }, []);

  const reportTypes = useMemo(() => {
    return Array.from(new Set(reports.map((report) => report.report_type).filter(Boolean)));
  }, [reports]);

  const tabs = useMemo(() => {
    return [
      { key: 'all', label: '全部' },
      { key: 'sop', label: 'SOP知識庫 (SAGI)' },
      ...reportTypes.map((type) => ({ key: type, label: type })),
    ];
  }, [reportTypes]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesTab = tab === 'all'
        ? true
        : tab === 'sop'
          ? isSopReport(report)
          : report.report_type === tab;

      if (!matchesTab) return false;

      if (!normalizedQuery) return true;

      const haystack = `${report.title} ${report.author} ${report.report_type}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, reports, tab]);

  const updateParams = (next: { tab?: string; q?: string }) => {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    let nextTab = tab;
    let nextQuery = query;

    if (next.tab !== undefined) {
      nextTab = next.tab || 'all';
      setTab(nextTab);
      if (!nextTab || nextTab === 'all') params.delete('tab');
      else params.set('tab', nextTab);
    }

    if (next.q !== undefined) {
      nextQuery = next.q;
      setQuery(nextQuery);
      if (!nextQuery.trim()) params.delete('q');
      else params.set('q', nextQuery.trim());
    }

    const qs = params.toString();
    router.replace(qs ? `/hub/reports?${qs}` : '/hub/reports');
  };

  const currentReturnTo = (() => {
    const params = new URLSearchParams();
    if (tab && tab !== 'all') params.set('tab', tab);
    if (query.trim()) params.set('q', query.trim());
    const qs = params.toString();
    return qs ? `/hub/reports?${qs}` : '/hub/reports';
  })();

  const canLoadMore = reports.length < total;

  const loadMoreReports = async () => {
    if (loadingMore || !canLoadMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/hub/reports?limit=${PAGE_SIZE}&offset=${reports.length}`);
      const data = await response.json();
      const nextReports: Report[] = data.reports || data.data || [];

      setReports((current) => {
        const seen = new Set(current.map((report) => report.id));
        const merged = [...current];
        for (const report of nextReports) {
          if (!seen.has(report.id)) merged.push(report);
        }
        return merged;
      });
      setTotal(data.total || total);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div style={{ color: '#EDEDEF' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>報告庫</h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>Agent 分析、SOP 文件與研究報告</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tabs.map((item) => {
            const active = item.key === tab;
            return (
              <button
                key={item.key}
                onClick={() => updateParams({ tab: item.key })}
                style={{
                  border: '1px solid',
                  borderColor: active ? 'rgba(94,106,210,0.45)' : 'rgba(255,255,255,0.08)',
                  background: active ? 'rgba(94,106,210,0.18)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#EDEDEF' : '#8A8F98',
                  borderRadius: '999px',
                  padding: '0.45rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <input
          value={query}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            updateParams({ q: nextValue });
          }}
          placeholder="搜尋標題、作者、報告類型"
          style={{
            width: '100%',
            maxWidth: '420px',
            background: 'rgba(255,255,255,0.04)',
            color: '#EDEDEF',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '0.75rem 0.9rem',
            outline: 'none',
          }}
          />
        <div style={{ fontSize: '0.78rem', color: '#8A8F98' }}>
          目前顯示 {filteredReports.length} / 已載入 {reports.length} / 全部 {total || reports.length} 筆
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#8A8F98', textAlign: 'center', padding: '4rem 0' }}>載入中…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredReports.map(r => {
            const accent = TYPE_COLOR[r.report_type] || '#8A8F98';
            return (
              <Link
                key={r.id}
                href={`/hub/reports/${r.id}?returnTo=${encodeURIComponent(currentReturnTo)}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  transition: 'border-color 150ms',
                }}>
                  <div style={{ width: '3px', height: '40px', borderRadius: '2px', background: accent, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#EDEDEF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      {isSopReport(r) && (
                        <span style={{
                          fontSize: '0.65rem',
                          color: '#111827',
                          background: '#FDE68A',
                          borderRadius: '999px',
                          padding: '0.1rem 0.4rem',
                          fontWeight: 700,
                        }}>
                          SOP
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#8A8F98' }}>
                      <span style={{ color: accent }}>{r.report_type}</span>
                      {' · '}{r.author}
                      {' · '}{new Date(r.created_at).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#8A8F98' }}>#{r.id}</span>
                </div>
              </Link>
            );
          })}
          {filteredReports.length === 0 && (
            <div style={{ color: '#8A8F98', textAlign: 'center', padding: '4rem 0' }}>目前沒有符合條件的報告</div>
          )}
          {canLoadMore && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.75rem' }}>
              <button
                onClick={loadMoreReports}
                disabled={loadingMore}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: loadingMore ? 'rgba(255,255,255,0.04)' : 'rgba(94,106,210,0.18)',
                  color: '#EDEDEF',
                  borderRadius: '12px',
                  padding: '0.8rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: loadingMore ? 'default' : 'pointer',
                  opacity: loadingMore ? 0.7 : 1,
                }}
              >
                {loadingMore ? '載入中…' : `載入更早的報告 (${Math.min(PAGE_SIZE, total - reports.length)} 筆)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
