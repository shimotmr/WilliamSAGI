import fs from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import TagIntelTaskButtons from './TagIntelTaskButtons'

function buildTranslateHref(url?: string) {
  if (!url) return ''
  return `https://translate.google.com/translate?sl=auto&tl=zh-TW&u=${encodeURIComponent(url)}`
}

function isMostlyAscii(value?: string) {
  if (!value) return false
  const sample = value.replace(/\s+/g, '')
  if (!sample) return false
  const ascii = Array.from(sample).filter((char) => char.charCodeAt(0) <= 127).length
  return ascii / sample.length > 0.72
}

function cleanSnippet(value?: string, maxLength = 120) {
  if (!value) return ''
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1)}…`
}

function localizeSourceLabel(value?: string) {
  const source = normalizeQueryValue(value).toLowerCase()
  const mapping: Record<string, string> = {
    github: 'GitHub 開發來源',
    reddit: 'Reddit 社群',
    threads: 'Threads 社群',
    instagram: 'Instagram 帳號',
    weibo: '微博內容',
    'wechat-official': '微信公眾號',
    youtube: 'YouTube 影音',
    huggingface: 'Hugging Face 模型社群',
    dcard: 'Dcard 討論',
    ptt: 'PTT 討論',
    mobile01: 'Mobile01 討論',
  }
  return mapping[source] || value || '外部來源'
}

function buildReadingSummary(entry: Partial<IntelEntry> & { reason?: string }) {
  const sourceLabel = localizeSourceLabel(entry.sourceLabel)
  const topic = entry.groupLabel || entry.tag || entry.trackingGroup || ''
  const domain = entry.linkedDomain || ''
  const title = cleanSnippet(entry.title, 90)
  const snippet = cleanSnippet(entry.snippet || entry.reason, 120)
  const lines = [
    `這筆內容主要來自 ${sourceLabel}${topic ? `，主題偏向「${topic}」` : ''}${domain ? `，並與 ${domain} 相關` : ''}。`,
  ]

  if (title) {
    lines.push(isMostlyAscii(title) ? `先看標題脈絡，再用「翻譯閱讀」快速讀中文。` : `標題已可直接閱讀，適合先快速判斷是否值得追。`)
  }

  if (snippet) {
    lines.push(`摘要線索：${snippet}`)
  }

  return lines.slice(0, 3)
}

function ReadingSummaryCard({
  entry,
  translateHref,
  originalUrl,
}: {
  entry: Partial<IntelEntry> & { reason?: string }
  translateHref?: string
  originalUrl?: string
}) {
  const lines = buildReadingSummary(entry)
  if (!lines.length) return null

  return (
    <div className="mt-3 rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] text-cyan-100">
          中文閱讀摘要
        </span>
        {translateHref ? (
          <a
            href={translateHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/15"
          >
            翻譯閱讀
          </a>
        ) : null}
        {originalUrl ? (
          <a
            href={originalUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-neutral-200 transition hover:bg-white/10"
          >
            原文連結
          </a>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-200">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type IntelEntry = {
  type: string
  sourceId?: string
  sourceLabel?: string
  tag?: string
  groupId?: string
  groupLabel?: string
  label?: string
  query?: string
  trackingGroup?: string
  linkedDomain?: string
  linkedSiteLabel?: string
  title?: string
  url?: string
  snippet?: string
  error?: string
  strategy?: string
  metadata?: {
    published?: string
    author?: string
    strategy?: string
  }
}

type IntelData = {
  generatedAt: string
  priority: string
  provider: string
  counts: {
    tags: number
    sources: number
    entries: number
    errors: number
  }
  entries: IntelEntry[]
  toolingStatus?: {
    agentReach?: {
      ok: boolean
      version?: string | null
      availableChannels?: number | null
      totalChannels?: number | null
      warnings?: string[]
      error?: string
    }
    collectorStrategy?: {
      genericSourcesPrefer?: string
      nativeSourcesKeep?: string[]
    }
  }
  watchRecommendations?: Array<{
    label: string
    source: string
    query: string
    reason: string
    trackingGroup?: string | null
    linkedDomain?: string | null
    linkedSiteLabel?: string | null
  }>
  watchGroupFilter?: string | null
}

async function loadIntelData(): Promise<IntelData | null> {
  const candidates = [
    path.join(process.cwd(), 'public/data/tag-intel-latest.json'),
    '/Users/travis/clawd/data/tag_intel/latest.json',
  ]

  for (const filePath of candidates) {
    try {
      const raw = await fs.readFile(filePath, 'utf8')
      return JSON.parse(raw) as IntelData
    } catch {
      continue
    }
  }
  return null
}

function groupEntries(entries: IntelEntry[]) {
  return entries
    .filter((entry) => entry.type === 'result')
    .reduce<Record<string, IntelEntry[]>>((acc, entry) => {
      const key = entry.groupLabel || '其他'
      acc[key] ||= []
      acc[key].push(entry)
      return acc
    }, {})
}

function normalizeQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() || ''
  }
  return value?.trim() || ''
}

function matchesText(haystack: string | undefined, needle: string) {
  return (haystack || '').toLowerCase().includes(needle.toLowerCase())
}

function parsePossibleTime(value?: string) {
  if (!value) return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

function formatDayKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function buildRecentItems(entries: IntelEntry[], generatedAt: string) {
  const fallbackTime = parsePossibleTime(generatedAt) || Date.now()
  return entries
    .filter((entry) => entry.type === 'result' || entry.type === 'watch-account-result')
    .map((entry) => {
      const publishedTime = parsePossibleTime(entry.metadata?.published)
      return {
        ...entry,
        sortTime: publishedTime || fallbackTime,
      }
    })
    .sort((a, b) => b.sortTime - a.sortTime)
}

function buildRecentErrors(entries: IntelEntry[], generatedAt: string) {
  const fallbackTime = parsePossibleTime(generatedAt) || Date.now()
  return entries
    .filter((entry) => entry.type === 'watch-account-error' || entry.type === 'source-error')
    .map((entry) => ({
      ...entry,
      sortTime: fallbackTime,
    }))
    .sort((a, b) => b.sortTime - a.sortTime)
}

function buildSevenDayTimeline(entries: IntelEntry[], generatedAt: string) {
  const generatedTime = parsePossibleTime(generatedAt) || Date.now()
  const days = Array.from({ length: 7 }, (_, index) => {
    const timestamp = generatedTime - (6 - index) * 24 * 60 * 60 * 1000
    return {
      day: formatDayKey(timestamp),
      hits: 0,
      errors: 0,
    }
  })
  const map = new Map(days.map((item) => [item.day, item]))

  for (const entry of entries) {
    const timestamp =
      parsePossibleTime(entry.metadata?.published) ||
      parsePossibleTime(generatedAt) ||
      generatedTime
    const day = formatDayKey(timestamp)
    const slot = map.get(day)
    if (!slot) continue
    if (entry.type === 'result' || entry.type === 'watch-account-result') {
      slot.hits += 1
    }
    if (entry.type === 'watch-account-error' || entry.type === 'source-error') {
      slot.errors += 1
    }
  }

  return days
}

function filterEntries(
  entries: IntelEntry[],
  filters: { group: string; groupId: string; trackingGroup: string; domain: string; q: string }
) {
  const activeFilters = Object.values(filters).filter(Boolean)
  if (!activeFilters.length) return entries

  return entries.filter((entry) => {
    const matchesGroup = !filters.group || matchesText(entry.groupLabel, filters.group)
    const matchesGroupId = !filters.groupId || matchesText(entry.groupId, filters.groupId)
    const matchesTrackingGroup =
      !filters.trackingGroup ||
      matchesText(entry.groupLabel, filters.trackingGroup) ||
      matchesText(entry.trackingGroup, filters.trackingGroup) ||
      matchesText(entry.title, filters.trackingGroup) ||
      matchesText(entry.label, filters.trackingGroup) ||
      matchesText(entry.url, filters.trackingGroup) ||
      matchesText(entry.snippet, filters.trackingGroup)
    const matchesDomain =
      !filters.domain || matchesText(entry.url, filters.domain) || matchesText(entry.linkedDomain, filters.domain)
    const matchesQuery =
      !filters.q ||
      matchesText(entry.title, filters.q) ||
      matchesText(entry.label, filters.q) ||
      matchesText(entry.query, filters.q) ||
      matchesText(entry.url, filters.q) ||
      matchesText(entry.snippet, filters.q) ||
      matchesText(entry.sourceLabel, filters.q) ||
      matchesText(entry.tag, filters.q) ||
      matchesText(entry.groupLabel, filters.q) ||
      matchesText(entry.error, filters.q)

    return matchesGroup && matchesGroupId && matchesTrackingGroup && matchesDomain && matchesQuery
  })
}

function buildTagIntelTabHref(
  tab: string,
  filters: { group: string; groupId: string; trackingGroup: string; domain: string; q: string }
) {
  const params = new URLSearchParams()
  if (filters.group) params.set('group', filters.group)
  if (filters.groupId) params.set('groupId', filters.groupId)
  if (filters.trackingGroup) params.set('trackingGroup', filters.trackingGroup)
  if (filters.domain) params.set('domain', filters.domain)
  if (filters.q) params.set('q', filters.q)
  if (tab !== 'all') params.set('tab', tab)
  const query = params.toString()
  return query ? `/hub/tag-intel?${query}` : '/hub/tag-intel'
}

function inferQuickSourceCategory(entry: IntelEntry): string {
  const source = normalizeQueryValue(entry.sourceId || entry.sourceLabel).toLowerCase()
  if (['github', 'huggingface'].includes(source)) return 'developer'
  if (['threads', 'instagram', 'weibo', 'wechat-official', 'reddit'].includes(source)) return 'social'
  if (entry.linkedDomain) return 'company'
  return 'community'
}

function buildSearchIntelPrefillHref(mode: string, options: Record<string, string>) {
  const params = new URLSearchParams()
  params.set('prefill', mode)
  for (const [key, value] of Object.entries(options)) {
    if (value) params.set(key, value)
  }
  return `/hub/search-intel?${params.toString()}`
}

function inferTopicForEntry(entry: IntelEntry): string {
  return entry.trackingGroup || entry.groupLabel || entry.tag || entry.sourceLabel || '新追蹤主題'
}

function inferTagGroupForEntry(entry: IntelEntry): string {
  return entry.groupLabel || entry.trackingGroup || entry.tag || '新追蹤群組'
}

function buildTrackingBundlePrefillHref(entry: IntelEntry) {
  const accountLabel = normalizeQueryValue(entry.label)
  const accountUrl = normalizeQueryValue(entry.url)
  const watchSiteUrl = normalizeQueryValue(entry.linkedDomain)
    ? `https://${normalizeQueryValue(entry.linkedDomain)}`
    : ''
  const watchSiteLabel = normalizeQueryValue(entry.linkedSiteLabel || entry.linkedDomain || entry.title || entry.sourceLabel)
  const sourceLabel = normalizeQueryValue(entry.sourceLabel || entry.title || entry.label || '新來源')
  const sourceUrl = accountUrl || watchSiteUrl
  const sourceCategory = inferQuickSourceCategory(entry)

  return buildSearchIntelPrefillHref('tracking-bundle', {
    sourceLabel,
    sourceUrl,
    sourceCategory,
    accountLabel,
    accountUrl,
    watchSiteLabel,
    watchSiteUrl,
    topic: inferTopicForEntry(entry),
    tagGroup: inferTagGroupForEntry(entry),
    alsoWatch: sourceCategory === 'company' ? 'true' : 'false',
  })
}

