'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Clock3,
  Database,
  Layers3,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react'

type StatusCounts = {
  memory_claims: number
  reference_items: number
  memory_relations: number
  memory_events: number
  memory_feedback: number
  agent_profiles: number
}

type ImportRun = {
  id: string
  importer: string
  source_system: string
  checkpoint_id: string | null
  item_count: number
  status: string
  notes: string | null
  notes_json?: {
    chunkNotes?: string | null
    expectedCounts?: Partial<StatusCounts>
  } | null
  created_at: string
}

type SourceBreakdown = {
  source_system: string
  memory_claims: number
  reference_items: number
  memory_events: number
  total: number
  share: number
}

type SyncSummary = {
  latestImportAgeMinutes: number | null
  lastImportAt: string | null
  stalled: boolean
  successfulImports24h: number
  importedItems24h: number
}

type TopicCluster = {
  tag: string
  slug: string
  title: string
  category: 'domain' | 'project' | 'agent'
  score: number
  claim_count: number
  reference_count: number
  total_items: number
  share: number
  source_counts: Record<string, number>
  top_claims: { id: string; label: string; score: number }[]
  top_references: { id: string; label: string; score: number }[]
}

type StatusResponse = {
  ok: boolean
  backend: string
  counts: StatusCounts
  totalItems: number
  latestImport: ImportRun | null
  latestImports: ImportRun[]
  sourceBreakdown: SourceBreakdown[]
  topicClusters: TopicCluster[]
  syncSummary: SyncSummary
  timestamp: string
}

type SearchItem = {
  kind: string
  uid: string
  title: string | null
  text: string
  source_system: string
  source_ref: string
  layer: string | null
  claim_type: string | null
  status: string | null
  review_status: string | null
  score: number
}

type SearchResponse = {
  ok: boolean
  query: string
  items: SearchItem[]
  timestamp: string
}

