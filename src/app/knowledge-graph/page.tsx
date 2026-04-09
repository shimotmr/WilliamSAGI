'use client';

import { useState, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph';
import { Search, Maximize2, Minimize2 } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  group: string;
  degree?: number;
}

interface Edge {
  from: string;
  to: string;
}

export default function KnowledgeGraph() {
  const [data, setData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  const fetchData = useCallback(async (q: string = '') => {
    const url = `/api/knowledge${q ? `?search=${encodeURIComponent(q)}` : ''}`;
    const res = await fetch(url);
    const result = await res.json();
    setData(result);
    setStats({ nodes: result.nodes.length, edges: result.edges.length });
  }, []);

  useEffect(() => {
    fetchData(search);
  }, [search, fetchData]);

  const fgRef = useCallback((fg: any) => {
    if (fg) {
      fg.d3AlphaDecay(0.01);
      fg.d3VelocityDecay(0.6);
    }
  }, []);

  const onNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="h-dvh bg-[#0a0a0b] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/5 p-4 flex items-center gap-4 shrink-0">
        <h1 className="text-xl font-bold">知識圖譜</h1>
        <div className="text-zinc-400 text-sm">
          節點: {stats.nodes} | 邊: {stats.edges}
        </div>
        <div className="flex-1 max-w-md ml-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="搜尋節點..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/5 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-zinc-900/50 rounded-lg transition-colors"
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Graph */}
        <div className={`flex-1 ${isFullscreen ? 'w-screen h-screen fixed inset-0 z-50 bg-[#0a0a0b]' : ''}`}>
          {data && (
            <ForceGraph2D
              ref={fgRef}
              graphData={data}
              nodeLabel="label"
              nodeAutoColorBy="group"
              nodeVal={(node: Node) => (node.degree || 1) + 1}
              onNodeClick={onNodeClick}
              backgroundColor="#0a0a0b"
              nodeCanvasObject={(node: Node, ctx, globalScale) => {
                const label = node.label;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const backgroundRadius = 12 / globalScale;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, backgroundRadius, 0, 2 * Math.PI, false);
                ctx.fillStyle = (node as any).color || '#1e90ff';
                ctx.fill();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'white';
                ctx.fillText(label, node.x!, node.y!, textWidth + 6);
              }}
            />
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l border-white/5 p-6 overflow-y-auto shrink-0 bg-zinc-900/50">
          {selectedNode ? (
            <div>
              <h2 className="text-xl font-bold mb-4">{selectedNode.label}</h2>
              <div className="space-y-2 text-sm">
                <p><span className="text-zinc-400">ID:</span> {selectedNode.id}</p>
                <p><span className="text-zinc-400">Group:</span> {selectedNode.group}</p>
                <p><span className="text-zinc-400">連結數:</span> {selectedNode.degree || 0}</p>
                <p><span className="text-zinc-400">路徑:</span> {selectedNode.id}</p>
                <div>
                  <span className="text-zinc-400 block mb-1">相關節點:</span>
                  {/* Simplified related nodes from edges, but for demo list some */}
                  <ul className="space-y-1">
                    {data?.edges.slice(0, 5).filter(e => e.from === selectedNode.id || e.to === selectedNode.id).map((e, i) => (
                      <li key={i} className="text-blue-400 hover:text-blue-300 cursor-pointer text-xs">
                        {e.from === selectedNode.id ? e.to : e.from}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-center mt-20">
              點擊節點查看詳情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}