export default async function TagIntelPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const data = await loadIntelData()

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Tag 情報中心</h1>
        <p className="mt-4 text-sm text-neutral-500">目前還沒有資料，先執行 tag 情報收集腳本。</p>
      </main>
    )
  }

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const filters = {
    group: normalizeQueryValue(resolvedSearchParams.group),
    groupId: normalizeQueryValue(resolvedSearchParams.groupId),
    trackingGroup: normalizeQueryValue(resolvedSearchParams.trackingGroup),
    domain: normalizeQueryValue(resolvedSearchParams.domain),
    q: normalizeQueryValue(resolvedSearchParams.q),
  }
  const activeTab = normalizeQueryValue(resolvedSearchParams.tab) || 'all'
  const filteredEntries = filterEntries(data.entries, filters)
  const groups = groupEntries(filteredEntries)
  const groupNames = Object.keys(groups)
  const recentItems = buildRecentItems(filteredEntries, data.generatedAt)
  const recentErrors = buildRecentErrors(filteredEntries, data.generatedAt)
  const timeline = buildSevenDayTimeline(filteredEntries, data.generatedAt)
  const agentReach = data.toolingStatus?.agentReach
  const strategy = data.toolingStatus?.collectorStrategy
  const activeFilterBadges = [
    filters.group ? `分類：${filters.group}` : '',
    filters.groupId ? `群組 ID：${filters.groupId}` : '',
    filters.trackingGroup ? `追蹤群組：${filters.trackingGroup}` : '',
    filters.domain ? `網域：${filters.domain}` : '',
    filters.q ? `關鍵字：${filters.q}` : '',
  ].filter(Boolean)
  const tabs = [
    { id: 'all', label: '總覽' },
    { id: 'hits', label: '命中' },
    { id: 'errors', label: '錯誤' },
    { id: 'recommendations', label: '建議追蹤' },
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold sm:text-4xl">Tag 情報中心</h1>
          <p className="mt-2 max-w-2xl text-base leading-8 text-neutral-500 sm:text-sm sm:leading-7">
            依 tag 與來源做的多來源情報收集。生成時間 {data.generatedAt}
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <Link
            href="/hub/search-intel"
            className="inline-flex w-full max-w-full items-center justify-center rounded-xl border border-indigo-300/30 bg-indigo-500/10 px-4 py-3 text-base leading-7 text-indigo-700 transition hover:bg-indigo-500/15 dark:text-indigo-200 sm:w-auto sm:text-sm sm:leading-6"
          >
            前往情報搜尋管理台
          </Link>
          {activeFilterBadges.length ? (
            <Link
              href="/hub/tag-intel"
              className="inline-flex w-full max-w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base leading-7 text-neutral-200 transition hover:bg-white/10 sm:w-auto sm:text-sm sm:leading-6"
            >
              清除篩選
            </Link>
          ) : null}
          <div className="grid w-full grid-cols-2 gap-3 text-sm sm:max-w-sm">
            <div className="rounded-xl border px-4 py-4 text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">標籤</div>
              <div className="mt-2 text-2xl font-semibold text-neutral-100">{data.counts.tags}</div>
            </div>
            <div className="rounded-xl border px-4 py-4 text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">來源</div>
              <div className="mt-2 text-2xl font-semibold text-neutral-100">{data.counts.sources}</div>
            </div>
            <div className="rounded-xl border px-4 py-4 text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">命中</div>
              <div className="mt-2 text-2xl font-semibold text-neutral-100">{data.counts.entries}</div>
            </div>
            <div className="rounded-xl border px-4 py-4 text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">錯誤</div>
              <div className="mt-2 text-2xl font-semibold text-neutral-100">{data.counts.errors}</div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-dashed p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-medium">收集器摘要</h2>
            <p className="mt-2 text-sm text-neutral-500">
              目前由 <span className="font-medium text-neutral-700 dark:text-neutral-200">{data.provider}</span> 負責收集，
              優先級為 <span className="font-medium text-neutral-700 dark:text-neutral-200">{data.priority}</span>。
              若要改來源、主題、追蹤帳號，回到 Search Intel 管理台即可。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border px-3 py-1 text-xs text-neutral-500">命中 {data.counts.entries}</span>
            <span className="rounded-full border px-3 py-1 text-xs text-neutral-500">錯誤 {data.counts.errors}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <details className="group rounded-2xl border px-4 py-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 marker:content-none">
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">收集策略</div>
                <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                  泛用來源優先走 <span className="font-medium">{strategy?.genericSourcesPrefer || 'n/a'}</span>，
                  並保留 <span className="font-medium">{strategy?.nativeSourcesKeep?.length || 0}</span> 條原生來源。
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs text-neutral-500 group-open:hidden">展開</span>
                <span className="hidden text-xs text-neutral-500 group-open:inline">收起</span>
              </div>
            </summary>
            <div className="mt-4 text-sm text-neutral-700 dark:text-neutral-200">
              <div>泛用來源優先：<span className="font-medium">{strategy?.genericSourcesPrefer || 'n/a'}</span></div>
              <div className="mt-2">
                原生來源保留：
                <span className="font-medium"> {strategy?.nativeSourcesKeep?.join(' / ') || 'n/a'}</span>
              </div>
            </div>
          </details>

          <details className="group rounded-2xl border px-4 py-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 marker:content-none">
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Agent Reach 狀態</div>
                {agentReach?.ok ? (
                  <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                    目前可用渠道 <span className="font-medium">{agentReach.availableChannels ?? 0}/{agentReach.totalChannels ?? 0}</span>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-rose-500">{agentReach?.error || '目前讀不到 Agent Reach 狀態'}</div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs text-neutral-500 group-open:hidden">展開</span>
                <span className="hidden text-xs text-neutral-500 group-open:inline">收起</span>
              </div>
            </summary>
            {agentReach?.ok ? (
              <div className="mt-4 space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
                <div>版本：<span className="font-medium">{agentReach.version || 'unknown'}</span></div>
                <div>可用渠道：<span className="font-medium">{agentReach.availableChannels ?? 0}/{agentReach.totalChannels ?? 0}</span></div>
              </div>
            ) : null}
          </details>
        </div>
        {agentReach?.warnings?.length ? (
          <details className="group mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/5 px-4 py-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 marker:content-none">
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">渠道健康提醒</div>
                <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                  目前還有 <span className="font-medium">{agentReach.warnings.slice(0, 6).length}</span> 條提醒，可展開查看。
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs text-neutral-500 group-open:hidden">展開</span>
                <span className="hidden text-xs text-neutral-500 group-open:inline">收起</span>
              </div>
            </summary>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
              {agentReach.warnings.slice(0, 6).map((warning) => (
                <li key={warning} className="list-disc ml-5">
                  {warning}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      {activeFilterBadges.length ? (
        <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">目前篩選</div>
              <p className="mt-2 text-sm text-neutral-300">
                目前共找到 {filteredEntries.length} 筆符合條件的結果，方便你直接查看某個追蹤群組或特定網站的內容流。
              </p>
            </div>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
              共 {filteredEntries.length} 筆
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilterBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100"
              >
                {badge}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {tabs.map((tab) => {
            const active = activeTab === tab.id
            return (
              <Link
                key={tab.id}
                href={buildTagIntelTabHref(tab.id, filters)}
                className={`rounded-xl border px-4 py-2 text-center text-sm transition ${
                  active
                    ? 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </section>

      {activeTab === 'all' ? (
      <section className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-medium">分類總覽</h2>
          <span className="rounded-full border px-3 py-1 text-xs text-neutral-500">共 {groupNames.length} 組</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {groupNames.map((name) => (
            <span key={name} className="rounded-full border px-3 py-1 text-sm">
              {name} · {groups[name].length}
            </span>
          ))}
        </div>
      </section>
      ) : null}

      {activeTab === 'all' || activeTab === 'hits' || activeTab === 'errors' ? (
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-medium">最近命中內容流</h2>
            <span className="rounded-full border px-3 py-1 text-xs text-neutral-500">{recentItems.length} 筆</span>
          </div>
          <p className="mt-2 text-sm text-neutral-500">先看中文閱讀摘要，再決定要不要翻譯閱讀、建卡或整包建立追蹤。</p>
          <div className="mt-4 space-y-3">
            {activeTab !== 'errors' && recentItems.length ? (
              recentItems.slice(0, 8).map((entry, index) => (
                <article key={`${entry.url || entry.title || entry.label}-${index}`} className="rounded-2xl border p-4">
                  <div className="mb-2 flex flex-wrap gap-2 text-xs text-neutral-500">
                    {entry.sourceLabel ? <span className="rounded-full bg-neutral-100 px-2 py-1">{entry.sourceLabel}</span> : null}
                    {entry.groupLabel ? <span className="rounded-full bg-neutral-100 px-2 py-1">{entry.groupLabel}</span> : null}
                    {entry.label ? <span className="rounded-full bg-neutral-100 px-2 py-1">{entry.label}</span> : null}
                  </div>
                  {entry.url ? (
                    <a href={entry.url} target="_blank" rel="noreferrer" className="text-base font-medium underline underline-offset-4">
                      {entry.title || entry.url}
                    </a>
                  ) : (
                    <div className="text-base font-medium">{entry.title || entry.label || '未命名結果'}</div>
                  )}
                  <ReadingSummaryCard
                    entry={entry}
                    translateHref={entry.url ? buildTranslateHref(entry.url) : ''}
                    originalUrl={entry.url}
                  />
                  {entry.snippet ? <p className="mt-3 text-sm text-neutral-600">{entry.snippet}</p> : null}
                  <div className="mt-3 text-xs text-neutral-500">
                    {entry.metadata?.published ? <span>發布：{entry.metadata.published}</span> : <span>收集時間：{data.generatedAt}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <TagIntelTaskButtons
                      mode="hit"
                      label={entry.label}
                      title={entry.title}
                      url={entry.url}
                      source={entry.sourceLabel}
                      query={entry.query}
                      trackingGroup={entry.trackingGroup || entry.groupLabel}
                      linkedDomain={entry.linkedDomain || undefined}
                    />
                    <Link
                      href={buildTrackingBundlePrefillHref(entry)}
                      className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100 transition hover:border-indigo-300/40 hover:bg-indigo-500/15"
                    >
                      整包建立追蹤
                    </Link>
                    {entry.url ? (
                      <a
                        href={buildTranslateHref(entry.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/15"
                      >
                        翻譯閱讀
                      </a>
                    ) : null}
                    {entry.url ? (
                      <Link
                        href={buildSearchIntelPrefillHref('watch-site', {
                          label: entry.title || entry.label || entry.sourceLabel || '新追蹤網站',
                          url: entry.url,
                        })}
                        className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/15"
                      >
                        加成追蹤網站
                      </Link>
                    ) : null}
                    {entry.label && entry.url ? (
                      <Link
                        href={buildSearchIntelPrefillHref('account', {
                          label: entry.label,
                          url: entry.url,
                        })}
                        className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/15"
                      >
                        加成追蹤帳號
                      </Link>
                    ) : null}
                    {entry.url ? (
                      <Link
                        href={buildSearchIntelPrefillHref('source', {
                          label: entry.sourceLabel || entry.title || '新來源',
                          url: entry.url,
                          category: inferQuickSourceCategory(entry),
                        })}
                        className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-100 transition hover:border-fuchsia-300/40 hover:bg-fuchsia-500/15"
                      >
                        加成來源
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">目前這個群組還沒有最近命中內容。</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-medium">最近錯誤</h2>
            <span className="rounded-full border px-3 py-1 text-xs text-neutral-500">{recentErrors.length} 筆</span>
          </div>
          <p className="mt-2 text-sm text-neutral-500">這裡先看中文錯誤摘要，方便你快速判斷是來源問題、登入問題，還是策略需要調整。</p>
          <div className="mt-4 space-y-3">
            {activeTab !== 'hits' && recentErrors.length ? (
              recentErrors.slice(0, 6).map((entry, index) => (
                <article key={`${entry.sourceLabel || entry.label || entry.error}-${index}`} className="rounded-2xl border border-rose-300/20 bg-rose-500/5 p-4">
                  <div className="mb-2 flex flex-wrap gap-2 text-xs text-rose-200">
                    {entry.sourceLabel ? <span className="rounded-full border border-rose-300/20 px-2 py-1">{entry.sourceLabel}</span> : null}
                    {entry.label ? <span className="rounded-full border border-rose-300/20 px-2 py-1">{entry.label}</span> : null}
                    {entry.trackingGroup ? <span className="rounded-full border border-rose-300/20 px-2 py-1">{entry.trackingGroup}</span> : null}
                  </div>
                  <div className="text-sm text-rose-100">{entry.error || 'unknown error'}</div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">目前這個視圖沒有近期錯誤。</div>
            )}
          </div>
        </div>
      </section>
      ) : null}

      {activeTab === 'all' || activeTab === 'hits' || activeTab === 'errors' ? (
      <section className="mt-8 rounded-2xl border p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-medium">最近 7 天時間軸</h2>
          <div className="flex flex-wrap gap-2">
            {data.watchGroupFilter ? (
              <span className="rounded-full border px-3 py-1 text-xs text-neutral-500">群組：{data.watchGroupFilter}</span>
            ) : null}
            <span className="rounded-full border px-3 py-1 text-xs text-neutral-500">{timeline.length} 天</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-neutral-500">用來快速看這個視圖近一週是偏有料、偏安靜，還是錯誤開始變多。</p>
        <div className="mt-4 grid gap-3 md:grid-cols-7">
          {timeline.map((item) => (
            <div key={item.day} className="rounded-2xl border p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">{item.day.slice(5)}</div>
              <div className="mt-3 text-sm text-neutral-300">
                <div>命中：<span className="font-medium text-neutral-100">{item.hits}</span></div>
                <div className="mt-1">錯誤：<span className="font-medium text-neutral-100">{item.errors}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>
      ) : null}

      {activeTab === 'all' || activeTab === 'hits' ? (
      <section className="mt-8 space-y-8">
        {groupNames.length ? (
          groupNames.map((name) => (
            <div key={name}>
              <h3 className="text-lg font-medium">{name}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {groups[name].slice(0, 10).map((entry) => (
                  <article key={`${entry.url}-${entry.tag}`} className="rounded-2xl border p-4">
                    <div className="mb-2 flex flex-wrap gap-2 text-xs text-neutral-500">
                      <span className="rounded-full bg-neutral-100 px-2 py-1">{entry.sourceLabel}</span>
                      <span className="rounded-full bg-neutral-100 px-2 py-1">{entry.tag}</span>
                      {entry.strategy ? <span className="rounded-full bg-neutral-100 px-2 py-1">{entry.strategy}</span> : null}
                    </div>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base font-medium underline underline-offset-4"
                    >
                      {entry.title || entry.url}
                    </a>
                    <ReadingSummaryCard
                      entry={entry}
                      translateHref={entry.url ? buildTranslateHref(entry.url) : ''}
                      originalUrl={entry.url}
                    />
                    {entry.snippet ? <p className="mt-3 text-sm text-neutral-600">{entry.snippet}</p> : null}
                    {entry.metadata?.author || entry.metadata?.published ? (
                      <div className="mt-3 text-xs text-neutral-500">
                        {entry.metadata?.author ? <span>作者：{entry.metadata.author}</span> : null}
                        {entry.metadata?.author && entry.metadata?.published ? <span> · </span> : null}
                        {entry.metadata?.published ? <span>發布：{entry.metadata.published}</span> : null}
                      </div>
                    ) : null}
                    {entry.url ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={buildTranslateHref(entry.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/15"
                        >
                          翻譯閱讀
                        </a>
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200 transition hover:bg-white/10"
                        >
                          原文連結
                        </a>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-neutral-500">
            目前沒有符合條件的內容流。你可以回到 Search Intel 重新追查，或改成較寬鬆的關鍵字 / 群組條件。
          </div>
        )}
      </section>
      ) : null}

      {activeTab === 'all' || activeTab === 'recommendations' ? data.watchRecommendations?.length ? (
        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-medium">建議追蹤</h2>
            <span className="rounded-full border px-3 py-1 text-xs text-neutral-500">{data.watchRecommendations.length} 筆</span>
          </div>
          <p className="mt-2 text-sm text-neutral-500">這裡是系統推測值得持續追的來源與主題，適合直接整包送回 Search Intel 建立追蹤。</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.watchRecommendations.map((item) => (
              <div key={`${item.source}-${item.query}`} className="rounded-2xl border p-4">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  {item.source} · {item.query}
                </div>
                <ReadingSummaryCard
                  entry={{ sourceLabel: item.source, groupLabel: item.label, linkedDomain: item.linkedDomain || undefined, reason: item.reason }}
                  translateHref={item.query?.startsWith('http') ? buildTranslateHref(item.query) : ''}
                  originalUrl={item.query?.startsWith('http') ? item.query : ''}
                />
                <p className="mt-3 text-sm text-neutral-600">{item.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TagIntelTaskButtons
                    mode="recommendation"
                    label={item.label}
                    source={item.source}
                    query={item.query}
                    reason={item.reason}
                    trackingGroup={item.trackingGroup || item.label}
                    linkedDomain={item.linkedDomain || undefined}
                  />
                  <Link
                    href={buildSearchIntelPrefillHref('tracking-bundle', {
                      sourceLabel: item.source,
                      sourceUrl: '',
                      sourceCategory: ['github', 'huggingface'].includes(item.source) ? 'developer' : 'community',
                      topic: item.label,
                      tagGroup: item.label,
                    })}
                    className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100 transition hover:border-indigo-300/40 hover:bg-indigo-500/15"
                  >
                    整包建立追蹤
                  </Link>
                  <Link
                    href={buildSearchIntelPrefillHref('topic', {
                      topic: item.label,
                    })}
                    className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-100 transition hover:border-sky-300/40 hover:bg-sky-500/15"
                  >
                    加成主題
                  </Link>
                  <Link
                    href={buildSearchIntelPrefillHref('tag-group', {
                      tagGroup: item.label,
                    })}
                    className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-100 transition hover:border-violet-300/40 hover:bg-violet-500/15"
                  >
                    加成標籤群
                  </Link>
                  {item.query?.startsWith('http') ? (
                    <a
                      href={buildTranslateHref(item.query)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/15"
                    >
                      翻譯閱讀
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-dashed p-6 text-sm text-neutral-500">
          目前沒有可用的建議追蹤。
        </section>
      ) : null}
    </main>
  )
}
