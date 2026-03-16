'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Plus, FileText, User, Building2, Landmark,
  X, Search, Link2, Trash2, Loader2, ChevronRight,
} from 'lucide-react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

type NodeType = 'person' | 'company' | 'org';
interface GNode { id: string; topic_id: string; type: NodeType; name: string; data: any; created_at: string; }
interface GEdge { id: string; source_id: string; target_id: string; relation_type: string; weight: number; data: any; }

const TYPE_CONFIG: Record<NodeType, { color: string; icon: string; label: string }> = {
  person:  { color: '#818cf8', icon: '👤', label: '個人' },
  company: { color: '#f97316', icon: '🏢', label: '公司' },
  org:     { color: '#a855f7', icon: '🏛', label: '機構' },
};

export default function TopicGraphPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const router = useRouter();
  const graphRef = useRef<any>(null);

  const [nodes, setNodes] = useState<GNode[]>([]);
  const [edges, setEdges] = useState<GEdge[]>([]);
  const [selected, setSelected] = useState<GNode | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showExtract, setShowExtract] = useState(false);
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<NodeType>('person');
  const [extractText, setExtractText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeRelation, setEdgeRelation] = useState('');
  const [researching, setResearching] = useState(false);
  const [researchResults, setResearchResults] = useState<any[]>([]);
  const [noteEdit, setNoteEdit] = useState('');

  const api = `/api/hub/intel-graph/topics/${topicId}`;

  const load = useCallback(() => {
    fetch(`${api}/nodes`).then(r => r.json()).then(d => {
      setNodes(d.nodes || []);
      setEdges(d.edges || []);
    }).catch(() => {});
  }, [api]);

  useEffect(load, [load]);

  const addNode = async () => {
    if (!newName.trim()) return;
    const res = await fetch(`${api}/nodes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, type: newType }),
    });
    if (res.ok) { setNewName(''); setShowAddNode(false); load(); }
  };

  const extractEntities = async () => {
    if (!extractText.trim()) return;
    setExtracting(true);
    try {
      const res = await fetch('/api/hub/intel-graph/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractText }),
      });
      const data = await res.json();
      if (data.entities?.length) {
        await fetch(`${api}/nodes`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.entities.map((e: any) => ({ name: e.name, type: e.type === 'company' ? 'company' : e.type === 'org' ? 'org' : 'person' }))),
        });
        load();
      }
      setExtractText(''); setShowExtract(false);
    } finally { setExtracting(false); }
  };

  const addEdge = async () => {
    if (!selected || !edgeTarget || !edgeRelation.trim()) return;
    await fetch(`${api}/edges`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_id: selected.id, target_id: edgeTarget, relation_type: edgeRelation }),
    });
    setEdgeTarget(''); setEdgeRelation(''); setShowAddEdge(false); load();
  };

  const deleteNode = async (id: string) => {
    await fetch(`${api}/nodes`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSelected(null); load();
  };

  const saveNote = async () => {
    if (!selected) return;
    await fetch(`${api}/nodes`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, data: { ...selected.data, note: noteEdit } }),
    });
    load();
  };

  const doResearch = async (name: string) => {
    setResearching(true); setResearchResults([]);
    try {
      const res = await fetch('/api/hub/intel-graph/research', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: name }),
      });
      const data = await res.json();
      setResearchResults(data.results || []);
    } finally { setResearching(false); }
  };

  // Graph data
  const graphData = {
    nodes: nodes.map(n => ({ id: n.id, name: n.name, type: n.type, val: 3 })),
    links: edges.map(e => ({ source: e.source_id, target: e.target_id, label: e.relation_type })),
  };

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const cfg = TYPE_CONFIG[node.type as NodeType] || TYPE_CONFIG.person;
    const size = 8;
    const fontSize = 12 / globalScale;

    // Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = selected?.id === node.id ? '#facc15' : cfg.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(node.name, node.x, node.y + size + fontSize + 2);
  }, [selected]);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    if (typeof start !== 'object' || typeof end !== 'object') return;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (link.label) {
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;
      const fontSize = 10 / globalScale;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(link.label, mx, my - 4);
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Panel */}
      <div className="w-[300px] flex-shrink-0 bg-slate-900/80 border-r border-slate-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <button onClick={() => router.push('/hub/intel-graph')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-3 transition">
            <ArrowLeft className="w-4 h-4" /> 返回主題列表
          </button>
          <div className="flex gap-2">
            <button onClick={() => setShowAddNode(true)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition">
              <Plus className="w-3.5 h-3.5" /> 新增節點
            </button>
            <button onClick={() => setShowExtract(true)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition">
              <FileText className="w-3.5 h-3.5" /> 貼入文字
            </button>
          </div>
        </div>

        {/* Add Node Form */}
        {showAddNode && (
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="名稱" autoFocus
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-white mb-2 focus:border-indigo-500 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && addNode()}
            />
            <div className="flex gap-1 mb-2">
              {(Object.entries(TYPE_CONFIG) as [NodeType, typeof TYPE_CONFIG.person][]).map(([k, v]) => (
                <button key={k} onClick={() => setNewType(k)}
                  className={`flex-1 text-xs py-1.5 rounded transition ${newType === k ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddNode(false)} className="flex-1 text-sm text-slate-400 hover:text-white py-1">取消</button>
              <button onClick={addNode} className="flex-1 text-sm bg-indigo-600 hover:bg-indigo-500 text-white py-1 rounded transition">新增</button>
            </div>
          </div>
        )}

        {/* Extract Form */}
        {showExtract && (
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <textarea value={extractText} onChange={e => setExtractText(e.target.value)} rows={4} placeholder="貼入新聞/文章，AI 自動提取人名和公司..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white mb-2 focus:border-indigo-500 focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowExtract(false)} className="flex-1 text-sm text-slate-400 hover:text-white py-1">取消</button>
              <button onClick={extractEntities} disabled={extracting}
                className="flex-1 text-sm bg-indigo-600 hover:bg-indigo-500 text-white py-1 rounded transition disabled:opacity-50 flex items-center justify-center gap-1">
                {extracting ? <><Loader2 className="w-3 h-3 animate-spin" /> 提取中...</> : 'AI 提取'}
              </button>
            </div>
          </div>
        )}

        {/* Node List */}
        <div className="flex-1 overflow-y-auto p-2">
          {nodes.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">尚無節點</p>
          ) : (
            nodes.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.person;
              return (
                <button key={n.id} onClick={() => { setSelected(n); setNoteEdit(n.data?.note || ''); setResearchResults([]); }}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-2 transition text-sm ${selected?.id === n.id ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-800'}`}>
                  <span>{cfg.icon}</span>
                  <span className="text-white truncate">{n.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Graph Area */}
      <div className="flex-1 relative bg-slate-950">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          onNodeClick={(node: any) => {
            const n = nodes.find(x => x.id === node.id);
            if (n) { setSelected(n); setNoteEdit(n.data?.note || ''); setResearchResults([]); }
          }}
          backgroundColor="transparent"
          nodeRelSize={6}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.005}
          cooldownTicks={100}
          width={typeof window !== 'undefined' ? window.innerWidth - 300 - (selected ? 380 : 0) : 800}
          height={typeof window !== 'undefined' ? window.innerHeight - 64 : 600}
        />
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-600 text-lg">新增節點開始建立關係圖</p>
          </div>
        )}
      </div>

      {/* Right Drawer */}
      {selected && (
        <div className="w-[380px] flex-shrink-0 bg-slate-900/90 border-l border-slate-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{TYPE_CONFIG[selected.type]?.icon || '👤'}</span>
              <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Type */}
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">類型</label>
              <p className="text-sm text-slate-300 mt-1">{TYPE_CONFIG[selected.type]?.label}</p>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">備註</label>
              <textarea value={noteEdit} onChange={e => setNoteEdit(e.target.value)} rows={3}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
              />
              <button onClick={saveNote} className="mt-1 text-xs text-indigo-400 hover:text-indigo-300">儲存備註</button>
            </div>

            {/* Relations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-500 uppercase tracking-wide">關係</label>
                <button onClick={() => setShowAddEdge(true)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> 新增關係
                </button>
              </div>
              {edges.filter(e => e.source_id === selected.id || e.target_id === selected.id).map(e => {
                const otherId = e.source_id === selected.id ? e.target_id : e.source_id;
                const other = nodes.find(n => n.id === otherId);
                return (
                  <div key={e.id} className="flex items-center gap-2 text-sm text-slate-300 mb-1 px-2 py-1 bg-slate-800/50 rounded">
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                    <span className="text-indigo-300">{e.relation_type}</span>
                    <span className="text-slate-400">→</span>
                    <span>{other?.name || '?'}</span>
                  </div>
                );
              })}

              {showAddEdge && (
                <div className="mt-2 p-3 bg-slate-800 rounded-lg border border-slate-600">
                  <select value={edgeTarget} onChange={e => setEdgeTarget(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-white mb-2 focus:outline-none">
                    <option value="">選擇節點...</option>
                    {nodes.filter(n => n.id !== selected.id).map(n => (
                      <option key={n.id} value={n.id}>{TYPE_CONFIG[n.type]?.icon} {n.name}</option>
                    ))}
                  </select>
                  <input value={edgeRelation} onChange={e => setEdgeRelation(e.target.value)} placeholder="關係（如：持股30%）"
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-white mb-2 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddEdge(false)} className="flex-1 text-xs text-slate-400 py-1">取消</button>
                    <button onClick={addEdge} className="flex-1 text-xs bg-indigo-600 text-white py-1 rounded">新增</button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Research */}
            <div>
              <button onClick={() => doResearch(selected.name)} disabled={researching}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition disabled:opacity-50">
                {researching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {researching ? '搜尋中...' : 'AI 搜索公開資訊'}
              </button>
              {researchResults.length > 0 && (
                <div className="mt-2 space-y-2">
                  {researchResults.map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="block p-2 bg-slate-800/50 rounded border border-slate-700 hover:border-indigo-500/30 transition">
                      <p className="text-sm text-indigo-300 font-medium truncate">{r.title}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <button onClick={() => { if (confirm(`確定刪除「${selected.name}」？`)) deleteNode(selected.id); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded-lg transition border border-red-900/30">
              <Trash2 className="w-4 h-4" /> 刪除節點
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