const countCards = [
  { key: 'memory_claims', label: '核心記憶', icon: Brain, accent: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { key: 'reference_items', label: '參考資料', icon: Database, accent: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { key: 'memory_relations', label: '關聯線索', icon: Layers3, accent: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { key: 'memory_events', label: '事件紀錄', icon: Clock3, accent: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { key: 'agent_profiles', label: '代理設定', icon: ShieldCheck, accent: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { key: 'memory_feedback', label: '人工修正', icon: Zap, accent: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
] as const

const systemLayers = [
  {
    horizon: '短期',
    title: '對話內記憶',
    summary: '保留單一工作階段裡的細節與上下文，避免長對話把重點沖淡。',
  },
  {
    horizon: '長期共享',
    title: '共用記憶資料庫',
    summary: '集中保存各系統沉澱下來的長期記憶，讓不同代理都能查到同一份事實。',
  },
  {
    horizon: '結構化知識',
    title: '圖譜與知識投影',
    summary: '把共用記憶再投影成 Obsidian、知識圖譜與報表，方便整理與追查。',
  },
  {
    horizon: '核心規則',
    title: '規則摘要',
    summary: '把高價值偏好、決策與操作規範濃縮成可快速讀取的核心摘要。',
  },
]

const sourceDisplayNames: Record<string, string> = {
  codex: 'Codex',
  hermes: 'Hermes',
  openclaw: 'OpenClaw',
  cloud_code: 'Cloud Code',
  'unified-memory': '共用記憶管線',
}

const layerDisplayNames: Record<string, string> = {
  procedural: '操作規則',
  semantic: '事實知識',
  episodic: '事件經過',
}

const kindDisplayNames: Record<string, string> = {
  claim: '記憶',
  reference: '參考',
}

const clusterCategoryLabels: Record<TopicCluster['category'], string> = {
  domain: '主題',
  project: '專案',
  agent: '代理',
}

const importStatusLabels: Record<string, string> = {
  ok: '完成',
  error: '失敗',
  running: '進行中',
}

const numberFormatter = new Intl.NumberFormat('zh-TW')
const percentFormatter = new Intl.NumberFormat('zh-TW', {
  style: 'percent',
  maximumFractionDigits: 1,
})

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatScore(value: number): string {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

function formatMinutes(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  if (value < 60) return `${value} 分鐘前`
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return minutes ? `${hours} 小時 ${minutes} 分鐘前` : `${hours} 小時前`
}

function formatSourceName(value: string | null | undefined): string {
  if (!value) return '未標記來源'
  return sourceDisplayNames[value] ?? value
}

function formatKind(value: string | null | undefined): string {
  if (!value) return '資料'
  return kindDisplayNames[value] ?? value
}

function formatLayer(value: string | null | undefined): string {
  if (!value) return ''
  return layerDisplayNames[value] ?? value
}

function formatImporter(value: string | null | undefined): string {
  if (!value) return '未知匯入程序'
  if (value === 'shared_memory_pipeline') return '共享記憶同步程序'
  return value.replace(/_/g, ' ')
}

function formatImportStatus(value: string | null | undefined): string {
  if (!value) return '未知'
  return importStatusLabels[value] ?? value
}

function formatBackend(value: string | null | undefined): string {
  if (!value) return '讀取中'
  if (value === 'supabase-trgm') return '共享記憶資料庫（supabase-trgm）'
  return value
}

function cleanMemoryText(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\>\s*/gm, '')
    .replace(/^\-\s*/gm, '')
    .replace(/^\*\s*/gm, '')
    .replace(/`{1,3}/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function shortenSourceRef(value: string | null | undefined): string {
  if (!value) return '未提供來源路徑'
  const normalized = value.replaceAll('\\', '/')
  const parts = normalized.split('/').filter(Boolean)
  if (parts.length <= 4) return normalized
  return `…/${parts.slice(-4).join('/')}`
}

function isGenericResultTitle(value: string | null | undefined): boolean {
  if (!value) return true
  const normalized = value.trim().toLowerCase()
  return ['claim', 'reference', 'project', 'preference', 'note', 'memory', 'research'].includes(normalized)
}

function formatResultTitle(item: SearchItem): string {
  if (!isGenericResultTitle(item.title)) {
    return item.title!.trim()
  }
  const cleaned = cleanMemoryText(item.text)
  if (!cleaned) {
    return item.claim_type || item.uid
  }
  return cleaned.slice(0, 56)
}

function formatResultSummary(item: SearchItem): string {
  const cleaned = cleanMemoryText(item.text)
  if (!cleaned) return '沒有可顯示的內容摘要。'
  return cleaned
}

export default function MemorySystemsClient() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [statusError, setStatusError] = useState('')
  const [statusLoading, setStatusLoading] = useState(true)
  const [query, setQuery] = useState('telegram')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null)
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})

  async function loadStatus() {
    setStatusLoading(true)
    setStatusError('')

    try {
      const response = await fetch('/api/hub/memory/status', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || '讀取 shared memory status 失敗')
      }
      setStatus(payload as StatusResponse)
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : '讀取 shared memory status 失敗')
    } finally {
      setStatusLoading(false)
    }
  }

  async function runSearch(nextQuery?: string) {
    const queryText = (nextQuery ?? query).trim()
    if (!queryText) {
      setSearchError('請輸入查詢關鍵字')
      setSearchResult(null)
      return
    }

    setSearchLoading(true)
    setSearchError('')

    try {
      const response = await fetch('/api/hub/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, agent: 'codex', limit: 8 }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'shared memory search 失敗')
      }
      setSearchResult(payload as SearchResponse)
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'shared memory search 失敗')
      setSearchResult(null)
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
    void runSearch('telegram')
    // 初始載入固定做一次 live status + 預設查詢，避免把 query 狀態變動綁進 re-fetch。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const importSummary = status?.latestImport
    ? `${formatImporter(status.latestImport.importer)} · ${formatSourceName(status.latestImport.source_system)} · ${formatTimestamp(status.latestImport.created_at)}`
    : '尚無同步紀錄'

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    await runSearch()
  }

  async function handleClusterSelect(cluster: TopicCluster) {
    setQuery(cluster.title)
    await runSearch(cluster.title)
  }

  function toggleResult(uid: string) {
    setExpandedResults((current) => ({
      ...current,
      [uid]: !current[uid],
    }))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:space-y-8 sm:p-6 sm:pb-10">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-500/10 p-2.5 sm:p-3">
                <Brain className="h-5 w-5 text-cyan-300 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 data-testid="memory-page-title" className="text-xl font-bold text-white sm:text-2xl">
                  共享記憶總覽
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                  這頁會直接顯示共用記憶系統的同步狀態、主題分布與查詢結果，方便你用手機也能快速判斷現在資料是否正常。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span
                data-testid="memory-status-backend"
                className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-medium text-cyan-300"
              >
                資料引擎：{formatBackend(status?.backend)}
              </span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-zinc-300">
                目前總筆數：{status ? numberFormatter.format(status.totalItems) : '—'}
              </span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-zinc-400">
                最近匯入：{importSummary}
              </span>
            </div>
          </div>

          <div className="flex w-full gap-3 sm:w-auto">
            <button
              type="button"
              onClick={() => void loadStatus()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
              更新資料狀態
            </button>
          </div>
        </div>

        {statusError ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{statusError}</span>
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {countCards.map((card) => {
          const Icon = card.icon
          const value = status?.counts?.[card.key] ?? 0
          return (
            <div
              key={card.key}
              className={`rounded-2xl border p-4 sm:p-5 ${card.border} ${card.bg}`}
              data-testid={`memory-count-${card.key}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] tracking-[0.18em] text-zinc-500 sm:text-xs sm:uppercase">{card.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    {statusLoading ? '…' : numberFormatter.format(value)}
                  </div>
                </div>
                <div className="rounded-2xl bg-zinc-950/70 p-2.5 sm:p-3">
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.accent}`} />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">即時查詢</h2>
              <p className="text-sm leading-6 text-zinc-400">直接查共用記憶資料庫，先看現在有哪些內容，再決定下一步。</p>
            </div>
          </div>

          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => void handleSearchSubmit(event)}>
            <label className="sr-only" htmlFor="memory-search-input">
              共享記憶查詢
            </label>
            <input
              id="memory-search-input"
              data-testid="memory-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              inputMode="search"
              enterKeyHint="search"
              placeholder="例如：Telegram、共享記憶、升級情報"
              className="min-w-0 flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400 sm:text-sm"
            />
            <button
              data-testid="memory-search-submit"
              type="submit"
              disabled={searchLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-base font-semibold text-zinc-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/60 sm:text-sm"
            >
              <Search className="h-4 w-4" />
              {searchLoading ? '查詢中' : '開始查詢'}
            </button>
          </form>

          {searchError ? (
            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {searchError}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {searchResult?.items?.length ? (
              searchResult.items.map((item, index) => (
                (() => {
                  const expanded = expandedResults[item.uid] ?? false
                  const summary = formatResultSummary(item)
                  return (
                    <article
                      key={`${item.uid}-${index}`}
                      data-testid="memory-search-result"
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 sm:p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
                          {formatKind(item.kind)}
                        </span>
                        {item.layer ? (
                          <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-zinc-300">
                            {formatLayer(item.layer)}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-zinc-400">
                          {formatSourceName(item.source_system)}
                        </span>
                        <span className="text-zinc-500 sm:ml-auto">相關度 {formatScore(item.score)}</span>
                      </div>
                      <h3 className="mt-3 text-sm font-semibold leading-6 text-white">
                        {formatResultTitle(item)}
                      </h3>
                      <p
                        className={`mt-2 text-sm leading-6 text-zinc-300 ${expanded ? '' : 'overflow-hidden'}`}
                        style={
                          expanded
                            ? undefined
                            : {
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 3,
                              }
                        }
                      >
                        {summary}
                      </p>
                      <div className="mt-3 flex flex-col gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                        <span className="break-all leading-5">{shortenSourceRef(item.source_ref)}</span>
                        <button
                          type="button"
                          onClick={() => toggleResult(item.uid)}
                          className="self-start rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                        >
                          {expanded ? '收合內容' : '展開內容'}
                        </button>
                      </div>
                    </article>
                  )
                })()
              ))
            ) : (
              <div
                data-testid="memory-search-empty"
                className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 px-4 py-10 text-center text-sm text-zinc-500"
              >
                {searchLoading ? '查詢中…' : '目前沒有結果'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">同步狀態</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-400">確認最近是否有新資料進來，避免你看到的是過期快照。</p>
              </div>
              <span
                data-testid="memory-sync-status"
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  status?.syncSummary?.stalled
                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {status?.syncSummary?.stalled ? '資料偏舊' : '同步正常'}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <div className="text-xs tracking-[0.18em] text-zinc-500">最近同步</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatMinutes(status?.syncSummary?.latestImportAgeMinutes)}
                </div>
                <div className="mt-1 text-xs text-zinc-500">{formatTimestamp(status?.syncSummary?.lastImportAt)}</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <div className="text-xs tracking-[0.18em] text-zinc-500">24 小時成功次數</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {status ? numberFormatter.format(status.syncSummary.successfulImports24h) : '—'}
                </div>
                <div className="mt-1 text-xs text-zinc-500">次同步</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <div className="text-xs tracking-[0.18em] text-zinc-500">24 小時新增資料</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {status ? numberFormatter.format(status.syncSummary.importedItems24h) : '—'}
                </div>
                <div className="mt-1 text-xs text-zinc-500">筆新資料</div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white">來源分布</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">看各系統貢獻了多少長期記憶，方便判斷哪一邊資料偏少。</p>
            <div className="mt-4 space-y-3">
              {status?.sourceBreakdown?.length ? (
                status.sourceBreakdown.map((item) => (
                  <div
                    key={item.source_system}
                    data-testid={`memory-source-card-${item.source_system}`}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{formatSourceName(item.source_system)}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {numberFormatter.format(item.total)} 筆資料 · {percentFormatter.format(item.share)}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-400 sm:text-right">
                        <div>記憶 {numberFormatter.format(item.memory_claims)}</div>
                        <div>參考 {numberFormatter.format(item.reference_items)}</div>
                        <div>事件 {numberFormatter.format(item.memory_events)}</div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-cyan-400 transition-[width]"
                        style={{ width: `${Math.max(6, item.share * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 px-4 py-8 text-sm text-zinc-500">
                  尚未看到來源分佈
                </div>
              )}
            </div>
          </section>

          <section
            data-testid="memory-topic-clusters"
            className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-white">主題群集</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              系統會把相近記憶自動聚在一起。點一下卡片，就能直接查這個主題相關的內容。
            </p>
            <div className="mt-4 space-y-3">
              {status?.topicClusters?.length ? (
                status.topicClusters.map((cluster) => (
                  <button
                    key={cluster.tag}
                    type="button"
                    data-testid={`memory-topic-cluster-${cluster.slug}`}
                    onClick={() => void handleClusterSelect(cluster)}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-left transition hover:border-cyan-500/30 hover:bg-zinc-900"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">{cluster.title}</span>
                          <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                            {clusterCategoryLabels[cluster.category]}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          權重 {formatScore(cluster.score)} · {numberFormatter.format(cluster.total_items)} 筆 ·{' '}
                          {percentFormatter.format(cluster.share)}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-400 sm:text-right">
                        <div>記憶 {numberFormatter.format(cluster.claim_count)}</div>
                        <div>參考 {numberFormatter.format(cluster.reference_count)}</div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-violet-400 transition-[width]"
                        style={{ width: `${Math.max(8, cluster.share * 100)}%` }}
                      />
                    </div>
                    <div className="mt-3 text-xs text-zinc-500">
                      {Object.entries(cluster.source_counts)
                        .slice(0, 4)
                        .map(([source, count]) => `${formatSourceName(source)} ${count}`)
                        .join(' · ')}
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 px-4 py-8 text-sm text-zinc-500">
                  尚未看到主題群集
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white">最近匯入</h2>
            <div className="mt-4 space-y-3">
              {status?.latestImports?.length ? (
                status.latestImports.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{formatImporter(item.importer)}</div>
                        <div className="text-xs text-zinc-500">{formatSourceName(item.source_system)}</div>
                      </div>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                        {formatImportStatus(item.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                      <span>{numberFormatter.format(item.item_count)} 筆資料</span>
                      <span>{formatTimestamp(item.created_at)}</span>
                    </div>
                    {item.notes_json?.chunkNotes ? (
                      <div className="mt-2 text-xs text-zinc-500">{item.notes_json.chunkNotes}</div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 px-4 py-8 text-sm text-zinc-500">
                  尚未看到 import 紀錄
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white">記憶流向</h2>
            <div className="mt-4 space-y-3">
              {systemLayers.map((layer, index) => (
                <div key={layer.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <div className="flex items-center gap-2 text-xs tracking-[0.2em] text-zinc-500">
                    <span>{layer.horizon}</span>
                    {index < systemLayers.length - 1 ? <ArrowRight className="h-3 w-3" /> : null}
                  </div>
                  <div className="mt-2 text-sm font-medium text-white">{layer.title}</div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{layer.summary}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
