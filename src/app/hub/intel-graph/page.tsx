'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Network, Plus, X } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  description: string;
  created_at: string;
  intel_nodes: { count: number }[];
}

export default function IntelGraphPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/hub/intel-graph/topics')
      .then(r => r.json())
      .then(d => { setTopics(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (!name.trim()) return;
    const res = await fetch('/api/hub/intel-graph/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc }),
    });
    if (res.ok) {
      setName(''); setDesc(''); setShowModal(false); load();
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Network className="w-7 h-7 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">情報關係圖</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> 建立新主題
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-20">載入中...</div>
      ) : topics.length === 0 ? (
        <div className="text-center py-20">
          <Network className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">尚無主題，建立第一個情報關係圖</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(t => (
            <Link
              key={t.id}
              href={`/hub/intel-graph/${t.id}`}
              className="block p-5 bg-slate-800/60 border border-slate-700 rounded-xl hover:border-indigo-500/50 hover:bg-slate-800 transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition">{t.name}</h3>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                  {t.intel_nodes?.[0]?.count || 0} 節點
                </span>
              </div>
              {t.description && <p className="text-sm text-slate-400 mb-3 line-clamp-2">{t.description}</p>}
              <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString('zh-TW')}</p>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">建立新主題</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="主題名稱" autoFocus
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white mb-3 focus:border-indigo-500 focus:outline-none"
            />
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="描述（選填）" rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white mb-4 focus:border-indigo-500 focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition">取消</button>
              <button onClick={create} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition">建立</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
