'use client';

import { useState, useRef, useCallback } from 'react';
import { ScanText, Upload, X, Copy, Check, FileText, Loader2, AlertCircle, ChevronRight } from 'lucide-react';

/* ─── Types ─── */
type FileStatus = 'queued' | 'processing' | 'done' | 'error';

interface QueueItem {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  result?: { md_results: string; layout_details: unknown; usage: unknown };
  error?: string;
}

/* ─── Helpers ─── */
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function syntaxHL(json: string): string {
  return json.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-amber-400'; // number
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'text-[#EDEDEF]' : 'text-emerald-400'; // key : string
      } else if (/true|false/.test(match)) {
        cls = 'text-sky-400';
      } else if (/null/.test(match)) {
        cls = 'text-neutral-500';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

const ACCEPT = '.pdf,.png,.jpg,.jpeg';
const MAX_PDF = 50 * 1024 * 1024;
const MAX_IMG = 10 * 1024 * 1024;

/* ─── Component ─── */
export default function OcrPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<'md' | 'json'>('md');
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  const selectedItem = queue.find((q) => q.id === selected);

  /* ─── Queue processor ─── */
  const processQueue = useCallback(async (items: QueueItem[]) => {
    if (processingRef.current) return;
    processingRef.current = true;

    const toProcess = items.filter((i) => i.status === 'queued');
    for (const item of toProcess) {
      // Mark processing
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'processing' as const, progress: 0 } : q))
      );

      // Fake progress
      const iv = setInterval(() => {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id && q.status === 'processing'
              ? { ...q, progress: Math.min(q.progress + Math.random() * 15, 90) }
              : q
          )
        );
      }, 400);

      try {
        const fd = new FormData();
        fd.append('file', item.file);

        const res = await fetch('/api/v4/ocr', { method: 'POST', body: fd });
        clearInterval(iv);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: 'error' as const, progress: 0, error: err.error || 'Failed' } : q
            )
          );
          continue;
        }

        const data = await res.json();
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'done' as const, progress: 100, result: data } : q))
        );
      } catch (e: unknown) {
        clearInterval(iv);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error' as const, progress: 0, error: e instanceof Error ? e.message : 'Network error' }
              : q
          )
        );
      }
    }
    processingRef.current = false;
  }, []);

  /* ─── Add files ─── */
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems: QueueItem[] = [];
      Array.from(files).forEach((f) => {
        const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
        const max = isPdf ? MAX_PDF : MAX_IMG;
        if (f.size > max) return; // silently skip oversized
        newItems.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file: f, status: 'queued', progress: 0 });
      });
      if (!newItems.length) return;
      setQueue((prev) => {
        const next = [...prev, ...newItems];
        setTimeout(() => processQueue(next), 50);
        return next;
      });
    },
    [processQueue]
  );

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
    if (selected === id) setSelected(null);
  };

  const copyResult = async () => {
    if (!selectedItem?.result) return;
    const text = tab === 'md' ? selectedItem.result.md_results : JSON.stringify(selectedItem.result.layout_details, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ─── Drag handlers ─── */
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  /* ─── Status badge ─── */
  const StatusBadge = ({ item }: { item: QueueItem }) => {
    if (item.status === 'queued') return <span className="text-xs text-neutral-500 font-medium">等待中</span>;
    if (item.status === 'processing') return <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />;
    if (item.status === 'done') return <span className="text-xs text-emerald-500 font-medium">完成</span>;
    return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
  };

  return (
    <div className="min-h-screen bg-[#141416] text-[#EDEDEF]" style={{ fontFamily: "'DM Sans', 'Geist', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-neutral-800/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <ScanText className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">OCR 文件解析</h1>
            <p className="text-xs text-neutral-500 mt-0.5">GLM Layout Parsing · 支援 PDF / PNG / JPG</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1" style={{ height: 'calc(100vh - 73px)' }}>
        {/* Left panel: upload + queue */}
        <div className="w-[380px] border-r border-neutral-800/60 flex flex-col shrink-0">
          {/* Upload zone */}
          <div className="p-4">
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`
                relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200
                flex flex-col items-center justify-center py-10 px-4 text-center
                ${dragging
                  ? 'border-amber-500 bg-amber-500/5 scale-[1.01]'
                  : 'border-neutral-700/50 hover:border-neutral-600 bg-neutral-900/30 hover:bg-neutral-900/50'
                }
              `}
            >
              <div className={`p-3 rounded-full mb-3 transition-colors ${dragging ? 'bg-amber-500/15' : 'bg-neutral-800'}`}>
                <Upload className={`w-6 h-6 ${dragging ? 'text-amber-500' : 'text-neutral-400'}`} />
              </div>
              <p className="text-sm font-medium">{dragging ? '放開以上傳檔案' : '拖曳檔案到此處'}</p>
              <p className="text-xs text-neutral-500 mt-1">或點擊選擇 · PDF ≤50MB · 圖片 ≤10MB</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </div>
          </div>

          {/* Queue */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {queue.length === 0 ? (
              <div className="text-center py-12 text-neutral-600 text-sm">尚無檔案</div>
            ) : (
              <div className="space-y-1.5">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => item.status === 'done' && setSelected(item.id)}
                    className={`
                      group relative rounded-lg px-3 py-2.5 transition-all cursor-pointer
                      ${selected === item.id ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-neutral-800/50 border border-transparent'}
                    `}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{item.file.name}</p>
                          <p className="text-xs text-neutral-600">{fmtSize(item.file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge item={item} />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-700 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-neutral-500" />
                        </button>
                        {item.status === 'done' && (
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    {item.status === 'processing' && (
                      <div className="mt-2 h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === 'error' && (
                      <p className="text-xs text-red-400/80 mt-1 truncate">{item.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedItem?.result ? (
            <>
              {/* Tabs + copy */}
              <div className="flex items-center justify-between border-b border-neutral-800/60 px-6 py-3">
                <div className="flex gap-1">
                  {(['md', 'json'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`
                        px-3 py-1.5 text-sm rounded-md transition-all font-medium
                        ${tab === t ? 'bg-amber-500/15 text-amber-400' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'}
                      `}
                    >
                      {t === 'md' ? 'Markdown' : 'JSON'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={copyResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                    bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已複製' : '複製全文'}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {tab === 'md' ? (
                  <div className="prose prose-invert prose-sm max-w-none
                    prose-headings:text-[#EDEDEF] prose-headings:font-semibold
                    prose-p:text-neutral-300 prose-p:leading-relaxed
                    prose-strong:text-[#EDEDEF]
                    prose-code:text-amber-400 prose-code:bg-neutral-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800
                    prose-table:border-collapse
                    prose-th:border prose-th:border-neutral-700 prose-th:px-3 prose-th:py-2 prose-th:bg-neutral-800/50
                    prose-td:border prose-td:border-neutral-800 prose-td:px-3 prose-td:py-2
                  ">
                    {/* Render markdown as pre-formatted for now — no extra lib */}
                    <div className="whitespace-pre-wrap text-sm leading-7 text-neutral-300">
                      {selectedItem.result.md_results}
                    </div>
                  </div>
                ) : (
                  <pre
                    className="text-xs leading-6 bg-neutral-900/50 rounded-xl border border-neutral-800/60 p-5 overflow-x-auto"
                    dangerouslySetInnerHTML={{
                      __html: syntaxHL(JSON.stringify(selectedItem.result.layout_details, null, 2)),
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="p-4 rounded-2xl bg-neutral-800/30 inline-block mb-4">
                  <ScanText className="w-10 h-10 text-neutral-700" />
                </div>
                <p className="text-neutral-600 text-sm">上傳檔案並完成解析後<br />在此預覽結果</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
