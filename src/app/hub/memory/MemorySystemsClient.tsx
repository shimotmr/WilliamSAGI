'use client';

import { useState } from 'react';
import { Brain, Clock, Database, Zap, ChevronRight, Layers, RefreshCw } from 'lucide-react';

const memorySystems = [
  {
    id: 'lossless',
    horizon: '短期',
    horizonColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    tagBg: 'bg-amber-500/15',
    tagText: 'text-amber-300',
    icon: Zap,
    iconColor: 'text-amber-400',
    title: 'lossless-claw-enhanced',
    subtitle: 'Session 內精準記憶',
    description: '超長對話時搶救早期細節，採用 DAG（有向無環圖）壓縮架構 + SQLite 持久化，CJK token 估算修正，召回率 100%。',
    tech: [
      { label: '架構', value: 'DAG 有向無環圖 + SQLite 持久化' },
      { label: '觸發策略', value: '增量葉壓縮 / 閾值壓縮 / 手動強制' },
      { label: 'Summarizer 模型', value: 'anthropic/claude-haiku-4-5' },
      { label: '閾值', value: 'context 75% 自動壓縮' },
      { label: '保護尾', value: '最新 32 則訊息不壓縮' },
      { label: '工具', value: 'lcm_grep / lcm_describe / lcm_expand' },
    ],
    threshold: '對話 > context window 75%',
    cycle: '自動觸發，或手動 lcm compact',
    status: '已安裝 v0.5.2',
    statusColor: 'text-emerald-400',
    statusBg: 'bg-emerald-500/10',
    note: '已修復原版中文 token 估算錯誤 + 摘要丟失 bug',
  },
  {
    id: 'qmd',
    horizon: '中期',
    horizonColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    tagBg: 'bg-blue-500/15',
    tagText: 'text-blue-300',
    icon: Database,
    iconColor: 'text-blue-400',
    title: 'qmd Semantic Memory',
    subtitle: '跨 Session 語義記憶',
    description: '以 Markdown 為主的長期記憶系統，向量化存儲於 Supabase，支援跨 Agent 語義檢索。每日自動蒸餾萃取，memory/daily/ 為基礎。',
    tech: [
      { label: '格式', value: 'Markdown (memory/*.md)' },
      { label: '向量資料庫', value: 'Supabase pg_vector' },
      { label: '索引量', value: '4,496 檔案 · 4,496 chunks · 50.9MB' },
      { label: '更新頻率', value: '每 5 分鐘自動同步' },
      { label: '範圍', value: 'memory/ + sessions/ 雙源' },
      { label: '調用時機', value: '每個 agent turn 自動載入' },
    ],
    threshold: 'Agent turn 每次觸發',
    cycle: '每 5 分鐘更新debounce，每日 02:00 蒸餾萃取',
    status: '正常運作',
    statusColor: 'text-emerald-400',
    statusBg: 'bg-emerald-500/10',
    note: 'context window 外的長期事實 / 偏好 / 模式記憶',
  },
  {
    id: 'notion',
    horizon: '長期',
    horizonColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    tagBg: 'bg-violet-500/15',
    tagText: 'text-violet-300',
    icon: Brain,
    iconColor: 'text-violet-400',
    title: 'Notion 結構化知識庫',
    subtitle: ' Ideas / 參考收藏 / 任務 Notes',
    description: ' Ideas DB 自動評分建卡，參考收藏分類入庫，任務 notes 即時同步。午夜 pipeline 自動評估，≥15 分建任務卡。',
    tech: [
      { label: ' Ideas DB', value: '31564454-fece-81c9-8a39-d415543fd0c5' },
      { label: '參考收藏', value: '同 DB，Status=📚參考' },
      { label: '評估 Pipeline', value: 'notion_idea_pipeline.py' },
      { label: '建卡門檻', value: '評分 ≥15 分自動建任務' },
      { label: 'Research', value: 'idea_research_booster.py（1 Rex 串行）' },
      { label: '整合觸發', value: '訊息含「參考」或「想法」自動入庫' },
    ],
    threshold: '評分 ≥15 分（min 9 F × 2 I）',
    cycle: '午夜 Pipeline 全量評估，工作日隨時增量入庫',
    status: '正常運作',
    statusColor: 'text-emerald-400',
    statusBg: 'bg-emerald-500/10',
    note: 'Ideas / 參考 / 任務 Notes 為不同視角，共享同一 DB',
  },
  {
    id: 'mem-md',
    horizon: '超長期',
    horizonColor: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    tagBg: 'bg-teal-500/15',
    tagText: 'text-teal-300',
    icon: Layers,
    iconColor: 'text-teal-400',
    title: 'MEMORY.md 核心事實',
    subtitle: 'Agent 初始化必讀',
    description: '最重要的系統認知：William 基本資料、站台規則、認證資訊、緊急命令、Agent 行為規範。Session 啟動時第一個讀取。',
    tech: [
      { label: '檔案', value: '~/clawd/MEMORY.md' },
      { label: 'Agent 初始化', value: 'SOUL.md → USER.md → MEMORY.md 依序讀取' },
      { label: '寫入時機', value: '對話中任何決定/偏好/新知立刻存入' },
      { label: '維護', value: 'memory_distiller.py 每日蒸餾去重' },
      { label: '附屬', value: 'memory/daily/YYYY-MM-DD.md 每日流水' },
      { label: '範本', value: 'memory/knowledge/*.md 結構化知識' },
    ],
    threshold: '對話中出現決定 / 偏好 / 新知',
    cycle: '隨寫隨存，每日 02:00 蒸餾萃取',
    status: '正常運作',
    statusColor: 'text-emerald-400',
    statusBg: 'bg-emerald-500/10',
    note: '最重要、最需要正確的記憶層；錯誤代价比 lossless/qmd 更高',
  },
];

