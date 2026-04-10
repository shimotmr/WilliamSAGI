'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Search, Maximize2, Minimize2 } from 'lucide-react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphNode {
  id: string;
  label: string;
  group: string;
  community?: number;
  community_label?: string;
  degree?: number;
  x?: number;
  y?: number;
  color?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  confidence?: number;
  relation_type?: string;
}

interface Edge {
  from: string;
  to: string;
}

export default function KnowledgeGraph() {
  const [data, setData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [colorMode, setColorMode] = useState<'group' | 'community'>('group');
  const [minConf, setMinConf] = useState(0);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async (q: string = '') => {
    const url = `/api/knowledge${q ? `?search=${encodeURIComponent(q)}` : ''}`;
    const res = await fetch(url);
    const result = await res.json();
    const filteredEdges = result.edges.filter((e: GraphEdge) => (e.confidence || 0) >= minConf);
    setData({ nodes: result.nodes, edges: filteredEdges });
    setStats({ nodes: result.nodes.length, edges: filteredEdges.length });
  }, [minConf]);

  useEffect(() => {
    fetchData(search);
  }, [search, fetchData]);

  const onNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const relatedNodes = data?.edges.filter(
    (e) => e.from === selectedNode?.id || e.to === selectedNode?.id
  ).map((e) => e.from === selectedNode?.id ? e.to : e.from) ?? [];

  return (
    <div className="h-dvh bg-[#0a0a0b] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/5 p-4 flex items-center gap-4 shrink-0">
        <h1 className="text-xl font-bold">知識圖譜</h1>
        <div className="text-zinc-400 text-sm">
          節點: {stats.nodes} | 邊: {stats.edges} | 置信閾值: {minConf}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setColorMode('group')}
            className={`px-3 py-1 rounded text-xs ${colorMode === 'group' ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            群組顏色
          </button>
          <button
            onClick={() => setColorMode('community')}
            className={`px-3 py-1 rounded text-xs ${colorMode === 'community' ? 'bg-green-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          >
            社群顏色
          </button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-zinc-400">最小置信度:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={minConf}
            onChange={(e) => setMinConf(Number(e.target.value))}
            className="w-24 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-xs text-zinc-400">{minConf}</span>
        </div>
        <div className="flex-1 max-w-md relative">
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
        <div
          ref={containerRef}
          className={`flex-1 ${isFullscreen ? 'w-screen h-screen fixed inset-0 z-50 bg-[#0a0a0b]' : ''}`}
        >
          {data && (
            <ForceGraph2D
              graphData={{
                nodes: data.nodes,
                links: data.edges.map((e) => ({ source: e.from, target: e.to, confidence: e.confidence, relation_type: e.relation_type })),
              }}
              nodeLabel="label"
              nodeAutoColorBy={colorMode === 'group' ? 'group' : undefined}
              nodeVal={(node: any) => ((node as any).degree || 1) * 1.5}
              nodeColor={(node: any) => {
                if (colorMode === 'group') return undefined;
                const hue = (node.community || 0) * 137.5;
                return `hsl(${hue % 360}, 70%, 50%)`;
              }}
              linkColor={(link: any) => {
                const conf = link.confidence || 0;
                const type = link.relation_type;
                if (type === 'EXTRACTED' || conf >= 0.9) return '#22c55e'; // green
                if (type === 'INFERRED' || conf >= 0.5) return '#eab308'; // yellow
                return '#ef4444'; // red
              }}
              linkWidth={(link: any) => (link.confidence || 0.2) * 2}
              linkOpacity={0.6}
              onNodeClick={(node: any) => onNodeClick(node)}
              backgroundColor="#0a0a0b"
              nodeCanvasObjectMode={() => 'replace' as const}
              nodeCanvasObject={(node: any, canvasCtx: CanvasRenderingContext2D, globalScale: number) => {
                const label = node.label || node.id;
                const fontSize = Math.max(10 / globalScale, 4);
                canvasCtx.font = `${fontSize}px Sans-Serif`;
                const textWidth = canvasCtx.measureText(label).width;
                const backgroundRadius = Math.max(textWidth / 2 + 4, 12) / globalScale;
                canvasCtx.save();
                canvasCtx.beginPath();
                canvasCtx.arc(node.x, node.y, backgroundRadius, 0, 2 * Math.PI, false);
                canvasCtx.fillStyle = 'rgba(15, 15, 15, 0.9)';
                canvasCtx.fill();
                canvasCtx.strokeStyle = node.color || '#1e90ff';
                canvasCtx.lineWidth = 1 / globalScale;
                canvasCtx.stroke();
                canvasCtx.textAlign = 'center';
                canvasCtx.textBaseline = 'middle';
                canvasCtx.fillStyle = '#ffffff';
                canvasCtx.fillText(label, node.x, node.y);
                canvasCtx.restore();
              }}
              linkCanvasObjectMode={"after" as const}
              linkCanvasObject={(link: any, canvasCtx: CanvasRenderingContext2D, globalScale: number) => {
                const conf = link.confidence || 0;
                if (conf < 0.5) return;
                canvasCtx.save();
                canvasCtx.translate(link.source.x, link.source.y);
                canvasCtx.rotate(Math.atan2(link.target.y - link.source.y, link.target.x - link.source.x));
                canvasCtx.font = `${8 / globalScale}px Sans-Serif`;
                canvasCtx.textAlign = 'right';
                canvasCtx.textBaseline = 'middle';
                canvasCtx.fillStyle = link.color || '#888';
                canvasCtx.shadowColor = 'rgba(0,0,0,0.5)';
                canvasCtx.shadowBlur = 4 / globalScale;
                canvasCtx.fillText(conf.toFixed(1), -3, 0);
                canvasCtx.restore();
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
                <div>
                  <span className="text-zinc-400 block mb-1">相關節點:</span>
                  <ul className="space-y-1">
                    {relatedNodes.slice(0, 10).map((id, i) => (
                      <li key={i} className="text-blue-400 text-xs">{id}</li>
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
