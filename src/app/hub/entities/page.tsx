'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const TYPES = ['Person', 'Project', 'Task', 'Event', 'Organization', 'Document'];

interface Entity {
  id: string;
  type: string;
  name?: string;
  description?: string;
  properties?: Record<string, any>;
  relations?: string[];
}

export default function Entities() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchEntities = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType) params.append('type', filterType);
    params.append('limit', '100'); // Fetch more for client-side search/paginate
    const url = `/api/ontology?${params.toString()}`;
    const res = await fetch(url);
    const data = await res.json();
    let ents: Entity[] = [];
    if (Array.isArray(data)) {
      ents = data;
    } else if (data.entities && Array.isArray(data.entities)) {
      ents = data.entities;
    }
    // Client-side search
    if (search.trim()) {
      ents = ents.filter(e => 
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase())
      );
    }
    setEntities(ents);
  }, [search, filterType]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const paginatedEntities = entities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="h-dvh bg-[#0a0a0b] text-white p-6 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">實體總覽</h1>
        <p className="text-zinc-500">所有知識實體列表</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="搜尋實體..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/5 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${!filterType ? 'bg-indigo-500/20 border border-indigo-500 text-indigo-300' : 'bg-zinc-900/50 border border-white/5 hover:bg-zinc-900 text-zinc-400'}`}
          >
            全部
          </button>
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${filterType === t ? 'bg-indigo-500/20 border border-indigo-500 text-indigo-300' : 'bg-zinc-900/50 border border-white/5 hover:bg-zinc-900 text-zinc-400'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedEntities.map((entity) => (
          <div key={entity.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-white/20 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg">{entity.name || entity.id}</h3>
              <button
                onClick={() => toggleExpand(entity.id)}
                className="p-1 hover:bg-zinc-800 rounded transition-colors"
              >
                <ChevronDown className={`w-5 h-5 transition-transform ${expanded.has(entity.id) ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="text-zinc-400 mb-3 text-sm">
              <span className="font-semibold text-indigo-400">{entity.type}</span>
            </div>
            <p className="text-zinc-300 mb-4 line-clamp-3">{entity.description}</p>
            {expanded.has(entity.id) && (
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div>
                  <h4 className="font-semibold mb-1">屬性</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(entity.properties || {}).map(([k, v]) => (
                      <div key={k} className="bg-zinc-800/50 p-2 rounded">
                        <span className="text-zinc-400">{k}:</span> {String(v)}
                      </div>
                    ))}
                  </div>
                </div>
                {entity.relations && entity.relations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1">關聯實體</h4>
                    <ul className="space-y-1">
                      {entity.relations.slice(0, 10).map((rel, i) => (
                        <li key={i} className="text-blue-400 hover:text-blue-300 text-xs cursor-pointer">
                          → {rel}
                        </li>
                      ))}
                      {entity.relations.length > 10 && <span className="text-zinc-500 text-xs">... 更多</span>}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {entities.length > PAGE_SIZE && (
        <div className="flex justify-center mt-8 gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-zinc-900/50 border border-white/5 rounded-lg disabled:opacity-50 hover:bg-zinc-900 transition-colors"
          >
            上一頁
          </button>
          <span className="px-4 py-2 text-zinc-400">{page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * PAGE_SIZE >= entities.length}
            className="px-4 py-2 bg-zinc-900/50 border border-white/5 rounded-lg disabled:opacity-50 hover:bg-zinc-900 transition-colors"
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}