const compareItems = [
  { label: 'Scope', rows: ['單一 Session 內', '跨 Session，長期', '跨 Agent，結構化', 'Agent 初始化認知'] },
  { label: 'Threshold', rows: ['> context 75%', '每 turn 觸發', '評分 ≥15', '決定/偏好/新知'] },
  { label: '更新頻率', rows: ['自動（閾值）', '每 5min debounce', '午夜 + 隨增量', '隨寫隨存'] },
  { label: '格式', rows: ['SQLite 原始訊息 + DAG', 'Markdown 向量', 'Notion structured', 'Markdown 關鍵事實'] },
  { label: '召回率', rows: ['100%（DAG）', '語義相似度檢索', '關鍵字/分類', '完整事實'] },
  { label: '依賴', rows: ['lossless-claw-enhanced', 'Supabase pg_vector', 'Notion API', '本地檔案'] },
];

export default function MemorySystemsClient() {
  const [active, setActive] = useState('lossless');
  const activeSystem = memorySystems.find((system) => system.id === active)!;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-violet-500/10 rounded-xl">
          <Brain className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">記憶系統全景</h1>
          <p className="text-sm text-zinc-400">短期 → 中期 → 長期 → 超長期，完整分層架構</p>
        </div>
      </div>

      <div className="flex gap-2">
        {memorySystems.map((system) => {
          const Icon = system.icon;
          return (
            <button
              key={system.id}
              onClick={() => setActive(system.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                active === system.id
                  ? `${system.bgColor} ${system.borderColor} ${system.horizonColor}`
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${active === system.id ? system.iconColor : 'text-zinc-500'}`} />
              <span className={active === system.id ? system.tagText : ''}>{system.horizon}</span>
              <ChevronRight className={`w-3 h-3 ${active === system.id ? system.iconColor : 'text-zinc-600'}`} />
            </button>
          );
        })}
      </div>

      <div className={`border rounded-2xl p-6 ${activeSystem.borderColor} ${activeSystem.bgColor}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${activeSystem.bgColor}`}>
              <activeSystem.icon className={`w-6 h-6 ${activeSystem.iconColor}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{activeSystem.title}</h2>
              <p className="text-sm text-zinc-400">{activeSystem.subtitle}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${activeSystem.statusBg} ${activeSystem.statusColor} border ${activeSystem.borderColor}`}>
            {activeSystem.status}
          </span>
        </div>

        <p className="text-zinc-300 text-sm leading-relaxed mb-6">{activeSystem.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {activeSystem.tech.map((tech) => (
            <div key={tech.label} className="bg-zinc-900/60 rounded-xl px-4 py-3">
              <div className="text-xs text-zinc-500 mb-1">{tech.label}</div>
              <div className="text-sm text-zinc-200 font-mono leading-snug">{tech.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-zinc-900/60 rounded-xl px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <Clock className="w-3 h-3" />
              觸發門檻
            </div>
            <div className="text-sm text-zinc-300">{activeSystem.threshold}</div>
          </div>
          <div className="flex-1 bg-zinc-900/60 rounded-xl px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <RefreshCw className="w-3 h-3" />
              更新週期
            </div>
            <div className="text-sm text-zinc-300">{activeSystem.cycle}</div>
          </div>
        </div>

        {activeSystem.note && (
          <div className="mt-4 px-4 py-3 bg-zinc-900/40 rounded-xl border-l-2 border-zinc-600">
            <div className="text-xs text-zinc-500 mb-1">Note</div>
            <div className="text-sm text-zinc-400">{activeSystem.note}</div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">層級對照</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-zinc-500 font-medium px-4 py-3 bg-zinc-900/60 rounded-tl-xl border-b border-zinc-800 w-28"></th>
                {memorySystems.map((system) => (
                  <th key={system.id} className={`text-left px-4 py-3 bg-zinc-900/60 border-b border-zinc-800 font-medium ${system.horizonColor}`}>
                    <div className="flex items-center gap-2">
                      <system.icon className="w-4 h-4" />
                      <span>{system.horizon}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareItems.map((row, index) => (
                <tr key={row.label} className={index === compareItems.length - 1 ? '' : 'border-b border-zinc-800/50'}>
                  <td className="px-4 py-3 text-zinc-500 font-medium text-xs">{row.label}</td>
                  {row.rows.map((cell) => (
                    <td key={`${row.label}-${cell}`} className="px-4 py-3 text-zinc-300 text-xs">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">記憶流向</h3>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {[
            { label: '對話產生', color: 'text-zinc-500', bg: 'bg-zinc-900', border: 'border-zinc-800' },
            { label: 'lossless DAG\n(短期)', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
            { label: '→ Session 存檔', color: 'text-zinc-500', bg: 'bg-zinc-900', border: 'border-zinc-800' },
            { label: 'qmd 萃取\n(中期)', color: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
            { label: '→ Supabase', color: 'text-zinc-500', bg: 'bg-zinc-900', border: 'border-zinc-800' },
            { label: 'Notion 結構化\n(長期)', color: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
            { label: '→ MEMORY.md\n(超長期)', color: 'text-teal-300', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
          ].map((step, index) => (
            <div key={`${step.label}-${index}`} className="flex items-center gap-2 flex-shrink-0">
              <div className={`px-4 py-2.5 rounded-xl text-xs font-medium text-center whitespace-pre-line border ${step.bg} ${step.border} ${step.color}`}>
                {step.label}
              </div>
              {index < 6 && <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">依賴工具一覽</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'lossless-claw-enhanced', type: 'Plugin', note: 'v0.5.2' },
            { name: 'qmd', type: 'Backend', note: 'memory/*.md' },
            { name: 'Supabase pg_vector', type: 'Vector DB', note: '4,496 chunks' },
            { name: 'Notion API', type: 'Knowledge DB', note: '31564454...' },
            { name: 'memory_distiller.py', type: 'Pipeline', note: '每日 02:00' },
            { name: 'memory_extractor_v2.py', type: 'Pipeline', note: '每日 02:10' },
            { name: 'notion_idea_pipeline.py', type: 'Pipeline', note: '午夜評估' },
            { name: 'SQLite (LCM)', type: 'Storage', note: '~/.openclaw/lcm.db' },
          ].map((tool) => (
            <div key={tool.name} className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
              <div className="text-xs font-mono text-zinc-200 mb-0.5">{tool.name}</div>
              <div className="text-xs text-zinc-500">{tool.type} · {tool.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
