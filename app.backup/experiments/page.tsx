"use client";

import { useState, useEffect } from 'react';

interface Experiment {
  id: string;
  target: string;
  time: string;
  score: string;
  result: string;
  date: string;
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selected, setSelected] = useState<Experiment | null>(null);
  const [report, setReport] = useState<string>('');

  useEffect(() => {
    // 讀取實驗數據
    fetch('/api/experiments')
      .then(res => res.json())
      .then(data => setExperiments(data));
  }, []);

  const loadReport = (exp: Experiment) => {
    setSelected(exp);
    fetch(`/api/experiments/${exp.id}`)
      .then(res => res.text())
      .then(text => setReport(text));
  };

  const stats = {
    total: experiments.length,
    improved: experiments.filter(e => e.result === '改善').length,
    failed: experiments.filter(e => e.result === '失敗').length,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
            <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
            <path d="M9 19V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>
          </svg>
          AutoX Experiment Center
        </h1>
        <span className="text-gray-400">Last updated: {new Date().toLocaleString()}</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6">
          <div className="flex items-center gap-2 text-indigo-200 mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            Total
          </div>
          <div className="text-4xl font-bold">{stats.total}</div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-6">
          <div className="flex items-center gap-2 text-emerald-200 mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 6l-9.5 9.5-5-5L1 18"/>
              <path d="M17 6h6v6"/>
            </svg>
            Improved
          </div>
          <div className="text-4xl font-bold">{stats.improved}</div>
        </div>
        
        <div className="bg-gradient-to-br from-rose-600 to-orange-600 rounded-xl p-6">
          <div className="flex items-center gap-2 text-rose-200 mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
            Failed
          </div>
          <div className="text-4xl font-bold">{stats.failed}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Experiment List */}
        <div className="col-span-1 bg-gray-900 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            Experiment History
          </h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {experiments.map(exp => (
              <button
                key={exp.id}
                onClick={() => loadReport(exp)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selected?.id === exp.id 
                    ? 'bg-indigo-600 border border-indigo-400' 
                    : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium truncate">{exp.target}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    exp.result === '改善' ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                  }`}>
                    {exp.result}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {exp.date} | Score: {exp.score}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Detail */}
        <div className="col-span-2 bg-gray-900 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
            </svg>
            Experiment Report
          </h2>
          {selected ? (
            <pre className="bg-gray-950 p-4 rounded-lg text-sm text-gray-300 overflow-auto max-h-[500px]">
              {report || 'Loading...'}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 opacity-50">
                  <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
                  <path d="M9 19V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>
                </svg>
                <p>Select an experiment to view report</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
