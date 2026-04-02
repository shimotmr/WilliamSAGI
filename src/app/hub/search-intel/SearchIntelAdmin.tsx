'use client'

import { Fragment, useEffect, useMemo, useState, type ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function MiniIcon({
  path,
  className = 'h-4 w-4',
}: {
  path: string
  className?: string
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ToolbarButton({
  children,
  icon,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: string
}) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${className || ''}`}
    >
      <MiniIcon path={icon} />
      <span>{children}</span>
    </button>
  )
}

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

function cleanCompactText(value?: string, maxLength = 72) {
  if (!value) return ''
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1)}…`
}

function localizeWatchHitSource(value?: string) {
  const source = compactValue(value).toLowerCase()
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

function buildWatchHitSummary(params: {
  title?: string
  sourceLabel?: string
  accountLabel?: string
  trackingGroup?: string
  linkedDomain?: string
}) {
  const sourceLabel = localizeWatchHitSource(params.sourceLabel)
  const group = compactValue(params.trackingGroup)
  const domain = compactValue(params.linkedDomain)
  const title = cleanCompactText(params.title, 88)
  const lines = [
    `這筆命中來自 ${sourceLabel}${group ? `，目前歸在「${group}」追蹤群組` : ''}${domain ? `，並與 ${domain} 相關` : ''}。`,
  ]

  if (params.accountLabel) {
    lines.push(`主要入口帳號：${params.accountLabel}。`)
  }

  if (title) {
    lines.push(
      isMostlyAscii(title)
        ? '原文標題偏英文，建議直接點「翻譯閱讀」先看中文，再決定要不要深追。'
        : '標題可直接閱讀，適合先快速判斷是否值得深追。'
    )
  }

  return lines.slice(0, 3)
}

function buildWatchErrorSummary(params: {
  sourceLabel?: string
  accountLabel?: string
  message?: string
  trackingGroup?: string
}) {
  const sourceLabel = localizeWatchHitSource(params.sourceLabel)
  const account = compactValue(params.accountLabel)
  const message = cleanCompactText(params.message, 96)
  const group = compactValue(params.trackingGroup)

  const lines = [
    `這筆錯誤來自 ${sourceLabel}${account ? `，主要帳號是 ${account}` : ''}${group ? `，目前屬於「${group}」群組` : ''}。`,
  ]

  if (message) {
    lines.push(`錯誤摘要：${message}`)
  }

  lines.push('建議先看錯誤內容，再決定是否重跑群組收集或調整 query。')
  return lines.slice(0, 3)
}

function describeHybridLevel(level?: string | null) {
  const normalized = compactValue(level).toLowerCase()
  const mapping: Record<string, string> = {
    high: '高優先',
    medium: '中優先',
    low: '低優先',
    unknown: '未分類',
  }
  return mapping[normalized] || level || '未分類'
}

function describeHybridRoute(route?: string | null) {
  const normalized = compactValue(route).toLowerCase()
  const mapping: Record<string, string> = {
    local: '本地優先',
    cloud: '雲端優先',
    hybrid: '混合路徑',
    unknown: '未判定',
  }
  return mapping[normalized] || route || '未判定'
}

function describeHybridCloud(run: {
  cloud_ok?: boolean | null
  skip_cloud?: boolean | null
  cloud_provider?: string | null
  cloud_model?: string | null
}) {
  if (run.cloud_ok) {
    return `${run.cloud_provider || '雲端'}${run.cloud_model ? ` / ${run.cloud_model}` : ''}`
  }
  if (run.skip_cloud) return '已略過'
  return '目前不可用'
}

function describeBooleanFlag(value?: boolean, yes = '是', no = '否') {
  return value ? yes : no
}

function buildHybridRunSummary(run: {
  classification_level?: string | null
  classification_route?: string | null
  sources: string[]
  topics: string[]
  cloud_ok?: boolean | null
  skip_cloud?: boolean | null
  cloud_provider?: string | null
  cloud_model?: string | null
}) {
  const sourceText = run.sources?.length ? run.sources.join('、') : '未指定來源'
  const topicText = run.topics?.length ? run.topics.join('、') : '未指定主題'
  return [
    `這次 hybrid run 的優先等級是「${describeHybridLevel(run.classification_level)}」，路由判定為「${describeHybridRoute(run.classification_route)}」。`,
    `主要來源：${sourceText}；主題：${topicText}。`,
    `雲端狀態：${describeHybridCloud(run)}。`,
  ]
}

function buildHybridFeedbackSummary(params: {
  taskStatus?: string | null
  relatedGroups?: Array<{ group: WatchGroupItem; score: number }>
}) {
  const groups = params.relatedGroups || []
  const totalHits = groups.reduce((sum, item) => sum + ((item.group.recentHits || []).length || 0), 0)
  const totalErrors = groups.reduce((sum, item) => sum + ((item.group.recentErrors || []).length || 0), 0)
  const topGroup = groups[0]?.group
  const topGroupName = compactValue(topGroup?.trackingGroup) || compactValue(topGroup?.linkedDomain)

  const lines: string[] = []

  if (params.taskStatus) {
    lines.push(`任務目前狀態是「${describeTaskStatus(params.taskStatus)}」。`)
  }

  if (!groups.length) {
    lines.push('目前還沒對上現有追蹤群組，若你準備長期追蹤，建議先轉成追蹤設定。')
    return lines
  }

  if (totalHits > 0) {
    lines.push(`目前已對上 ${groups.length} 組追蹤群組，合計看到 ${totalHits} 筆最近命中。`)
  } else {
    lines.push(`目前已對上 ${groups.length} 組追蹤群組，但還沒看到新的命中內容。`)
  }

  if (totalErrors > 0) {
    lines.push(`同時也累積 ${totalErrors} 筆最近錯誤，建議先看錯誤流再決定是否重跑。`)
  } else if (topGroupName) {
    lines.push(`目前最接近的是「${topGroupName}」這組，可以直接點進去看內容流。`)
  }

  return lines.slice(0, 3)
}

function hybridFeedbackTone(params: { relatedGroups?: Array<{ group: WatchGroupItem; score: number }>; taskStatus?: string | null }) {
  const groups = params.relatedGroups || []
  const totalHits = groups.reduce((sum, item) => sum + ((item.group.recentHits || []).length || 0), 0)
  const totalErrors = groups.reduce((sum, item) => sum + ((item.group.recentErrors || []).length || 0), 0)
  const status = compactValue(params.taskStatus)

  if (status === '已完成' && totalHits > 0) {
    return 'border-emerald-400/20 bg-emerald-500/10'
  }
  if (totalErrors > 0) {
    return 'border-rose-400/20 bg-rose-500/10'
  }
  if (groups.length > 0 || status === '執行中') {
    return 'border-cyan-400/20 bg-cyan-500/10'
  }
  return 'border-amber-400/20 bg-amber-500/10'
}

function describeTaskStatus(status?: string | null) {
  const normalized = compactValue(status)
  const mapping: Record<string, string> = {
    待執行: '待執行',
    執行中: '執行中',
    已完成: '已完成',
    已取消: '已取消',
    失敗: '失敗',
    needs_reconcile: '待對帳',
  }
  return mapping[normalized] || normalized || '未同步'
}

function taskStatusTone(status?: string | null) {
  const normalized = compactValue(status)
  if (normalized === '已完成') return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
  if (normalized === '執行中') return 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100'
  if (normalized === '待執行' || normalized === 'needs_reconcile') return 'border-amber-400/20 bg-amber-500/10 text-amber-100'
  if (normalized === '已取消' || normalized === '失敗') return 'border-rose-400/20 bg-rose-500/10 text-rose-100'
  return 'border-white/10 bg-white/5 text-neutral-200'
}

type SearchSourceItem = {
  id: string
  label: string
  enabled?: boolean
  category?: string
  domains?: string[]
  search_mode?: string
  strict_domain_filter?: boolean
  supports_deep_fetch?: boolean
  priority?: string
  adapter?: string
  config?: Record<string, unknown>
}

type SearchTopicItem = {
  id: string
  label: string
  keywords?: string[]
  suggested_sources?: string[]
  default_time_range_days?: number
  default_level?: string
  default_mode?: string
  config?: Record<string, unknown>
}

type SearchTagGroupItem = {
  id: string
  label: string
  tags?: string[]
  config?: Record<string, unknown>
}

type WatchAccountItem = {
  label: string
  source: string
  query: string
  enabled?: boolean
  [key: string]: unknown
}

type WatchSiteItem = {
  label: string
  site: string
  enabled?: boolean
  [key: string]: unknown
}

type SearchIntelSnapshot = {
  sources: SearchSourceItem[]
  topics: SearchTopicItem[]
  tagGroups: SearchTagGroupItem[]
  watchlist: {
    accounts?: WatchAccountItem[]
    sites?: WatchSiteItem[]
  }
  collector: {
    generatedAt: string
    priority: string
    provider: string
    counts: {
      tags: number
      sources: number
      entries: number
      errors: number
    }
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
    watchGroups?: Array<{
      trackingGroup?: string | null
      linkedDomain?: string | null
      accounts?: Array<{
        label?: string
        source?: string
        query?: string
      }>
      sites?: Array<{
        label?: string
        site?: string
        category?: string
      }>
      recentHits?: Array<{
        title?: string
        url?: string
        sourceLabel?: string
        accountLabel?: string
      }>
      recentErrors?: Array<{
        sourceLabel?: string
        accountLabel?: string
        message?: string
      }>
    }>
    watchRecommendations?: Array<{
      label?: string
      source?: string
      query?: string
      reason?: string
      trackingGroup?: string | null
      linkedDomain?: string | null
      linkedSiteLabel?: string | null
    }>
  } | null
  collectorRuns: {
    id: string
    collector: string
    priority: string
    provider: string
    published: boolean
    tags_count: number
    sources_count: number
    entries_count: number
    errors_count: number
    status: string
    metadata?: Record<string, unknown>
    created_at: string
  }[]
  hybridRuns: {
    id: string
    query: string
    classification_level?: string | null
    classification_route?: string | null
    provider?: string | null
    sources: string[]
    topics: string[]
    need_comparison: boolean
    need_strategy: boolean
    requires_deep_fetch: boolean
    skip_cloud: boolean
    cloud_ok?: boolean | null
    cloud_provider?: string | null
    cloud_model?: string | null
    artifact_paths?: Record<string, string>
    metadata?: {
      stderr?: string | null
      execution_plan?: unknown
      evidence_bundle?: unknown
    }
    created_at: string
  }[]
  storage: {
    sources: 'db' | 'json'
    topics: 'db' | 'json'
    tagGroups: 'db' | 'json'
    watchlist: 'db' | 'json'
  }
}

type HybridRunResult = {
  query: string
  classification?: {
    level?: string
    route?: string
    signals?: Record<string, unknown>
  }
  artifact_paths?: Record<string, string>
  cloud_result?: {
    ok?: boolean
    provider?: string
    model?: string
  } | null
}

type ArtifactDetailState = Record<string, {
  loading?: boolean
  content?: unknown
  error?: string
}>

type QuickRecommendation = {
  title: string
  summary: string
  topics: string[]
  tagGroups: string[]
  notes: string[]
}

type MergeOutcome = {
  primaryName: string
  secondaryName: string
  rerun: boolean
  before: ReturnType<typeof summarizeWatchGroupHealth>
  after: ReturnType<typeof summarizeWatchGroupHealth>
}

type HybridRunActionState = Record<string, {
  investigated?: boolean
  trackingPrefilled?: boolean
  taskId?: number | null
  taskMessage?: string | null
  taskStatus?: string | null
  taskUpdatedAt?: string | null
  taskResult?: string | null
}>

type AgentReachIssue = {
  id: string
  level: 'warning' | 'action'
  title: string
  summary: string
  commands: string[]
  requiresLogin?: boolean
  canAutoVerify?: boolean
}

type PrefillMode = 'source' | 'account' | 'watch-site' | 'topic' | 'tag-group' | 'tracking-bundle'

type WatchGroupItem = NonNullable<NonNullable<SearchIntelSnapshot['collector']>['watchGroups']>[number]

type ListKind = 'sources' | 'topics' | 'tagGroups' | 'accounts' | 'sites'
type CollectorProvider = 'auto' | 'exa' | 'brave' | 'tavily' | 'duckduckgo'
type QuickSourceCategory = 'community' | 'social' | 'company' | 'developer' | 'model-platform'
type QuickTopicMode = 'routing' | 'collector'

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinCsv(value?: string[]) {
  return Array.isArray(value) ? value.join(', ') : ''
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function extractDomain(value: string) {
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
    const url = new URL(withProtocol)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return value.replace(/^https?:\/\//i, '').replace(/^www\./, '').split('/')[0].trim()
  }
}

function compactValue(value?: string | null) {
  return String(value || '').trim()
}

function normalizeForMatch(value?: string | null) {
  return compactValue(value)
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/^www\./, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => compactValue(value)).filter(Boolean)))
}

function buildAgentReachIssues(warnings?: string[]) {
  return (warnings || []).map((warning, index): AgentReachIssue => {
    const text = compactValue(warning)
    const normalized = text.toLowerCase()

    if (normalized.includes('gh cli') || normalized.includes('gh auth login')) {
      return {
        id: `agent-reach-gh-${index}`,
        level: 'warning',
        title: 'GitHub 功能尚未完整解鎖',
        summary: '這條是唯一明確需要你親自登入的項目。完成 GitHub 網頁授權後，倉庫與程式碼相關能力就會完整打開。',
        commands: ['gh auth login -h github.com -p https -w'],
        requiresLogin: true,
        canAutoVerify: true,
      }
    }

    if (normalized.includes('twitter-cli')) {
      return {
        id: `agent-reach-twitter-${index}`,
        level: 'action',
        title: 'X / Twitter CLI 尚未安裝',
        summary: '這是可補裝的工具缺口，不需要你先拿額外憑證。安裝後再重新檢查即可。',
        commands: ['uv tool install twitter-cli', 'twitter-cli --help'],
        canAutoVerify: true,
      }
    }

    if (normalized.includes('reddit') && normalized.includes('exa')) {
      return {
        id: `agent-reach-reddit-${index}`,
        level: 'action',
        title: 'Reddit 目前走 Exa 路徑',
        summary: '這條其實不是壞掉，而是提醒目前依賴 mcporter + Exa 來做 Reddit 搜尋與閱讀。若結果正常，可視為已可用。',
        commands: ['~/clawd/scripts/external_web_tools.sh exa-search "site:reddit.com AI agent" 3'],
        canAutoVerify: true,
      }
    }

    if (normalized.includes('小红书') || normalized.includes('小紅書')) {
      return {
        id: `agent-reach-xiaohongshu-${index}`,
        level: 'action',
        title: '小紅書 MCP 尚未配置',
        summary: '這條需要額外服務，先不急著裝也沒關係。等你真的要追小紅書時，再按文件把 MCP 裝起來即可。',
        commands: [
          'docker run -d --name xiaohongshu-mcp -p 18060:18060 --platform linux/amd64 xpzouying/xiaohongshu-mcp',
          "mcporter config add xiaohongshu http://localhost:18060/mcp",
        ],
      }
    }

    if (normalized.includes('抖音')) {
      return {
        id: `agent-reach-douyin-${index}`,
        level: 'action',
        title: '抖音 MCP 尚未配置',
        summary: '這條也屬於額外來源擴充。先保留建議即可，等你真的要抓抖音內容時再裝最穩。',
        commands: ['pip install douyin-mcp-server', 'mcporter config add douyin http://localhost:18070/mcp'],
      }
    }

    if (normalized.includes('linkedin')) {
      return {
        id: `agent-reach-linkedin-${index}`,
        level: 'action',
        title: 'LinkedIn MCP 尚未配置',
        summary: 'LinkedIn 通常是較高成本來源，建議放在最後處理。現在不會卡住我們主流程。',
        commands: ['pip install linkedin-scraper-mcp', 'mcporter config add linkedin http://localhost:3000/mcp'],
      }
    }

    return {
      id: `agent-reach-generic-${index}`,
      level: text.startsWith('[!]') ? 'warning' : 'action',
      title: '需人工確認的 Agent Reach 提示',
      summary: text.replace(/^\[[^\]]+\]\s*/, ''),
      commands: [],
    }
  })
}

function findRelevantWatchGroupsForHybridRun(params: {
  run: SearchIntelSnapshot['hybridRuns'][number]
  sources: SearchSourceItem[]
  watchGroups?: WatchGroupItem[]
}) {
  const groups = params.watchGroups || []
  const runText = normalizeForMatch(params.run.query)
  const sourceDomains = new Set(
    params.run.sources.flatMap((sourceId) => {
      const match = params.sources.find((source) => source.id === sourceId)
      return (match?.domains || []).map((domain) => normalizeForMatch(domain))
    })
  )
  const sourceIds = new Set(params.run.sources.map((source) => normalizeForMatch(source)))
  const topicIds = new Set(params.run.topics.map((topic) => normalizeForMatch(topic)))

  return groups
    .map((group) => {
      let score = 0
      const trackingGroup = compactValue(group.trackingGroup)
      const linkedDomain = compactValue(group.linkedDomain)
      const normalizedTracking = normalizeForMatch(trackingGroup)
      const normalizedDomain = normalizeForMatch(linkedDomain)

      if (normalizedDomain && sourceDomains.has(normalizedDomain)) score += 5
      if (normalizedTracking && runText.includes(normalizedTracking)) score += 4
      if (normalizedDomain && runText.includes(normalizedDomain)) score += 4

      for (const site of group.sites || []) {
        const siteDomain = normalizeForMatch(extractDomain(compactValue(site.site)))
        const siteLabel = normalizeForMatch(site.label)
        if (siteDomain && sourceDomains.has(siteDomain)) score += 4
        if (siteDomain && runText.includes(siteDomain)) score += 3
        if (siteLabel && runText.includes(siteLabel)) score += 2
        if (compactValue(site.category) === 'competitor_or_company_site' && sourceIds.has('competitor-sites')) score += 2
      }

      for (const account of group.accounts || []) {
        const accountSource = normalizeForMatch(account.source)
        const accountLabel = normalizeForMatch(account.label)
        const accountQuery = normalizeForMatch(account.query)
        if (accountSource && sourceIds.has(accountSource)) score += 2
        if (accountLabel && runText.includes(accountLabel)) score += 2
        if (accountQuery && runText.includes(accountQuery.replace(/^@/, ''))) score += 3
      }

      if (sourceIds.has('github') && topicIds.has('skills-and-cases')) {
        const hasDevSource = (group.accounts || []).some((account) => ['github', 'huggingface'].includes(normalizeForMatch(account.source)))
        if (hasDevSource) score += 1
      }

      if (sourceIds.has('threads') || sourceIds.has('instagram') || sourceIds.has('weibo') || sourceIds.has('wechat-official')) {
        const hasSocialSource = (group.accounts || []).some((account) =>
          ['threads', 'instagram', 'weibo', 'wechat-official'].includes(normalizeForMatch(account.source))
        )
        if (hasSocialSource) score += 1
      }

      return { group, score }
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
}

function inferTopicsForWatchGroup(group: WatchGroupItem) {
  const sources = uniqueStrings((group.accounts || []).map((account) => compactValue(account.source))).map((value) =>
    value.toLowerCase()
  )
  const topics = new Set<string>()

  if (compactValue(group.linkedDomain) || (group.sites || []).length) {
    topics.add('competitor-monitoring')
  }
  if (sources.some((source) => ['dcard', 'ptt', 'mobile01', 'threads', 'instagram'].includes(source))) {
    topics.add('community-signals-tw')
  }
  if (sources.some((source) => ['weibo', 'wechat-official'].includes(source))) {
    topics.add('social-signal-cn')
  }
  if (sources.some((source) => ['github', 'huggingface'].includes(source))) {
    topics.add('skills-and-cases')
  }
  if (!topics.size) {
    topics.add('competitor-monitoring')
  }

  return Array.from(topics)
}

function inferSourcesForWatchGroup(group: WatchGroupItem) {
  const sources = new Set<string>()
  for (const account of group.accounts || []) {
    const source = compactValue(account.source)
    if (source) sources.add(source)
  }
  if ((group.sites || []).length || compactValue(group.linkedDomain)) {
    sources.add('competitor-sites')
  }
  return Array.from(sources)
}

function buildWatchGroupQuery(group: WatchGroupItem) {
  const groupName = compactValue(group.trackingGroup) || compactValue(group.linkedDomain)
  const accountLabels = uniqueStrings((group.accounts || []).map((account) => compactValue(account.label)))
  const queries = uniqueStrings((group.accounts || []).map((account) => compactValue(account.query)))

  if (groupName && queries.length) {
    return `追蹤 ${groupName} 最近更新，重點查看 ${queries.slice(0, 3).join('、')} 與官網異動`
  }
  if (groupName && accountLabels.length) {
    return `追蹤 ${groupName} 最近更新，重點查看 ${accountLabels.slice(0, 3).join('、')}`
  }
  if (groupName) {
    return `追蹤 ${groupName} 最近更新與討論`
  }
  if (queries.length) {
    return `追蹤 ${queries.slice(0, 3).join('、')} 最近更新`
  }
  return '追蹤這個 watch group 最近更新'
}

function buildTagIntelHref(group: WatchGroupItem, query?: string, tab = 'all') {
  const params = new URLSearchParams()
  const trackingGroup = compactValue(group.trackingGroup)
  const linkedDomain = compactValue(group.linkedDomain)
  const finalQuery = compactValue(query)

  if (trackingGroup) {
    params.set('trackingGroup', trackingGroup)
  }
  if (linkedDomain) {
    params.set('domain', linkedDomain)
  }
  if (finalQuery) {
    params.set('q', finalQuery)
  }
  if (tab && tab !== 'all') {
    params.set('tab', tab)
  }

  const search = params.toString()
  return search ? `/hub/tag-intel?${search}` : '/hub/tag-intel'
}

function buildSearchIntelPrefillHref(mode: PrefillMode, options: Record<string, string>) {
  const params = new URLSearchParams()
  params.set('prefill', mode)
  for (const [key, value] of Object.entries(options)) {
    if (compactValue(value)) params.set(key, value)
  }
  return `/hub/search-intel?${params.toString()}`
}

function parseIsoTime(value?: string | null) {
  if (!value) return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

function summarizeWatchGroupHealth(params: {
  group: WatchGroupItem
  collectorRuns: SearchIntelSnapshot['collectorRuns']
}) {
  const groupName = compactValue(params.group.trackingGroup) || compactValue(params.group.linkedDomain)
  const accountCount = Array.isArray(params.group.accounts) ? params.group.accounts.length : 0
  const siteCount = Array.isArray(params.group.sites) ? params.group.sites.length : 0
  const recentHitCount = Array.isArray(params.group.recentHits) ? params.group.recentHits.length : 0
  const recentErrorCount = Array.isArray(params.group.recentErrors) ? params.group.recentErrors.length : 0
  const sevenDayGroupRuns = params.collectorRuns.filter((run) => {
    const meta = (run.metadata || {}) as Record<string, unknown>
    const watchGroup = compactValue(typeof meta.watch_group === 'string' ? meta.watch_group : '')
    const runTime = parseIsoTime(run.created_at)
    const within7Days = runTime ? Date.now() - runTime <= 7 * 24 * 60 * 60 * 1000 : false
    return within7Days && groupName && watchGroup === groupName
  })
  const sevenDayRuns = sevenDayGroupRuns.length
  const sevenDayHitRuns = sevenDayGroupRuns.filter((run) => (run.entries_count || 0) > 0).length

  let score = 40
  score += Math.min(20, accountCount * 6)
  score += Math.min(15, siteCount * 8)
  score += Math.min(20, recentHitCount * 5)
  score += Math.min(10, sevenDayHitRuns * 4)
  score -= Math.min(25, recentErrorCount * 8)
  if (sevenDayRuns === 0) score -= 10
  score = Math.max(0, Math.min(100, score))

  const status = score >= 80 ? '穩定' : score >= 60 ? '可用' : score >= 40 ? '需補強' : '脆弱'
  return { score, status, sevenDayRuns, sevenDayHitRuns, recentHitCount, recentErrorCount, accountCount, siteCount }
}

function recommendWatchGroupActions(group: WatchGroupItem) {
  const accountSources = uniqueStrings((group.accounts || []).map((account) => compactValue(account.source).toLowerCase()))
  const hasLinkedDomain = Boolean(compactValue(group.linkedDomain))
  const notes: Array<{ label: string; href?: string }> = []

  if (!hasLinkedDomain) {
    notes.push({
      label: '補官網追蹤',
      href: buildSearchIntelPrefillHref('watch-site', {
        label: compactValue(group.trackingGroup) || '新追蹤網站',
        url: '',
      }),
    })
  }
  if (!accountSources.includes('threads') && !accountSources.includes('instagram')) {
    notes.push({ label: '補社群帳號' })
  }
  if (!accountSources.includes('github') && !accountSources.includes('huggingface')) {
    notes.push({ label: '補開發者來源' })
  }
  if ((group.recentErrors || []).length >= 2) {
    notes.push({ label: '檢查錯誤來源與 query' })
  }
  if (!(group.recentHits || []).length) {
    notes.push({ label: '先重跑群組收集' })
  }
  return notes.slice(0, 4)
}

function normalizeBrandTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[@._/-]+/g, ' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item && item.length >= 3)
}

function calculateGroupSimilarity(groupA: WatchGroupItem, groupB: WatchGroupItem) {
  const tokensA = new Set(
    [
      compactValue(groupA.trackingGroup),
      compactValue(groupA.linkedDomain),
      ...(groupA.accounts || []).flatMap((item) => normalizeBrandTokens(`${compactValue(item.label)} ${compactValue(item.query)}`)),
      ...(groupA.sites || []).flatMap((item) => normalizeBrandTokens(`${compactValue(item.label)} ${compactValue(item.site)}`)),
    ].filter(Boolean)
  )
  const tokensB = new Set(
    [
      compactValue(groupB.trackingGroup),
      compactValue(groupB.linkedDomain),
      ...(groupB.accounts || []).flatMap((item) => normalizeBrandTokens(`${compactValue(item.label)} ${compactValue(item.query)}`)),
      ...(groupB.sites || []).flatMap((item) => normalizeBrandTokens(`${compactValue(item.label)} ${compactValue(item.site)}`)),
    ].filter(Boolean)
  )

  const intersection = Array.from(tokensA).filter((token) => tokensB.has(token))
  const union = new Set([...tokensA, ...tokensB])
  const domainBoost =
    compactValue(groupA.linkedDomain) && compactValue(groupA.linkedDomain) === compactValue(groupB.linkedDomain) ? 0.35 : 0
  const score = union.size ? intersection.length / union.size + domainBoost : 0
  return {
    score,
    commonTokens: intersection.slice(0, 5),
  }
}

function buildMergeSuggestions(groups: WatchGroupItem[]) {
  const suggestions: Array<{
    primary: WatchGroupItem
    secondary: WatchGroupItem
    score: number
    commonTokens: string[]
  }> = []

  for (let i = 0; i < groups.length; i += 1) {
    for (let j = i + 1; j < groups.length; j += 1) {
      const result = calculateGroupSimilarity(groups[i], groups[j])
      if (result.score >= 0.45) {
        suggestions.push({
          primary: groups[i],
          secondary: groups[j],
          score: result.score,
          commonTokens: result.commonTokens,
        })
      }
    }
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 6)
}

function buildGroupIdentifiers(group: WatchGroupItem) {
  const trackingGroup = compactValue(group.trackingGroup)
  const linkedDomain = compactValue(group.linkedDomain)
  const accountQueries = uniqueStrings((group.accounts || []).map((item) => compactValue(item.query).toLowerCase()))
  const accountLabels = uniqueStrings((group.accounts || []).map((item) => compactValue(item.label).toLowerCase()))
  const siteDomains = uniqueStrings((group.sites || []).map((item) => extractDomain(compactValue(item.site)).toLowerCase()))
  const siteLabels = uniqueStrings((group.sites || []).map((item) => compactValue(item.label).toLowerCase()))
  return {
    trackingGroup: trackingGroup.toLowerCase(),
    linkedDomain: linkedDomain.toLowerCase(),
    accountQueries,
    accountLabels,
    siteDomains,
    siteLabels,
  }
}

function matchesGroupAccount(item: WatchAccountItem, identifiers: ReturnType<typeof buildGroupIdentifiers>) {
  const trackingGroup = compactValue(String(item.trackingGroup || '')).toLowerCase()
  const linkedDomain = compactValue(String(item.linkedDomain || '')).toLowerCase()
  const query = compactValue(item.query).toLowerCase()
  const label = compactValue(item.label).toLowerCase()
  return Boolean(
    (identifiers.trackingGroup && trackingGroup === identifiers.trackingGroup) ||
      (identifiers.linkedDomain && linkedDomain === identifiers.linkedDomain) ||
      (query && identifiers.accountQueries.includes(query)) ||
      (label && identifiers.accountLabels.includes(label))
  )
}

function matchesGroupSite(item: WatchSiteItem, identifiers: ReturnType<typeof buildGroupIdentifiers>) {
  const trackingGroup = compactValue(String(item.trackingGroup || '')).toLowerCase()
  const site = compactValue(item.site)
  const siteDomain = extractDomain(site).toLowerCase()
  const label = compactValue(item.label).toLowerCase()
  return Boolean(
    (identifiers.trackingGroup && trackingGroup === identifiers.trackingGroup) ||
      (siteDomain && ((identifiers.linkedDomain && siteDomain === identifiers.linkedDomain) || identifiers.siteDomains.includes(siteDomain))) ||
      (label && identifiers.siteLabels.includes(label))
  )
}

function pickCanonicalGroupMeta(primary: WatchGroupItem, secondary: WatchGroupItem) {
  const primaryName = compactValue(primary.trackingGroup)
  const secondaryName = compactValue(secondary.trackingGroup)
  const primaryDomain = compactValue(primary.linkedDomain)
  const secondaryDomain = compactValue(secondary.linkedDomain)
  const primarySiteLabel = compactValue(primary.sites?.[0]?.label)
  const secondarySiteLabel = compactValue(secondary.sites?.[0]?.label)

  const linkedDomain = primaryDomain || secondaryDomain || ''
  const linkedSiteLabel = primarySiteLabel || secondarySiteLabel || ''
  const trackingGroup =
    primaryName ||
    secondaryName ||
    slugify(linkedSiteLabel || linkedDomain || 'merged-watch-group')

  return {
    trackingGroup,
    linkedDomain,
    linkedSiteLabel,
  }
}

function pickHandleFromUrl(rawUrl: string) {
  try {
    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
    const url = new URL(normalizedUrl)
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (!pathParts.length) return ''
    const last = pathParts[pathParts.length - 1]
    if (!last || last === 'u' || last === 'channel') return ''
    return last.replace(/^@/, '')
  } catch {
    return ''
  }
}

function findLinkedWatchSite(params: { label: string; url: string; watchSites: WatchSiteItem[] }) {
  const labelTokens = normalizeBrandTokens(params.label)
  const domain = extractDomain(params.url).toLowerCase()
  const handle = pickHandleFromUrl(params.url).toLowerCase()

  return params.watchSites.find((site) => {
    const siteUrl = String(site.site || '')
    const siteDomain = extractDomain(siteUrl).toLowerCase()
    const siteLabelTokens = normalizeBrandTokens(site.label || '')
    const siteCategory = String(site.category || '')
    if (siteCategory && siteCategory !== 'competitor_or_company_site') {
      return false
    }
    if (handle && siteDomain.includes(handle)) return true
    if (domain && domain === siteDomain) return true
    return labelTokens.some((token) => siteDomain.includes(token) || siteLabelTokens.includes(token))
  })
}

function inferWatchAccountDraft(params: { label: string; url: string; watchSites?: WatchSiteItem[] }): WatchAccountItem {
  const rawUrl = params.url.trim()
  const domain = extractDomain(rawUrl).toLowerCase()
  const label = params.label.trim() || rawUrl
  const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`

  let source = 'web'
  if (domain.includes('threads.net')) source = 'threads'
  else if (domain.includes('instagram.com')) source = 'instagram'
  else if (domain.includes('weibo.com')) source = 'weibo'
  else if (domain.includes('mp.weixin.qq.com')) source = 'wechat-official'
  else if (domain.includes('reddit.com')) source = 'reddit'
  else if (domain.includes('github.com')) source = 'github'
  else if (domain.includes('youtube.com') || domain.includes('youtu.be')) source = 'youtube'
  else if (domain.includes('x.com') || domain.includes('twitter.com')) source = 'twitter'

  let query = normalizedUrl
  try {
    const url = new URL(normalizedUrl)
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (pathParts.length) {
      const last = pathParts[pathParts.length - 1]
      if (last && last !== 'u' && last !== 'channel') {
        query = `@${last.replace(/^@/, '')}`
      }
    }
  } catch {
    query = normalizedUrl
  }

  const linkedSite = params.watchSites?.length
    ? findLinkedWatchSite({ label, url: normalizedUrl, watchSites: params.watchSites })
    : null

  return {
    label,
    source,
    query,
    enabled: true,
    url: normalizedUrl,
    linkedSiteLabel: linkedSite?.label || undefined,
    linkedSite: linkedSite?.site || undefined,
    linkedDomain: linkedSite ? extractDomain(String(linkedSite.site || '')) : undefined,
    trackingGroup: linkedSite?.label ? slugify(linkedSite.label) : undefined,
  }
}

function inferSourceDraft(params: {
  label: string
  url: string
  category: QuickSourceCategory
}): SearchSourceItem {
  const domain = extractDomain(params.url)
  const label = params.label.trim() || domain
  const id = slugify(label) || slugify(domain) || 'custom-source'
  const lowerDomain = domain.toLowerCase()

  let adapter = 'generic'
  let searchMode = 'search_engine'
  let strictDomainFilter = true
  let supportsDeepFetch = true
  let config: Record<string, unknown> | undefined

  if (lowerDomain.includes('github.com')) {
    adapter = 'github_api'
    searchMode = 'native_api'
  } else if (lowerDomain.includes('reddit.com')) {
    adapter = 'reddit_json'
    searchMode = 'native_api'
  } else if (lowerDomain.includes('huggingface.co')) {
    adapter = 'huggingface_native'
    searchMode = 'native_api'
  } else if (lowerDomain.includes('youtube.com') || lowerDomain.includes('youtu.be')) {
    adapter = 'youtube_native'
    searchMode = 'native_api'
  }

  if (params.category === 'social') {
    supportsDeepFetch = false
    config = { requires_feasibility_check: true }
  }

  if (params.category === 'company') {
    adapter = 'generic'
    searchMode = 'search_engine'
    strictDomainFilter = true
    supportsDeepFetch = true
    config = { tracking_kind: 'competitor_or_company_site' }
  }

  return {
    id,
    label,
    enabled: true,
    category: params.category,
    domains: domain ? [domain] : [],
    search_mode: searchMode,
    strict_domain_filter: strictDomainFilter,
    supports_deep_fetch: supportsDeepFetch,
    priority: params.category === 'company' ? 'weekly' : 'daily',
    adapter,
    config,
  }
}

function inferTopicDraft(params: { label: string; mode: QuickTopicMode }): SearchTopicItem | SearchTagGroupItem {
  const label = params.label.trim()
  const normalized = label.toLowerCase()
  const id = slugify(label) || 'custom-topic'
  const keywordSet = new Set<string>(splitCsv(label.replace(/[／/|｜]/g, ',')))

  if (normalized.includes('競品') || normalized.includes('competitor')) {
    keywordSet.add('competitor')
    keywordSet.add('pricing')
    keywordSet.add('feature update')
  }
  if (normalized.includes('科技') || normalized.includes('ai')) {
    keywordSet.add('ai')
    keywordSet.add('agent')
    keywordSet.add('automation')
  }
  if (normalized.includes('社群') || normalized.includes('forum')) {
    keywordSet.add('討論')
    keywordSet.add('心得')
  }

  const keywords = Array.from(keywordSet).filter(Boolean)

  if (params.mode === 'collector') {
    return {
      id,
      label,
      tags: keywords.length ? keywords : [label],
    }
  }

  const suggestedSources: string[] = []
  if (normalized.includes('競品') || normalized.includes('官網')) suggestedSources.push('competitor-sites')
  if (normalized.includes('社群') || normalized.includes('論壇')) suggestedSources.push('dcard', 'ptt', 'mobile01')
  if (normalized.includes('模型') || normalized.includes('hugging face')) suggestedSources.push('huggingface', 'github')

  return {
    id,
    label,
    keywords: keywords.length ? keywords : [label],
    suggested_sources: suggestedSources,
    default_level: 'L2',
    default_mode: 'local_first',
    default_time_range_days: normalized.includes('競品') ? 14 : 7,
  }
}

function inferWatchSiteDraft(params: { label: string; url: string }): WatchSiteItem {
  const label = params.label.trim() || extractDomain(params.url)
  const rawUrl = params.url.trim()
  const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
  const lowered = `${label} ${normalizedUrl}`.toLowerCase()
  const category =
    lowered.includes('competitor') || lowered.includes('競品') || lowered.includes('官網') || lowered.includes('product')
      ? 'competitor_or_company_site'
      : lowered.includes('docs') || lowered.includes('文件')
        ? 'documentation'
        : 'site'
  return {
    label,
    site: normalizedUrl,
    enabled: true,
    category,
  }
}

function inferRecommendationsForSource(params: {
  label: string
  url: string
  category: QuickSourceCategory
  alsoWatch: boolean
}): QuickRecommendation {
  const domain = extractDomain(params.url).toLowerCase()
  const topics = new Set<string>()
  const tagGroups = new Set<string>()
  const notes: string[] = []

  if (params.category === 'company') {
    topics.add('競品追蹤')
    tagGroups.add('競品更新')
    notes.push('建議納入 competitor-sites 來源群組，適合追蹤 pricing、feature update、release note。')
    if (params.alsoWatch) notes.push('這次已同步加入追蹤網站，後續 collector 可直接納入固定巡檢。')
  }

  if (params.category === 'community') {
    topics.add('科技社群討論')
    tagGroups.add('科技情報')
    notes.push('社群型網站較適合搭配 Dcard / PTT / Mobile01 一起觀察討論脈絡。')
  }

  if (params.category === 'social') {
    topics.add('社群訊號追蹤')
    tagGroups.add('社群觀測')
    notes.push('社群平台通常需要可行性檢查，先觀察搜尋命中率再決定是否做 native adapter。')
  }

  if (params.category === 'developer') {
    topics.add('開發者工具動態')
    tagGroups.add('開發者情報')
  }

  if (params.category === 'model-platform') {
    topics.add('模型平台追蹤')
    tagGroups.add('模型情報')
  }

  if (domain.includes('github.com')) {
    topics.add('開發者工具動態')
    tagGroups.add('開發者情報')
  }
  if (domain.includes('huggingface.co')) {
    topics.add('模型平台追蹤')
    tagGroups.add('模型情報')
  }
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    topics.add('影片情報追蹤')
    tagGroups.add('影音案例')
  }

  return {
    title: `已為來源「${params.label}」產生後續建議`,
    summary: '你先填名稱、網址、分類就好；topic 與 tag group 我先幫你推一版。',
    topics: Array.from(topics),
    tagGroups: Array.from(tagGroups),
    notes,
  }
}

function inferRecommendationsForAccount(params: {
  label: string
  source: string
  linkedSiteLabel?: string
  linkedDomain?: string
}): QuickRecommendation {
  const source = params.source.toLowerCase()
  const topics = new Set<string>()
  const tagGroups = new Set<string>()
  const notes: string[] = []

  if (['threads', 'instagram', 'twitter'].includes(source)) {
    topics.add('社群訊號追蹤')
    tagGroups.add('社群觀測')
  }
  if (['weibo', 'wechat-official'].includes(source)) {
    topics.add('中文社群訊號')
    tagGroups.add('中文市場情報')
  }
  if (source === 'github') {
    topics.add('開發者工具動態')
    tagGroups.add('開發者情報')
  }
  if (source === 'youtube') {
    topics.add('影片情報追蹤')
    tagGroups.add('影音案例')
  }
  if (source === 'reddit') {
    topics.add('科技社群討論')
    tagGroups.add('科技情報')
  }

  if (params.linkedSiteLabel) {
    topics.add('競品追蹤')
    tagGroups.add('競品更新')
    notes.push(`已自動連到追蹤網站「${params.linkedSiteLabel}」${params.linkedDomain ? `（${params.linkedDomain}）` : ''}，後續可視為同一個競品追蹤群組。`)
  } else {
    notes.push('若這是競品官方帳號，建議另外補一個對應官網到追蹤網站。')
  }

  return {
    title: `已為追蹤帳號「${params.label}」產生後續建議`,
    summary: '帳號來源已自動推測完成，下面是比較適合一起掛上的 topic 與 tag group。',
    topics: Array.from(topics),
    tagGroups: Array.from(tagGroups),
    notes,
  }
}

function inferRecommendationsForWatchSite(params: { label: string; url: string }): QuickRecommendation {
  const domain = extractDomain(params.url).toLowerCase()
  const topics = new Set<string>()
  const tagGroups = new Set<string>()
  const notes: string[] = []

  topics.add('競品追蹤')
  tagGroups.add('競品更新')

  if (domain.includes('docs') || params.label.includes('文件')) {
    topics.add('官方文件追蹤')
    tagGroups.add('文件更新')
  }

  if (domain.includes('huggingface.co') || domain.includes('github.com')) {
    topics.add('開發者工具動態')
    tagGroups.add('開發者情報')
  }

  notes.push('若這個網站需要固定巡檢，建議保留在 watch sites，並搭配週期性 collector。')

  return {
    title: `已為追蹤網站「${params.label}」產生後續建議`,
    summary: '固定網站最適合搭配 watch + topic/tag group 雙層追蹤。',
    topics: Array.from(topics),
    tagGroups: Array.from(tagGroups),
    notes,
  }
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed')
  }
  return data
}

function sectionBadge(label: string, value: string) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
      {label}: {value}
    </span>
  )
}

function SourceCard({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: SearchSourceItem
  index: number
  onChange: (next: SearchSourceItem) => void
  onRemove: () => void
}) {
  const domainSummary = item.domains?.length ? item.domains.join(', ') : '未設定 domain'
  const statusTone = item.enabled ?? true ? 'text-emerald-200' : 'text-neutral-400'

  return (
    <details className="group rounded-2xl border border-white/10 bg-black/20 p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 marker:content-none">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-100">{item.label || `來源 #${index + 1}`}</span>
            <span className={`rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] ${statusTone}`}>
              {item.enabled ?? true ? '啟用中' : '已停用'}
            </span>
            {item.category ? (
              <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-100">
                {item.category}
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-xs text-neutral-400">{domainSummary}</div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {item.adapter ? (
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-cyan-100">
                {item.adapter}
              </span>
            ) : null}
            {item.search_mode ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-neutral-300">
                {item.search_mode}
              </span>
            ) : null}
            {item.strict_domain_filter ? (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-emerald-100">
                strict
              </span>
            ) : null}
            {item.supports_deep_fetch ? (
              <span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-2 py-1 text-amber-100">
                deep fetch
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 group-open:hidden">展開細節</span>
          <span className="hidden text-xs text-neutral-500 group-open:inline">收起細節</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onRemove()
            }}
            className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-100 transition hover:bg-rose-500/20"
          >
            移除
          </button>
        </div>
      </summary>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">ID</div>
          <input
            value={item.id}
            onChange={(event) => onChange({ ...item, id: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Label</div>
          <input
            value={item.label}
            onChange={(event) => onChange({ ...item, label: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Category</div>
          <input
            value={item.category || ''}
            onChange={(event) => onChange({ ...item, category: event.target.value || undefined })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Adapter</div>
          <input
            value={item.adapter || ''}
            onChange={(event) => onChange({ ...item, adapter: event.target.value || undefined })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Search Mode</div>
          <input
            value={item.search_mode || ''}
            onChange={(event) => onChange({ ...item, search_mode: event.target.value || undefined })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Priority</div>
          <input
            value={item.priority || ''}
            onChange={(event) => onChange({ ...item, priority: event.target.value || undefined })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
      </div>

      <label className="mt-3 block text-sm">
        <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Domains</div>
        <input
          value={joinCsv(item.domains)}
          onChange={(event) => onChange({ ...item, domains: splitCsv(event.target.value) })}
          placeholder="github.com, api.github.com"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
        />
      </label>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">
          <input
            type="checkbox"
            checked={item.enabled ?? true}
            onChange={(event) => onChange({ ...item, enabled: event.target.checked })}
          />
          Enabled
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">
          <input
            type="checkbox"
            checked={item.strict_domain_filter ?? false}
            onChange={(event) => onChange({ ...item, strict_domain_filter: event.target.checked })}
          />
          Strict Filter
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">
          <input
            type="checkbox"
            checked={item.supports_deep_fetch ?? false}
            onChange={(event) => onChange({ ...item, supports_deep_fetch: event.target.checked })}
          />
          Deep Fetch
        </label>
      </div>
    </details>
  )
}

function TopicCard({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: SearchTopicItem
  index: number
  onChange: (next: SearchTopicItem) => void
  onRemove: () => void
}) {
  const keywordSummary = item.keywords?.length ? item.keywords.slice(0, 4).join('、') : '尚未設定關鍵字'
  return (
    <details className="group rounded-2xl border border-white/10 bg-black/20 p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 marker:content-none">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-100">{item.label || `主題 #${index + 1}`}</span>
            {item.default_level ? (
              <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-100">
                {item.default_level}
              </span>
            ) : null}
            {item.default_mode ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-neutral-300">
                {item.default_mode}
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-xs text-neutral-400">{keywordSummary}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 group-open:hidden">展開細節</span>
          <span className="hidden text-xs text-neutral-500 group-open:inline">收起細節</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onRemove()
            }}
            className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-100 transition hover:bg-rose-500/20"
          >
            移除
          </button>
        </div>
      </summary>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">ID</div>
          <input
            value={item.id}
            onChange={(event) => onChange({ ...item, id: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Label</div>
          <input
            value={item.label}
            onChange={(event) => onChange({ ...item, label: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Default Level</div>
          <input
            value={item.default_level || ''}
            onChange={(event) => onChange({ ...item, default_level: event.target.value || undefined })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Default Mode</div>
          <input
            value={item.default_mode || ''}
            onChange={(event) => onChange({ ...item, default_mode: event.target.value || undefined })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Keywords</div>
          <input
            value={joinCsv(item.keywords)}
            onChange={(event) => onChange({ ...item, keywords: splitCsv(event.target.value) })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Suggested Sources</div>
          <input
            value={joinCsv(item.suggested_sources)}
            onChange={(event) => onChange({ ...item, suggested_sources: splitCsv(event.target.value) })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Time Range Days</div>
          <input
            type="number"
            value={item.default_time_range_days ?? ''}
            onChange={(event) =>
              onChange({
                ...item,
                default_time_range_days: event.target.value ? Number(event.target.value) : undefined,
              })
            }
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
      </div>
    </details>
  )
}

function TagGroupCard({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: SearchTagGroupItem
  index: number
  onChange: (next: SearchTagGroupItem) => void
  onRemove: () => void
}) {
  const tagSummary = item.tags?.length ? item.tags.slice(0, 5).join('、') : '尚未設定 tags'
  return (
    <details className="group rounded-2xl border border-white/10 bg-black/20 p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 marker:content-none">
        <div className="min-w-0">
          <div className="text-sm font-medium text-neutral-100">{item.label || `Tag Group #${index + 1}`}</div>
          <div className="mt-2 text-xs text-neutral-400">{tagSummary}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 group-open:hidden">展開細節</span>
          <span className="hidden text-xs text-neutral-500 group-open:inline">收起細節</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onRemove()
            }}
            className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-100 transition hover:bg-rose-500/20"
          >
            移除
          </button>
        </div>
      </summary>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">ID</div>
          <input
            value={item.id}
            onChange={(event) => onChange({ ...item, id: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Label</div>
          <input
            value={item.label}
            onChange={(event) => onChange({ ...item, label: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
      </div>

      <label className="mt-3 block text-sm">
        <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Tags</div>
        <input
          value={joinCsv(item.tags)}
          onChange={(event) => onChange({ ...item, tags: splitCsv(event.target.value) })}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
        />
      </label>
    </details>
  )
}

function WatchAccountCard({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: WatchAccountItem
  index: number
  onChange: (next: WatchAccountItem) => void
  onRemove: () => void
}) {
  const summary = item.query || item.source
  return (
    <details className="group rounded-2xl border border-white/10 bg-black/20 p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 marker:content-none">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-100">{item.label || `追蹤帳號 #${index + 1}`}</span>
            <span className={`rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] ${(item.enabled ?? true) ? 'text-emerald-200' : 'text-neutral-400'}`}>
              {(item.enabled ?? true) ? '啟用中' : '已停用'}
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-100">
              {item.source}
            </span>
            {item.linkedSiteLabel ? (
              <span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100">
                關聯官網：{String(item.linkedSiteLabel)}
              </span>
            ) : null}
          </div>
          <div className="mt-2 truncate text-xs text-neutral-400">{summary}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 group-open:hidden">展開細節</span>
          <span className="hidden text-xs text-neutral-500 group-open:inline">收起細節</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onRemove()
            }}
            className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-100 transition hover:bg-rose-500/20"
          >
            移除
          </button>
        </div>
      </summary>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Label</div>
          <input
            value={item.label}
            onChange={(event) => onChange({ ...item, label: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Source</div>
          <input
            value={item.source}
            onChange={(event) => onChange({ ...item, source: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
      </div>
      <label className="mt-3 block text-sm">
        <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Query</div>
        <input
          value={item.query}
          onChange={(event) => onChange({ ...item, query: event.target.value })}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
        />
      </label>
      {item.linkedSiteLabel || item.linkedDomain ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Linked Site</div>
            <input
              value={String(item.linkedSiteLabel || '')}
              onChange={(event) => onChange({ ...item, linkedSiteLabel: event.target.value || undefined })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
            />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Linked Domain</div>
            <input
              value={String(item.linkedDomain || '')}
              onChange={(event) => onChange({ ...item, linkedDomain: event.target.value || undefined })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
            />
          </label>
        </div>
      ) : null}
      <label className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">
        <input
          type="checkbox"
          checked={item.enabled ?? true}
          onChange={(event) => onChange({ ...item, enabled: event.target.checked })}
        />
        Enabled
      </label>
    </details>
  )
}

function WatchSiteCard({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: WatchSiteItem
  index: number
  onChange: (next: WatchSiteItem) => void
  onRemove: () => void
}) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-black/20 p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 marker:content-none">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-100">{item.label || `追蹤網站 #${index + 1}`}</span>
            <span className={`rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] ${(item.enabled ?? true) ? 'text-emerald-200' : 'text-neutral-400'}`}>
              {(item.enabled ?? true) ? '啟用中' : '已停用'}
            </span>
          </div>
          <div className="mt-2 truncate text-xs text-neutral-400">{item.site || '尚未設定網址'}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 group-open:hidden">展開細節</span>
          <span className="hidden text-xs text-neutral-500 group-open:inline">收起細節</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onRemove()
            }}
            className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-100 transition hover:bg-rose-500/20"
          >
            移除
          </button>
        </div>
      </summary>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Label</div>
          <input
            value={item.label}
            onChange={(event) => onChange({ ...item, label: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Site</div>
          <input
            value={item.site}
            onChange={(event) => onChange({ ...item, site: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-400/40"
          />
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">
        <input
          type="checkbox"
          checked={item.enabled ?? true}
          onChange={(event) => onChange({ ...item, enabled: event.target.checked })}
        />
        Enabled
      </label>
    </details>
  )
}

export default function SearchIntelAdmin() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<SearchIntelSnapshot | null>(null)
  const [sources, setSources] = useState<SearchSourceItem[]>([])
  const [topics, setTopics] = useState<SearchTopicItem[]>([])
  const [tagGroups, setTagGroups] = useState<SearchTagGroupItem[]>([])
  const [watchAccounts, setWatchAccounts] = useState<WatchAccountItem[]>([])
  const [watchSites, setWatchSites] = useState<WatchSiteItem[]>([])
  const [runProvider, setRunProvider] = useState<CollectorProvider>('auto')
  const [runLimitTags, setRunLimitTags] = useState<string>('1')
  const [runLimitSources, setRunLimitSources] = useState<string>('1')
  const [runFilter, setRunFilter] = useState<'all' | 'errors'>('all')
  const [hybridQuery, setHybridQuery] = useState('比較 GitHub 和 Reddit 對 AI agent 的趨勢差異')
  const [hybridSources, setHybridSources] = useState('github, reddit')
  const [hybridTopics, setHybridTopics] = useState('ai-agent-trends')
  const [hybridNeedComparison, setHybridNeedComparison] = useState(true)
  const [hybridNeedStrategy, setHybridNeedStrategy] = useState(false)
  const [hybridRequiresDeepFetch, setHybridRequiresDeepFetch] = useState(false)
  const [hybridSkipCloud, setHybridSkipCloud] = useState(true)
  const [hybridMaxResults, setHybridMaxResults] = useState('5')
  const [hybridFetchPages, setHybridFetchPages] = useState('2')
  const [lastHybridResult, setLastHybridResult] = useState<HybridRunResult | null>(null)
  const [artifactDetails, setArtifactDetails] = useState<ArtifactDetailState>({})
  const [quickSourceLabel, setQuickSourceLabel] = useState('')
  const [quickSourceUrl, setQuickSourceUrl] = useState('')
  const [quickSourceCategory, setQuickSourceCategory] = useState<QuickSourceCategory>('company')
  const [quickSourceAlsoWatch, setQuickSourceAlsoWatch] = useState(true)
  const [quickAccountLabel, setQuickAccountLabel] = useState('')
  const [quickAccountUrl, setQuickAccountUrl] = useState('')
  const [quickWatchSiteLabel, setQuickWatchSiteLabel] = useState('')
  const [quickWatchSiteUrl, setQuickWatchSiteUrl] = useState('')
  const [quickTopicLabel, setQuickTopicLabel] = useState('')
  const [quickTagGroupLabel, setQuickTagGroupLabel] = useState('')
  const [quickRecommendation, setQuickRecommendation] = useState<QuickRecommendation | null>(null)
  const [mergeOutcome, setMergeOutcome] = useState<MergeOutcome | null>(null)
  const [hybridRunActions, setHybridRunActions] = useState<HybridRunActionState>({})
  const [agentReachRefreshing, setAgentReachRefreshing] = useState(false)
  const [prefillApplied, setPrefillApplied] = useState(false)
  const mergeSuggestions = useMemo(
    () => buildMergeSuggestions(snapshot?.collector?.watchGroups || []),
    [snapshot?.collector?.watchGroups]
  )
  const agentReachStatus = snapshot?.collector?.toolingStatus?.agentReach
  const agentReachIssues = useMemo(() => buildAgentReachIssues(agentReachStatus?.warnings || []), [agentReachStatus?.warnings])
  const needsGithubLogin = useMemo(() => agentReachIssues.some((issue) => issue.requiresLogin), [agentReachIssues])
  const agentReachAllGreen = Boolean(
    agentReachStatus &&
      agentReachStatus.ok &&
      (agentReachStatus.availableChannels ?? 0) > 0 &&
      agentReachStatus.availableChannels === agentReachStatus.totalChannels &&
      agentReachIssues.length === 0 &&
      !agentReachStatus.error
  )

  function prepareWatchGroupInvestigation(
    group: WatchGroupItem,
    hitUrl?: string
  ) {
    const query = hitUrl ? `${buildWatchGroupQuery(group)}，並優先分析 ${hitUrl}` : buildWatchGroupQuery(group)
    setHybridQuery(query)
    setHybridSources(inferSourcesForWatchGroup(group).join(', '))
    setHybridTopics(inferTopicsForWatchGroup(group).join(', '))
    setHybridNeedComparison(false)
    setHybridNeedStrategy(true)
    setHybridRequiresDeepFetch(Boolean(hitUrl))
    setHybridSkipCloud(true)
    setNotice(`已把 ${compactValue(group.trackingGroup) || compactValue(group.linkedDomain) || 'watch group'} 帶入 Hybrid Pipeline。`)
  }

  function prepareHybridRunInvestigation(run: SearchIntelSnapshot['hybridRuns'][number]) {
    setHybridQuery(run.query)
    setHybridSources(run.sources.join(', '))
    setHybridTopics(run.topics.join(', '))
    setHybridNeedComparison(Boolean(run.need_comparison))
    setHybridNeedStrategy(Boolean(run.need_strategy))
    setHybridRequiresDeepFetch(Boolean(run.requires_deep_fetch))
    setHybridSkipCloud(Boolean(run.skip_cloud))
    setNotice('已把這筆混合研究紀錄帶回 Hybrid Pipeline，可直接微調後重跑。')
    setHybridRunActions((current) => ({
      ...current,
      [run.id]: { ...current[run.id], investigated: true },
    }))
  }

  function buildTrackingBundleHrefFromHybridRun(run: SearchIntelSnapshot['hybridRuns'][number]) {
    const firstSourceId = run.sources.find(Boolean)
    const firstTopicId = run.topics.find(Boolean)
    const matchedSource = firstSourceId ? sources.find((item) => item.id === firstSourceId) : undefined
    const matchedTopic = firstTopicId ? topics.find((item) => item.id === firstTopicId || item.label === firstTopicId) : undefined
    const sourceLabel = compactValue(matchedSource?.label || firstSourceId)
    const sourceUrl = matchedSource?.domains?.[0] ? `https://${matchedSource.domains[0]}` : ''
    const topicLabel = compactValue(matchedTopic?.label || firstTopicId)
    const matchedTagGroup = tagGroups.find((group) => {
      const tags = Array.isArray(group.tags) ? group.tags : []
      return tags.includes(firstTopicId || '') || tags.includes(topicLabel)
    })
    const tagGroupLabel = compactValue(matchedTagGroup?.label)
    const bundleLabel = sourceLabel || topicLabel || '混合研究追蹤'

    return buildSearchIntelPrefillHref('tracking-bundle', {
      sourceLabel: sourceLabel || bundleLabel,
      sourceUrl,
      sourceCategory: compactValue(matchedSource?.category) || 'community',
      watchSiteLabel: sourceLabel ? `${sourceLabel} 追蹤` : '',
      watchSiteUrl: sourceUrl,
      topic: topicLabel,
      tagGroup: tagGroupLabel,
      alsoWatch: sourceUrl ? 'true' : 'false',
    })
  }

  async function createHybridRunTask(run: SearchIntelSnapshot['hybridRuns'][number]) {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/hub/hybrid-run-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: run.query,
          sources: run.sources,
          topics: run.topics,
          classificationLevel: run.classification_level,
          classificationRoute: run.classification_route,
          createdAt: run.created_at,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Hybrid Run 建卡失敗')
      }
      setHybridRunActions((current) => ({
        ...current,
        [run.id]: {
          ...current[run.id],
          taskId: payload.taskId ?? null,
          taskMessage: payload.duplicate ? `已存在任務 #${payload.taskId}` : `已建立任務 #${payload.taskId}`,
          taskStatus: payload.status ?? (payload.taskId ? '待執行' : current[run.id]?.taskStatus ?? null),
        },
      }))
      setNotice(payload.duplicate ? `這筆混合研究已存在任務 #${payload.taskId}。` : `已為這筆混合研究建立任務 #${payload.taskId}。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hybrid Run 建卡失敗')
    } finally {
      setBusy(false)
    }
  }

  async function investigateWatchGroup(
    group: WatchGroupItem,
    hitUrl?: string
  ) {
    const query = hitUrl ? `${buildWatchGroupQuery(group)}，並優先分析 ${hitUrl}` : buildWatchGroupQuery(group)
    const runSources = inferSourcesForWatchGroup(group)
    const runTopics = inferTopicsForWatchGroup(group)

    setHybridQuery(query)
    setHybridSources(runSources.join(', '))
    setHybridTopics(runTopics.join(', '))
    setHybridNeedComparison(false)
    setHybridNeedStrategy(true)
    setHybridRequiresDeepFetch(Boolean(hitUrl))
    setHybridSkipCloud(true)

    setBusy(true)
    setError(null)
    setNotice(null)

    try {
      const data = await parseResponse(
        await fetch('/api/hub/search-intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'run_hybrid',
            provider: runProvider,
            query,
            sources: runSources,
            topics: runTopics,
            needComparison: false,
            needStrategy: true,
            requiresDeepFetch: Boolean(hitUrl),
            skipCloud: true,
            maxResults: Number(hybridMaxResults) || undefined,
            fetchPages: Number(hybridFetchPages) || undefined,
          }),
        })
      )

      setSnapshot(data.snapshot)
      setSources(Array.isArray(data.snapshot?.sources) ? data.snapshot.sources : [])
      setTopics(Array.isArray(data.snapshot?.topics) ? data.snapshot.topics : [])
      setTagGroups(Array.isArray(data.snapshot?.tagGroups) ? data.snapshot.tagGroups : [])
      setWatchAccounts(Array.isArray(data.snapshot?.watchlist?.accounts) ? data.snapshot.watchlist.accounts : [])
      setWatchSites(Array.isArray(data.snapshot?.watchlist?.sites) ? data.snapshot.watchlist.sites : [])
      setLastHybridResult(data.result || null)
      setNotice(`已完成 ${compactValue(group.trackingGroup) || compactValue(group.linkedDomain) || 'watch group'} 的快速追查。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '追查失敗')
    } finally {
      setBusy(false)
    }
  }

  async function rerunWatchGroupCollector(group: WatchGroupItem) {
    const watchGroup = compactValue(group.trackingGroup) || compactValue(group.linkedDomain) || ''
    if (!watchGroup) {
      setError('缺少 watch group 識別，暫時無法重跑。')
      return
    }

    setBusy(true)
    setError(null)
    setNotice(null)

    try {
      const data = await parseResponse(
        await fetch('/api/hub/search-intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'run_collector',
            provider: runProvider,
            watchGroup,
            limitSources: Number(runLimitSources) || undefined,
          }),
        })
      )
      setSnapshot(data.snapshot)
      setSources(Array.isArray(data.snapshot?.sources) ? data.snapshot.sources : [])
      setTopics(Array.isArray(data.snapshot?.topics) ? data.snapshot.topics : [])
      setTagGroups(Array.isArray(data.snapshot?.tagGroups) ? data.snapshot.tagGroups : [])
      setWatchAccounts(Array.isArray(data.snapshot?.watchlist?.accounts) ? data.snapshot.watchlist.accounts : [])
      setWatchSites(Array.isArray(data.snapshot?.watchlist?.sites) ? data.snapshot.watchlist.sites : [])
      setNotice(`已重跑 ${watchGroup} 的 watch group collector。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'watch group collector 重跑失敗')
    } finally {
      setBusy(false)
    }
  }

  async function loadSnapshot() {
    setLoading(true)
    setError(null)
    try {
      const data = await parseResponse(await fetch('/api/hub/search-intel', { cache: 'no-store' }))
      setSnapshot(data)
      setSources(Array.isArray(data.sources) ? data.sources : [])
      setTopics(Array.isArray(data.topics) ? data.topics : [])
      setTagGroups(Array.isArray(data.tagGroups) ? data.tagGroups : [])
      setWatchAccounts(Array.isArray(data.watchlist?.accounts) ? data.watchlist.accounts : [])
      setWatchSites(Array.isArray(data.watchlist?.sites) ? data.watchlist.sites : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '讀取失敗')
    } finally {
      setLoading(false)
    }
  }

  async function refreshAgentReachWatch() {
    setAgentReachRefreshing(true)
    setError(null)
    try {
      const data = await parseResponse(
        await fetch('/api/hub/search-intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'agent_reach_watch' }),
        })
      )
      setSnapshot((current) =>
        current
          ? {
              ...current,
              collector: current.collector
                ? {
                    ...current.collector,
                    toolingStatus: {
                      ...(current.collector.toolingStatus || {}),
                      agentReach: data.result,
                    },
                  }
                : current.collector,
            }
          : current
      )
      setNotice('已重新檢查 Agent Reach 狀態。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '重新檢查 Agent Reach 失敗')
    } finally {
      setAgentReachRefreshing(false)
    }
  }

  useEffect(() => {
    if (!agentReachStatus || agentReachRefreshing) return
    const hasWarnings = (agentReachStatus.warnings || []).length > 0
    const incomplete = (agentReachStatus.availableChannels ?? 0) < (agentReachStatus.totalChannels ?? 0)
    if (!hasWarnings && !incomplete) return
    const timer = window.setTimeout(() => {
      void refreshAgentReachWatch()
    }, 800)
    return () => window.clearTimeout(timer)
  }, [agentReachStatus, agentReachRefreshing])

  useEffect(() => {
    if (prefillApplied) return
    const mode = compactValue(searchParams.get('prefill')) as PrefillMode
    const label = compactValue(searchParams.get('label'))
    const url = compactValue(searchParams.get('url'))
    const category = compactValue(searchParams.get('category'))
    const topic = compactValue(searchParams.get('topic'))
    const tagGroup = compactValue(searchParams.get('tagGroup'))
    const sourceLabel = compactValue(searchParams.get('sourceLabel'))
    const sourceUrl = compactValue(searchParams.get('sourceUrl'))
    const sourceCategory = compactValue(searchParams.get('sourceCategory'))
    const accountLabel = compactValue(searchParams.get('accountLabel'))
    const accountUrl = compactValue(searchParams.get('accountUrl'))
    const watchSiteLabel = compactValue(searchParams.get('watchSiteLabel'))
    const watchSiteUrl = compactValue(searchParams.get('watchSiteUrl'))
    const autoWatch = compactValue(searchParams.get('alsoWatch'))

    if (!mode) return

    if (mode === 'tracking-bundle') {
      let touched = false

      if (sourceLabel && sourceUrl) {
        setQuickSourceLabel(sourceLabel)
        setQuickSourceUrl(sourceUrl)
        if (sourceCategory && ['community', 'social', 'company', 'developer', 'model-platform'].includes(sourceCategory)) {
          setQuickSourceCategory(sourceCategory as QuickSourceCategory)
        }
        if (autoWatch) {
          setQuickSourceAlsoWatch(!['0', 'false', 'no'].includes(autoWatch.toLowerCase()))
        }
        touched = true
      }

      if (accountLabel && accountUrl) {
        setQuickAccountLabel(accountLabel)
        setQuickAccountUrl(accountUrl)
        touched = true
      }

      if (watchSiteLabel && watchSiteUrl) {
        setQuickWatchSiteLabel(watchSiteLabel)
        setQuickWatchSiteUrl(watchSiteUrl)
        touched = true
      }

      if (topic) {
        setQuickTopicLabel(topic)
        touched = true
      }

      if (tagGroup) {
        setQuickTagGroupLabel(tagGroup)
        touched = true
      }

      if (touched) {
        setNotice('已帶入完整追蹤預填。你可以一次補齊來源、帳號、追蹤網站、主題與 Tag Group，再依需要逐一快速新增。')
        setPrefillApplied(true)
      }
      return
    }

    if (mode === 'source' && label && url) {
      setQuickSourceLabel(label)
      setQuickSourceUrl(url)
      if (category && ['community', 'social', 'company', 'developer', 'model-platform'].includes(category)) {
        setQuickSourceCategory(category as QuickSourceCategory)
      }
      setQuickSourceAlsoWatch(true)
      setNotice(`已帶入來源預填：「${label}」。確認後可直接按快速新增來源。`)
      setPrefillApplied(true)
      return
    }

    if (mode === 'account' && label && url) {
      setQuickAccountLabel(label)
      setQuickAccountUrl(url)
      setNotice(`已帶入追蹤帳號預填：「${label}」。確認後可直接按快速新增帳號。`)
      setPrefillApplied(true)
      return
    }

    if (mode === 'watch-site' && label && url) {
      setQuickWatchSiteLabel(label)
      setQuickWatchSiteUrl(url)
      setNotice(`已帶入追蹤網站預填：「${label}」。確認後可直接按快速新增網站。`)
      setPrefillApplied(true)
      return
    }

    if (mode === 'topic' && topic) {
      setQuickTopicLabel(topic)
      setNotice(`已帶入主題預填：「${topic}」。確認後可直接按快速新增主題。`)
      setPrefillApplied(true)
      return
    }

    if (mode === 'tag-group' && tagGroup) {
      setQuickTagGroupLabel(tagGroup)
      setNotice(`已帶入 Tag Group 預填：「${tagGroup}」。確認後可直接按快速新增 Tag Group。`)
      setPrefillApplied(true)
    }
  }, [prefillApplied, searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('search-intel-hybrid-run-actions')
      if (raw) {
        setHybridRunActions(JSON.parse(raw) as HybridRunActionState)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('search-intel-hybrid-run-actions', JSON.stringify(hybridRunActions))
    } catch {
      // ignore
    }
  }, [hybridRunActions])

  useEffect(() => {
    const taskIds = Array.from(
      new Set(
        Object.values(hybridRunActions)
          .map((item) => item.taskId)
          .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      )
    )
    if (!taskIds.length) return

    const controller = new AbortController()

    ;(async () => {
      try {
        const response = await fetch(`/api/hub/task-statuses?ids=${taskIds.join(',')}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const data = await parseResponse(response)
        const tasks = Array.isArray(data.tasks) ? data.tasks : []
        const taskMap = new Map<number, { status?: string | null; updated_at?: string | null; result?: string | null }>(
          tasks.map((task: { id: number; status?: string | null; updated_at?: string | null; result?: string | null }) => [
            task.id,
            task,
          ])
        )

        setHybridRunActions((current) => {
          let changed = false
          const nextEntries = Object.entries(current).map(([runId, item]) => {
            if (typeof item.taskId !== 'number') return [runId, item] as const
            const task = taskMap.get(item.taskId)
            if (!task) return [runId, item] as const
            const nextItem = {
              ...item,
              taskStatus: task.status ?? item.taskStatus ?? null,
              taskUpdatedAt: task.updated_at ?? item.taskUpdatedAt ?? null,
              taskResult: compactValue(task.result) || item.taskResult || null,
            }
            if (
              nextItem.taskStatus !== item.taskStatus ||
              nextItem.taskUpdatedAt !== item.taskUpdatedAt ||
              nextItem.taskResult !== item.taskResult
            ) {
              changed = true
            }
            return [runId, nextItem] as const
          })
          return changed ? Object.fromEntries(nextEntries) : current
        })
      } catch (error) {
        if (controller.signal.aborted) return
      }
    })()

    return () => controller.abort()
  }, [hybridRunActions])

  useEffect(() => {
    void loadSnapshot()
  }, [])

  const stats = useMemo(
    () => ({
      sources: sources.length,
      topics: topics.length,
      tagGroups: tagGroups.length,
      accounts: watchAccounts.length,
      sites: watchSites.length,
    }),
    [sources, topics, tagGroups, watchAccounts, watchSites]
  )

  const filteredCollectorRuns = useMemo(() => {
    const runs = snapshot?.collectorRuns || []
    return runFilter === 'errors' ? runs.filter((run) => run.errors_count > 0 || run.status !== 'ok') : runs
  }, [snapshot?.collectorRuns, runFilter])

  async function persistConfig(options?: {
    nextSources?: SearchSourceItem[]
    nextTopics?: SearchTopicItem[]
    nextTagGroups?: SearchTagGroupItem[]
    nextWatchAccounts?: WatchAccountItem[]
    nextWatchSites?: WatchSiteItem[]
    noticeMessage?: string
  }): Promise<SearchIntelSnapshot | null> {
    setBusy(true)
    setError(null)
    setNotice(null)

    try {
      const nextSources = options?.nextSources || sources
      const nextTopics = options?.nextTopics || topics
      const nextTagGroups = options?.nextTagGroups || tagGroups
      const nextWatchAccounts = options?.nextWatchAccounts || watchAccounts
      const nextWatchSites = options?.nextWatchSites || watchSites
      const payload = {
        sources: nextSources,
        topics: nextTopics,
        tagGroups: nextTagGroups,
        watchlist: {
          accounts: nextWatchAccounts,
          sites: nextWatchSites,
        },
      }

      const data = await parseResponse(
        await fetch('/api/hub/search-intel', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      )

      setSnapshot(data.snapshot)
      setSources(Array.isArray(data.snapshot?.sources) ? data.snapshot.sources : [])
      setTopics(Array.isArray(data.snapshot?.topics) ? data.snapshot.topics : [])
      setTagGroups(Array.isArray(data.snapshot?.tagGroups) ? data.snapshot.tagGroups : [])
      setWatchAccounts(Array.isArray(data.snapshot?.watchlist?.accounts) ? data.snapshot.watchlist.accounts : [])
      setWatchSites(Array.isArray(data.snapshot?.watchlist?.sites) ? data.snapshot.watchlist.sites : [])
      setNotice(options?.noticeMessage || '已儲存到資料庫，並同步回 JSON mirror。')
      return data.snapshot || null
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function saveAll() {
    await persistConfig()
  }

  async function mergeWatchGroups(primary: WatchGroupItem, secondary: WatchGroupItem, rerun = false) {
    const primaryName = compactValue(primary.trackingGroup) || compactValue(primary.linkedDomain) || '主群組'
    const secondaryName = compactValue(secondary.trackingGroup) || compactValue(secondary.linkedDomain) || '副群組'
    const currentCollectorRuns = snapshot?.collectorRuns || []
    const before = summarizeWatchGroupHealth({ group: primary, collectorRuns: currentCollectorRuns })
    const primaryIdentifiers = buildGroupIdentifiers(primary)
    const secondaryIdentifiers = buildGroupIdentifiers(secondary)
    const canonical = pickCanonicalGroupMeta(primary, secondary)

    const nextWatchAccounts = watchAccounts.map((item) => {
      if (matchesGroupAccount(item, secondaryIdentifiers) || matchesGroupAccount(item, primaryIdentifiers)) {
        return {
          ...item,
          trackingGroup: canonical.trackingGroup,
          linkedDomain: canonical.linkedDomain || item.linkedDomain,
          linkedSiteLabel: canonical.linkedSiteLabel || item.linkedSiteLabel,
        }
      }
      return item
    })

    const nextWatchSites = watchSites.map((item) => {
      if (matchesGroupSite(item, secondaryIdentifiers) || matchesGroupSite(item, primaryIdentifiers)) {
        return {
          ...item,
          trackingGroup: canonical.trackingGroup,
          linkedDomain: canonical.linkedDomain || item.linkedDomain,
          linkedSiteLabel: canonical.linkedSiteLabel || item.linkedSiteLabel,
          category: item.category || (canonical.linkedDomain ? 'competitor_or_company_site' : item.category),
        }
      }
      return item
    })

    const savedSnapshot = await persistConfig({
      nextWatchAccounts,
      nextWatchSites,
      noticeMessage: rerun
        ? `已把 ${secondaryName} 併入 ${primaryName}，先同步 metadata，接著重跑群組收集。`
        : `已把 ${secondaryName} 併入 ${primaryName}，並同步更新 watchlist metadata。`,
    })

    let finalSnapshot = savedSnapshot
    if (rerun) {
      const mergedGroup: WatchGroupItem = {
        ...primary,
        trackingGroup: canonical.trackingGroup,
        linkedDomain: canonical.linkedDomain || primary.linkedDomain || secondary.linkedDomain,
      }
      const watchGroup = compactValue(mergedGroup.trackingGroup) || compactValue(mergedGroup.linkedDomain) || ''
      if (watchGroup) {
        setBusy(true)
        setError(null)
        try {
          const data = await parseResponse(
            await fetch('/api/hub/search-intel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'run_collector',
                provider: runProvider,
                watchGroup,
                limitSources: Number(runLimitSources) || undefined,
              }),
            })
          )
          finalSnapshot = data.snapshot || finalSnapshot
          setSnapshot(data.snapshot)
          setSources(Array.isArray(data.snapshot?.sources) ? data.snapshot.sources : [])
          setTopics(Array.isArray(data.snapshot?.topics) ? data.snapshot.topics : [])
          setTagGroups(Array.isArray(data.snapshot?.tagGroups) ? data.snapshot.tagGroups : [])
          setWatchAccounts(Array.isArray(data.snapshot?.watchlist?.accounts) ? data.snapshot.watchlist.accounts : [])
          setWatchSites(Array.isArray(data.snapshot?.watchlist?.sites) ? data.snapshot.watchlist.sites : [])
          setNotice(`已把 ${secondaryName} 併入 ${primaryName}，並重跑 ${watchGroup} 的 watch group collector。`)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'watch group collector 重跑失敗')
        } finally {
          setBusy(false)
        }
      }
    }

    const mergedTrackingGroup = canonical.trackingGroup || primaryName
    const mergedLinkedDomain = canonical.linkedDomain || compactValue(primary.linkedDomain) || compactValue(secondary.linkedDomain)
    const mergedGroupFromSnapshot =
      finalSnapshot?.collector?.watchGroups?.find((group) => {
        const groupTracking = compactValue(group.trackingGroup)
        const groupDomain = compactValue(group.linkedDomain)
        return (mergedTrackingGroup && groupTracking === mergedTrackingGroup) || (mergedLinkedDomain && groupDomain === mergedLinkedDomain)
      }) ||
      ({
        ...primary,
        trackingGroup: mergedTrackingGroup,
        linkedDomain: mergedLinkedDomain,
      } as WatchGroupItem)

    const after = summarizeWatchGroupHealth({
      group: mergedGroupFromSnapshot,
      collectorRuns: finalSnapshot?.collectorRuns || currentCollectorRuns,
    })

    setMergeOutcome({
      primaryName,
      secondaryName,
      rerun,
      before,
      after,
    })
  }

  async function runAction(action: 'import' | 'export' | 'run_collector' | 'run_hybrid') {
    setBusy(true)
    setError(null)
    setNotice(null)

    try {
      const data = await parseResponse(
        await fetch('/api/hub/search-intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            provider: runProvider,
            limitTags: Number(runLimitTags) || undefined,
            limitSources: Number(runLimitSources) || undefined,
            query: hybridQuery,
            sources: splitCsv(hybridSources),
            topics: splitCsv(hybridTopics),
            needComparison: hybridNeedComparison,
            needStrategy: hybridNeedStrategy,
            requiresDeepFetch: hybridRequiresDeepFetch,
            skipCloud: hybridSkipCloud,
            maxResults: Number(hybridMaxResults) || undefined,
            fetchPages: Number(hybridFetchPages) || undefined,
          }),
        })
      )

      setSnapshot(data.snapshot)
      setSources(Array.isArray(data.snapshot?.sources) ? data.snapshot.sources : [])
      setTopics(Array.isArray(data.snapshot?.topics) ? data.snapshot.topics : [])
      setTagGroups(Array.isArray(data.snapshot?.tagGroups) ? data.snapshot.tagGroups : [])
      setWatchAccounts(Array.isArray(data.snapshot?.watchlist?.accounts) ? data.snapshot.watchlist.accounts : [])
      setWatchSites(Array.isArray(data.snapshot?.watchlist?.sites) ? data.snapshot.watchlist.sites : [])
      if (action === 'run_hybrid') {
        setLastHybridResult(data.result || null)
      }
      setNotice(
        action === 'import'
          ? '已把 JSON registry 匯入資料庫。'
          : action === 'export'
            ? '已把資料庫內容匯出回 JSON mirror。'
            : action === 'run_collector'
              ? '來源收集器已手動執行並刷新快照。'
              : 'Hybrid pipeline 已執行完成。'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗')
    } finally {
      setBusy(false)
    }
  }

  async function loadArtifact(artifactPath: string) {
    if (!artifactPath) return
    setArtifactDetails((current) => ({ ...current, [artifactPath]: { loading: true } }))
    try {
      const data = await parseResponse(
        await fetch('/api/hub/search-intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'read_artifact', path: artifactPath }),
        })
      )
      setArtifactDetails((current) => ({
        ...current,
        [artifactPath]: { content: data.content },
      }))
    } catch (err) {
      setArtifactDetails((current) => ({
        ...current,
        [artifactPath]: { error: err instanceof Error ? err.message : '讀取 artifact 失敗' },
      }))
    }
  }

  function addItem(kind: ListKind) {
    if (kind === 'sources') {
      setSources((current) => [
        ...current,
        {
          id: '',
          label: '',
          enabled: true,
          domains: [],
          search_mode: 'search_engine',
          strict_domain_filter: true,
          supports_deep_fetch: true,
        },
      ])
      return
    }

    if (kind === 'topics') {
      setTopics((current) => [
        ...current,
        {
          id: '',
          label: '',
          keywords: [],
          suggested_sources: [],
          default_level: 'L2',
          default_mode: 'local_first',
        },
      ])
      return
    }

    if (kind === 'tagGroups') {
      setTagGroups((current) => [
        ...current,
        {
          id: '',
          label: '',
          tags: [],
        },
      ])
      return
    }

    if (kind === 'accounts') {
      setWatchAccounts((current) => [
        ...current,
        {
          label: '',
          source: 'github',
          query: '',
          enabled: true,
        },
      ])
      return
    }

    setWatchSites((current) => [
      ...current,
      {
        label: '',
        site: '',
        enabled: true,
      },
    ])
  }

  function quickAddSource() {
    const label = quickSourceLabel.trim()
    const url = quickSourceUrl.trim()
    if (!label || !url) {
      setError('快速新增來源至少需要名稱與網址。')
      setNotice(null)
      return
    }

    const inferred = inferSourceDraft({
      label,
      url,
      category: quickSourceCategory,
    })

    setSources((current) => [...current, inferred])
    if (quickSourceAlsoWatch) {
      setWatchSites((current) => [
        ...current,
        {
          label,
          site: url,
          enabled: true,
          category: quickSourceCategory === 'company' ? 'competitor_or_company_site' : quickSourceCategory,
        },
      ])
    }

    setQuickSourceLabel('')
    setQuickSourceUrl('')
    setQuickSourceCategory('company')
    setQuickSourceAlsoWatch(true)
    setError(null)
    setQuickRecommendation(
      inferRecommendationsForSource({
        label: inferred.label,
        url,
        category: quickSourceCategory,
        alsoWatch: quickSourceAlsoWatch,
      })
    )
    setNotice(`已加入來源「${inferred.label}」，其他參數先由系統自動推測；你之後可展開卡片再微調。`)
  }

  function quickAddWatchAccount() {
    const label = quickAccountLabel.trim()
    const url = quickAccountUrl.trim()
    if (!label || !url) {
      setError('快速新增追蹤帳號需要帳號名稱與網址。')
      setNotice(null)
      return
    }

    const inferred = inferWatchAccountDraft({ label, url, watchSites })
    setWatchAccounts((current) => [...current, inferred])
    setQuickAccountLabel('')
    setQuickAccountUrl('')
    setError(null)
    setQuickRecommendation(
      inferRecommendationsForAccount({
        label: inferred.label,
        source: inferred.source,
        linkedSiteLabel: String(inferred.linkedSiteLabel || ''),
        linkedDomain: String(inferred.linkedDomain || ''),
      })
    )
    setNotice(`已加入追蹤帳號「${inferred.label}」，來源與 query 已先自動推測；需要時再展開卡片微調。`)
  }

  function quickAddWatchSite() {
    const label = quickWatchSiteLabel.trim()
    const url = quickWatchSiteUrl.trim()
    if (!label || !url) {
      setError('快速新增追蹤網站需要名稱與網址。')
      setNotice(null)
      return
    }

    const inferred = inferWatchSiteDraft({ label, url })
    setWatchSites((current) => [...current, inferred])
    setQuickWatchSiteLabel('')
    setQuickWatchSiteUrl('')
    setError(null)
    setQuickRecommendation(inferRecommendationsForWatchSite({ label: inferred.label, url }))
    setNotice(`已加入追蹤網站「${inferred.label}」，之後若需要再展開卡片微調即可。`)
  }

  function quickAddTopic() {
    const label = quickTopicLabel.trim()
    if (!label) {
      setError('快速新增主題至少需要主題名稱。')
      setNotice(null)
      return
    }
    const inferred = inferTopicDraft({ label, mode: 'routing' }) as SearchTopicItem
    setTopics((current) => [...current, inferred])
    setQuickTopicLabel('')
    setError(null)
    setQuickRecommendation(null)
    setNotice(`已加入主題「${inferred.label}」，關鍵字與建議來源已先由系統推測。`)
  }

  function quickAddTagGroup() {
    const label = quickTagGroupLabel.trim()
    if (!label) {
      setError('快速新增 Tag Group 至少需要名稱。')
      setNotice(null)
      return
    }
    const inferred = inferTopicDraft({ label, mode: 'collector' }) as SearchTagGroupItem
    setTagGroups((current) => [...current, inferred])
    setQuickTagGroupLabel('')
    setError(null)
    setQuickRecommendation(null)
    setNotice(`已加入 Tag Group「${inferred.label}」，tags 已先由系統推測。`)
  }

  function applyRecommendedTopics() {
    if (!quickRecommendation?.topics.length) return
    setTopics((current) => {
      const existing = new Set(current.map((item) => item.label.trim().toLowerCase()))
      const additions = quickRecommendation.topics
        .filter((label) => !existing.has(label.trim().toLowerCase()))
        .map((label) => inferTopicDraft({ label, mode: 'routing' }) as SearchTopicItem)
      return [...current, ...additions]
    })
    setNotice('已套用建議主題；若需要可再展開主題卡片調整關鍵字。')
  }

  function applyRecommendedTagGroups() {
    if (!quickRecommendation?.tagGroups.length) return
    setTagGroups((current) => {
      const existing = new Set(current.map((item) => item.label.trim().toLowerCase()))
      const additions = quickRecommendation.tagGroups
        .filter((label) => !existing.has(label.trim().toLowerCase()))
        .map((label) => inferTopicDraft({ label, mode: 'collector' }) as SearchTagGroupItem)
      return [...current, ...additions]
    })
    setNotice('已套用建議 Tag Group；之後可再展開卡片調整 tags。')
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 text-neutral-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">情報搜尋管理台</h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            這一版改成 DB 為主、JSON mirror 為輔，並提供結構化編輯。日常維護不需要再直接碰整塊 JSON。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolbarButton
            type="button"
            icon="M12 5v14M5 12h14"
            onClick={() => void runAction('run_collector')}
            disabled={busy || loading}
            className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
          >
            收集
          </ToolbarButton>
          <ToolbarButton
            type="button"
            icon="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"
            onClick={() => void runAction('import')}
            disabled={busy || loading}
            className="border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
          >
            匯入
          </ToolbarButton>
          <ToolbarButton
            type="button"
            icon="M12 21V9m0 0 4 4m-4-4-4 4M5 5h14"
            onClick={() => void runAction('export')}
            disabled={busy || loading}
            className="border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
          >
            匯出
          </ToolbarButton>
          <ToolbarButton
            type="button"
            icon="M4 4v6h6M20 20v-6h-6M20 8A8 8 0 0 0 6.3 5.3L4 10M4 16a8 8 0 0 0 13.7 2.7L20 14"
            onClick={() => void loadSnapshot()}
            disabled={busy || loading}
            className="border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
          >
            重載
          </ToolbarButton>
          <ToolbarButton
            type="button"
            icon="M5 12l5 5L20 7"
            onClick={() => void saveAll()}
            disabled={busy || loading}
            className="border-indigo-400/30 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25"
          >
            儲存
          </ToolbarButton>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      {quickRecommendation ? (
        <section className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-sm font-semibold text-sky-50">{quickRecommendation.title}</h2>
              <p className="mt-2 text-sm text-sky-50/85">{quickRecommendation.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {quickRecommendation.topics.map((topic) => (
                  <span key={`topic-${topic}`} className="rounded-full border border-sky-300/25 bg-sky-500/15 px-3 py-1 text-xs text-sky-50">
                    主題：{topic}
                  </span>
                ))}
                {quickRecommendation.tagGroups.map((group) => (
                  <span key={`group-${group}`} className="rounded-full border border-fuchsia-300/25 bg-fuchsia-500/15 px-3 py-1 text-xs text-fuchsia-50">
                    標籤群：{group}
                  </span>
                ))}
              </div>
              {quickRecommendation.notes.length ? (
                <ul className="mt-4 space-y-2 text-xs text-sky-50/80">
                  {quickRecommendation.notes.map((note) => (
                    <li key={note} className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                      {note}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyRecommendedTopics}
                disabled={!quickRecommendation.topics.length}
                className="rounded-xl border border-sky-300/30 bg-sky-500/20 px-4 py-2 text-sm text-sky-50 transition hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                加入建議主題
              </button>
              <button
                type="button"
                onClick={applyRecommendedTagGroups}
                disabled={!quickRecommendation.tagGroups.length}
                className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/20 px-4 py-2 text-sm text-fuchsia-50 transition hover:bg-fuchsia-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                加入建議 Tag Group
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-3xl border border-white/10 bg-neutral-950/70 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-medium">來源收集器</h2>
            <p className="mt-2 text-sm text-neutral-400">
              先看 collector 是否正常更新，再決定要不要調整 source/topic/watchlist。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sectionBadge('來源', snapshot?.storage.sources || 'json')}
            {sectionBadge('主題', snapshot?.storage.topics || 'json')}
            {sectionBadge('標籤群', snapshot?.storage.tagGroups || 'json')}
            {sectionBadge('追蹤清單', snapshot?.storage.watchlist || 'json')}
            <Link
              href="/hub/tag-intel"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 text-sm text-indigo-200 transition hover:bg-indigo-500/20"
            >
              查看情報中心
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
          <label className="text-sm">
            <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">搜尋來源</div>
            <select
              value={runProvider}
              onChange={(event) => setRunProvider(event.target.value as typeof runProvider)}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-neutral-100 outline-none focus:border-emerald-400/40"
            >
              <option value="auto">auto</option>
              <option value="exa">exa</option>
              <option value="duckduckgo">duckduckgo</option>
              <option value="brave">brave</option>
              <option value="tavily">tavily</option>
            </select>
          </label>
          <label className="text-sm">
            <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">主題數量</div>
            <input
              type="number"
              min={1}
              value={runLimitTags}
              onChange={(event) => setRunLimitTags(event.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-neutral-100 outline-none focus:border-emerald-400/40"
            />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">來源數量</div>
            <input
              type="number"
              min={1}
              value={runLimitSources}
              onChange={(event) => setRunLimitSources(event.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-neutral-100 outline-none focus:border-emerald-400/40"
            />
          </label>
          <div className="flex h-11 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-xs text-neutral-400">
            手動執行會直接跑 `tag_intel_collector.py --publish`
          </div>
        </div>

        {snapshot?.collector ? (
          <>
            <div className="mt-6 grid gap-3 md:grid-cols-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Generated</div>
                <div className="mt-2 text-sm font-medium">{snapshot.collector.generatedAt}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Provider</div>
                <div className="mt-2 text-sm font-medium">{snapshot.collector.provider}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Sources</div>
                <div className="mt-2 text-sm font-medium">{snapshot.collector.counts.sources}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Entries</div>
                <div className="mt-2 text-sm font-medium">{snapshot.collector.counts.entries}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Errors</div>
                <div className={`mt-2 text-sm font-medium ${snapshot.collector.counts.errors ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {snapshot.collector.counts.errors}
                </div>
              </div>
            </div>

            {(snapshot.collector.toolingStatus?.agentReach || snapshot.collector.toolingStatus?.collectorStrategy) ? (
              <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_1.4fr]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Agent Reach 狀態</div>
                  {snapshot.collector.toolingStatus?.agentReach ? (
                    <div className="mt-3 space-y-3 text-sm text-neutral-200">
                      {agentReachAllGreen ? (
                        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-500/10 px-4 py-4 text-emerald-50">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-semibold leading-6">Agent Reach 已全部解鎖</div>
                              <div className="mt-1 text-sm text-emerald-100/90">目前 18/18 渠道全部可用，現在不用額外處理設定。</div>
                            </div>
                            <div className="shrink-0 rounded-2xl border border-emerald-200/20 bg-black/10 px-3 py-2 text-right">
                              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/70">完成度</div>
                              <div className="text-lg font-semibold leading-none">18/18</div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {sectionBadge('版本', snapshot.collector.toolingStatus.agentReach.version || 'unknown')}
                            {sectionBadge('狀態', '全部可用')}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {sectionBadge('版本', snapshot.collector.toolingStatus.agentReach.version || 'unknown')}
                          {sectionBadge(
                            '渠道',
                            `${snapshot.collector.toolingStatus.agentReach.availableChannels ?? 0}/${snapshot.collector.toolingStatus.agentReach.totalChannels ?? 0}`,
                          )}
                          {sectionBadge('狀態', snapshot.collector.toolingStatus.agentReach.ok ? '可用但需留意' : '需修復')}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void refreshAgentReachWatch()}
                          disabled={agentReachRefreshing || busy}
                          className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {agentReachRefreshing ? '重新檢查中…' : '重新檢查 Agent Reach'}
                        </button>
                        {needsGithubLogin ? (
                          <span className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                            現在最值得你先做的是 GitHub 登入
                          </span>
                        ) : null}
                      </div>
                      {snapshot.collector.toolingStatus.agentReach.error ? (
                        <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                          {snapshot.collector.toolingStatus.agentReach.error}
                        </p>
                      ) : null}
                      {!agentReachAllGreen && agentReachIssues.length ? (
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">待處理提醒</div>
                          <div className="mt-2 space-y-2">
                            {agentReachIssues.map((issue) => (
                              <div key={issue.id} className="rounded-xl border border-amber-300/15 bg-amber-500/10 p-3 text-xs text-amber-50">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">{issue.title}</span>
                                  {issue.requiresLogin ? (
                                    <span className="rounded-full border border-amber-200/20 bg-black/10 px-2 py-0.5 text-[11px]">
                                      需要你登入
                                    </span>
                                  ) : null}
                                  {issue.canAutoVerify ? (
                                    <span className="rounded-full border border-cyan-200/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-100">
                                      可重新驗證
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-2 leading-6 text-amber-100/90">{issue.summary}</p>
                                {issue.commands.length ? (
                                  <div className="mt-2 space-y-2">
                                    {issue.commands.map((command) => (
                                      <code key={command} className="block overflow-x-auto rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-amber-50">
                                        {command}
                                      </code>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-neutral-400">目前沒有 Agent Reach 健康資訊。</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">收集策略</div>
                  {snapshot.collector.toolingStatus?.collectorStrategy ? (
                    <details className="group mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 marker:content-none">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-neutral-100">目前先用最穩的收集路徑</div>
                          <p className="mt-1 text-sm leading-6 text-neutral-300">
                            泛用來源優先走
                            <span className="mx-1 font-medium text-emerald-200">{snapshot.collector.toolingStatus.collectorStrategy.genericSourcesPrefer || 'n/a'}</span>
                            ，同時保留
                            <span className="mx-1 font-medium text-cyan-100">{(snapshot.collector.toolingStatus.collectorStrategy.nativeSourcesKeep || []).length}</span>
                            條原生來源能力。
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs text-neutral-500 group-open:hidden">展開細節</span>
                          <span className="hidden text-xs text-neutral-500 group-open:inline">收起細節</span>
                        </div>
                      </summary>
                      <div className="mt-4 space-y-4 text-sm text-neutral-200">
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">泛用來源優先</div>
                          <div className="mt-1 font-medium text-emerald-200">
                            {snapshot.collector.toolingStatus.collectorStrategy.genericSourcesPrefer || 'n/a'}
                          </div>
                          <p className="mt-2 text-xs leading-6 text-neutral-400">
                            這條代表一般網站、論壇與社群訊號，預設先走最穩定、覆蓋面最廣的收集策略。
                          </p>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">原生來源保留</div>
                          {(snapshot.collector.toolingStatus.collectorStrategy.nativeSourcesKeep || []).length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(snapshot.collector.toolingStatus.collectorStrategy.nativeSourcesKeep || []).map((source) => (
                                <span
                                  key={source}
                                  className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100"
                                >
                                  {source}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-neutral-400">目前沒有額外保留的原生來源。</p>
                          )}
                        </div>
                      </div>
                    </details>
                  ) : (
                    <p className="mt-3 text-sm text-neutral-400">目前沒有收集策略資訊。</p>
                  )}
                </div>
              </div>
            ) : null}

            {mergeSuggestions.length ? (
              <details className="group mt-4 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 marker:content-none">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase tracking-[0.18em] text-indigo-200">可能重複群組</div>
                    <p className="mt-1 text-sm text-indigo-100/80">
                      系統找到
                      <span className="mx-1 font-medium text-indigo-50">{mergeSuggestions.length}</span>
                      組疑似重複的追蹤群組，建議你有空時整併，讓命中與錯誤更集中。
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {sectionBadge('建議數', String(mergeSuggestions.length))}
                    <div className="mt-2 text-xs text-indigo-100/70 group-open:hidden">展開細節</div>
                    <div className="mt-2 hidden text-xs text-indigo-100/70 group-open:block">收起細節</div>
                  </div>
                </summary>
                <div className="mt-4 space-y-3">
                  {mergeSuggestions.map((item, index) => {
                    const primaryName = compactValue(item.primary.trackingGroup) || compactValue(item.primary.linkedDomain) || `group-${index + 1}`
                    const secondaryName = compactValue(item.secondary.trackingGroup) || compactValue(item.secondary.linkedDomain) || `group-${index + 2}`
                    return (
                      <div key={`${primaryName}-${secondaryName}-${index}`} className="rounded-2xl border border-indigo-400/15 bg-black/20 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100">
                            {primaryName}
                          </span>
                          <span className="text-xs text-neutral-400">可能與</span>
                          <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100">
                            {secondaryName}
                          </span>
                          <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-[11px] text-indigo-100">
                            相似度 {Math.round(item.score * 100)}
                          </span>
                        </div>
                        {item.commonTokens.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.commonTokens.map((token) => (
                              <span key={`${primaryName}-${secondaryName}-${token}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-neutral-300">
                                {token}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                          <Link
                            href={buildTagIntelHref(item.primary)}
                            className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-2 text-center text-xs text-fuchsia-100 transition hover:border-fuchsia-300/40 hover:bg-fuchsia-500/15"
                          >
                            看 {primaryName}
                          </Link>
                          <Link
                            href={buildTagIntelHref(item.secondary)}
                            className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-2 text-center text-xs text-fuchsia-100 transition hover:border-fuchsia-300/40 hover:bg-fuchsia-500/15"
                          >
                            看 {secondaryName}
                          </Link>
                          <button
                            type="button"
                            onClick={() => prepareWatchGroupInvestigation(item.primary)}
                            className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-center text-xs text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/15"
                          >
                            帶入主群追查
                          </button>
                          <button
                            type="button"
                            onClick={() => prepareWatchGroupInvestigation(item.secondary)}
                            className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-center text-xs text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/15"
                          >
                            帶入副群追查
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void mergeWatchGroups(item.primary, item.secondary)}
                            className="col-span-2 rounded-xl border border-amber-300/30 bg-amber-500/15 px-3 py-2 text-center text-xs text-amber-50 transition hover:border-amber-200/50 hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:col-auto"
                          >
                            套用為同一群組
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void mergeWatchGroups(item.primary, item.secondary, true)}
                            className="col-span-2 rounded-xl border border-emerald-300/30 bg-emerald-500/15 px-3 py-2 text-center text-xs text-emerald-50 transition hover:border-emerald-200/50 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:col-auto"
                          >
                            整併並重跑
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            ) : null}

            {mergeOutcome ? (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">整併結果差異</div>
                    <p className="mt-1 text-sm text-emerald-100/85">
                      已把 {mergeOutcome.secondaryName} 併入 {mergeOutcome.primaryName}
                      {mergeOutcome.rerun ? '，並已重跑 collector。' : '。'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMergeOutcome(null)}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-neutral-200 transition hover:bg-white/10"
                  >
                    收起
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {sectionBadge('健康分數', `${mergeOutcome.before.score} → ${mergeOutcome.after.score}`)}
                  {sectionBadge('最近命中', `${mergeOutcome.before.recentHitCount} → ${mergeOutcome.after.recentHitCount}`)}
                  {sectionBadge('最近錯誤', `${mergeOutcome.before.recentErrorCount} → ${mergeOutcome.after.recentErrorCount}`)}
                  {sectionBadge('7天命中', `${mergeOutcome.before.sevenDayHitRuns} → ${mergeOutcome.after.sevenDayHitRuns}`)}
                </div>
                <div className="mt-3 text-xs text-emerald-100/80">
                  {mergeOutcome.after.score > mergeOutcome.before.score
                    ? '整併後健康分數上升，代表群組訊號更集中。'
                    : mergeOutcome.after.score < mergeOutcome.before.score
                      ? '整併後健康分數下降，建議檢查 query、來源或錯誤訊號。'
                      : '整併後健康分數持平；若要確認成效，建議再看最近命中與錯誤流。'}
                </div>
              </div>
            ) : null}

            {snapshot.collector.watchGroups?.length ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">Watch Groups</div>
                    <p className="mt-1 text-sm text-neutral-400">
                      系統目前辨識到的追蹤群組；同群組的官網、帳號與後續 collector 策略會一起運作。
                    </p>
                  </div>
                  {sectionBadge('群組數', String(snapshot.collector.watchGroups.length))}
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {snapshot.collector.watchGroups.slice(0, 8).map((group, index) => {
                    const groupName = compactValue(group.trackingGroup) || compactValue(group.linkedDomain) || `group-${index + 1}`
                    const health = summarizeWatchGroupHealth({ group, collectorRuns: snapshot.collectorRuns || [] })
                    const recommendations = recommendWatchGroupActions(group)
                    return (
                      <details
                        key={`${groupName}-${index}`}
                        className="group rounded-2xl border border-white/10 bg-black/20 p-4 open:border-cyan-400/30 open:bg-cyan-500/5"
                      >
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-medium text-neutral-100">{groupName}</div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                  health.score >= 80
                                    ? 'bg-emerald-500/15 text-emerald-200'
                                    : health.score >= 60
                                      ? 'bg-cyan-500/15 text-cyan-200'
                                      : health.score >= 40
                                        ? 'bg-amber-500/15 text-amber-200'
                                        : 'bg-rose-500/15 text-rose-200'
                                }`}
                              >
                                健康 {health.score} · {health.status}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {group.linkedDomain ? sectionBadge('官網', group.linkedDomain) : null}
                              {sectionBadge('帳號', String(health.accountCount))}
                              {sectionBadge('網站', String(health.siteCount))}
                              {sectionBadge('最近命中', String(health.recentHitCount))}
                              {sectionBadge('最近錯誤', String(health.recentErrorCount))}
                              {sectionBadge('7天重跑', String(health.sevenDayRuns))}
                              {sectionBadge('7天命中', String(health.sevenDayHitRuns))}
                              {snapshot.collector?.generatedAt ? sectionBadge('最近抓取', snapshot.collector.generatedAt.replace('T', ' ')) : null}
                            </div>
                          </div>
                          <span className="text-xs text-neutral-500 transition group-open:rotate-90">▸</span>
                        </summary>
                        <div className="mt-4 space-y-3 text-sm text-neutral-300">
                          {recommendations.length ? (
                            <div className="rounded-2xl border border-indigo-400/15 bg-indigo-500/5 p-3">
                              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-indigo-200">系統建議</div>
                              <div className="flex flex-wrap gap-2">
                                {recommendations.map((item) =>
                                  item.href ? (
                                    <Link
                                      key={`${groupName}-${item.label}`}
                                      href={item.href}
                                      className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100 transition hover:border-indigo-300/40 hover:bg-indigo-500/15"
                                    >
                                      {item.label}
                                    </Link>
                                  ) : (
                                    <span
                                      key={`${groupName}-${item.label}`}
                                      className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100"
                                    >
                                      {item.label}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          ) : null}
                          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                            <Link
                              href={buildTagIntelHref(group)}
                              className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-2 text-center text-xs text-fuchsia-100 transition hover:border-fuchsia-300/40 hover:bg-fuchsia-500/15"
                            >
                              查看完整內容流
                            </Link>
                            <Link
                              href={buildTagIntelHref(group, undefined, 'hits')}
                              className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-center text-xs text-sky-100 transition hover:border-sky-300/40 hover:bg-sky-500/15"
                            >
                              只看命中
                            </Link>
                            <Link
                              href={buildTagIntelHref(group, undefined, 'errors')}
                              className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-center text-xs text-rose-100 transition hover:border-rose-300/40 hover:bg-rose-500/15"
                            >
                              只看錯誤
                            </Link>
                            <Link
                              href={buildTagIntelHref(group, undefined, 'recommendations')}
                              className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-center text-xs text-violet-100 transition hover:border-violet-300/40 hover:bg-violet-500/15"
                            >
                              看建議追蹤
                            </Link>
                            <button
                              type="button"
                              onClick={() => prepareWatchGroupInvestigation(group)}
                              className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-center text-xs text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/15"
                            >
                              帶入 Hybrid 追查
                            </button>
                            <button
                              type="button"
                              onClick={() => void investigateWatchGroup(group)}
                              disabled={busy}
                              className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              立即追查
                            </button>
                            <button
                              type="button"
                              onClick={() => void rerunWatchGroupCollector(group)}
                              disabled={busy}
                              className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100 transition hover:border-amber-300/40 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              重跑群組收集
                            </button>
                          </div>
                          {health.accountCount ? (
                            <div>
                              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-neutral-500">追蹤帳號</div>
                              <div className="flex flex-wrap gap-2">
                                {group.accounts?.map((account, accountIndex) => (
                                  <span
                                    key={`${groupName}-account-${accountIndex}`}
                                    className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100"
                                  >
                                    {compactValue(account.label) || compactValue(account.query) || compactValue(account.source) || 'account'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {health.siteCount ? (
                            <div>
                              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-neutral-500">追蹤網站</div>
                              <div className="flex flex-wrap gap-2">
                                {group.sites?.map((site, siteIndex) => (
                                  <span
                                    key={`${groupName}-site-${siteIndex}`}
                                    className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100"
                                  >
                                    {compactValue(site.label) || compactValue(site.site) || 'site'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {group.recentHits?.length ? (
                            <div>
                              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-neutral-500">最近命中</div>
                              <div className="space-y-2">
                                {group.recentHits.slice(0, 4).map((hit, hitIndex) => (
                                  <div
                                    key={`${groupName}-hit-${hitIndex}`}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                                  >
                                    <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/5 p-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] text-cyan-100">
                                          中文閱讀摘要
                                        </span>
                                        {compactValue(hit.url) ? (
                                          <a
                                            href={buildTranslateHref(compactValue(hit.url))}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/15"
                                          >
                                            翻譯閱讀
                                          </a>
                                        ) : null}
                                        {compactValue(hit.url) ? (
                                          <a
                                            href={compactValue(hit.url)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-neutral-200 transition hover:bg-white/10"
                                          >
                                            原文連結
                                          </a>
                                        ) : null}
                                      </div>
                                      <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-200">
                                        {buildWatchHitSummary({
                                          title: compactValue(hit.title),
                                          sourceLabel: compactValue(hit.sourceLabel),
                                          accountLabel: compactValue(hit.accountLabel),
                                          trackingGroup: groupName,
                                          linkedDomain: compactValue(group.linkedDomain),
                                        }).map((line) => (
                                          <li key={line} className="flex gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300" />
                                            <span>{line}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <a
                                      href={compactValue(hit.url) || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-3 block transition hover:text-cyan-200"
                                    >
                                      <div className="text-sm text-neutral-100">{compactValue(hit.title) || compactValue(hit.url) || '未命名結果'}</div>
                                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-neutral-400">
                                        {hit.sourceLabel ? <span>{hit.sourceLabel}</span> : null}
                                        {hit.accountLabel ? <span>來自 {hit.accountLabel}</span> : null}
                                      </div>
                                    </a>
                                    {compactValue(hit.url) ? (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <Link
                                          href={buildTagIntelHref(group, compactValue(hit.url))}
                                          className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-[11px] text-fuchsia-100 transition hover:border-fuchsia-300/40 hover:bg-fuchsia-500/15"
                                        >
                                          開內容流檢視
                                        </Link>
                                        <button
                                          type="button"
                                          onClick={() => prepareWatchGroupInvestigation(group, compactValue(hit.url))}
                                          className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/15"
                                        >
                                          帶入這筆追查
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => void investigateWatchGroup(group, compactValue(hit.url))}
                                          disabled={busy}
                                          className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          立刻深追這筆
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {group.recentErrors?.length ? (
                            <div>
                              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-neutral-500">最近錯誤</div>
                              <div className="space-y-2">
                                {group.recentErrors.slice(0, 3).map((errorItem, errorIndex) => (
                                  <div
                                    key={`${groupName}-error-${errorIndex}`}
                                    className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100"
                                  >
                                    <div className="rounded-xl border border-rose-300/20 bg-black/10 p-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-rose-300/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] text-rose-100">
                                          中文錯誤摘要
                                        </span>
                                      </div>
                                      <ul className="mt-3 space-y-2 text-sm leading-6 text-rose-50">
                                        {buildWatchErrorSummary({
                                          sourceLabel: compactValue(errorItem.sourceLabel),
                                          accountLabel: compactValue(errorItem.accountLabel),
                                          message: compactValue(errorItem.message),
                                          trackingGroup: groupName,
                                        }).map((line) => (
                                          <li key={line} className="flex gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-300" />
                                            <span>{line}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="mt-3 font-medium">
                                      {compactValue(errorItem.accountLabel) || compactValue(errorItem.sourceLabel) || 'watch error'}
                                    </div>
                                    <div className="mt-1 text-rose-100/80">
                                      {compactValue(errorItem.message) || 'unknown error'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </details>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
            目前還讀不到 collector 產出，先確認 `tag_intel_collector.py` 與 cron 是否正常。
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-neutral-950/70 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-medium">混合研究管線</h2>
            <p className="mt-2 text-sm text-neutral-400">
              手動執行路由與混合研究流程，先整理研究資料包，再視需要交給雲端模型做綜合分析。
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runAction('run_hybrid')}
            disabled={busy || loading}
            className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            執行 Hybrid
          </button>
        </div>

        <details className="group mt-6 rounded-2xl border border-white/10 bg-black/20 p-4" open>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 marker:content-none">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-neutral-100">先設定這次想查什麼</div>
              <p className="mt-1 text-sm leading-6 text-neutral-300">
                目前查詢
                <span className="mx-1 font-medium text-cyan-100">{hybridQuery || '尚未填寫'}</span>
                ，來源
                <span className="mx-1 font-medium text-emerald-200">{hybridSources || '系統自動判斷'}</span>
                ，主題
                <span className="mx-1 font-medium text-violet-200">{hybridTopics || '系統自動判斷'}</span>
                。
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs text-neutral-500 group-open:hidden">展開欄位</div>
              <div className="hidden text-xs text-neutral-500 group-open:block">收起欄位</div>
            </div>
          </summary>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">查詢內容</div>
              <input
                value={hybridQuery}
                onChange={(event) => setHybridQuery(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-cyan-400/40"
              />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">來源清單</div>
              <input
                value={hybridSources}
                onChange={(event) => setHybridSources(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-cyan-400/40"
              />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">主題清單</div>
              <input
                value={hybridTopics}
                onChange={(event) => setHybridTopics(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-cyan-400/40"
              />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">最多結果</div>
              <input
                type="number"
                min={1}
                value={hybridMaxResults}
                onChange={(event) => setHybridMaxResults(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-cyan-400/40"
              />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">抓取頁數</div>
              <input
                type="number"
                min={1}
                value={hybridFetchPages}
                onChange={(event) => setHybridFetchPages(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-cyan-400/40"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">
              <input type="checkbox" checked={hybridNeedComparison} onChange={(event) => setHybridNeedComparison(event.target.checked)} />
              需要比較
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">
              <input type="checkbox" checked={hybridNeedStrategy} onChange={(event) => setHybridNeedStrategy(event.target.checked)} />
              需要策略
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">
              <input type="checkbox" checked={hybridRequiresDeepFetch} onChange={(event) => setHybridRequiresDeepFetch(event.target.checked)} />
              深度抓取
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">
              <input type="checkbox" checked={hybridSkipCloud} onChange={(event) => setHybridSkipCloud(event.target.checked)} />
              略過雲端
            </label>
          </div>
        </details>

        {lastHybridResult ? (
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">優先等級</div>
              <div className="mt-2 text-sm font-medium">{describeHybridLevel(lastHybridResult.classification?.level)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">路由判定</div>
              <div className="mt-2 text-sm font-medium">{describeHybridRoute(lastHybridResult.classification?.route)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">雲端結果</div>
              <div className="mt-2 text-sm font-medium">
                {lastHybridResult.cloud_result?.ok
                  ? `${lastHybridResult.cloud_result.provider || 'cloud'} / ${lastHybridResult.cloud_result.model || ''}`
                  : hybridSkipCloud
                    ? '已略過'
                    : '目前不可用'}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">產物數量</div>
              <div className="mt-2 text-sm font-medium">{Object.keys(lastHybridResult.artifact_paths || {}).length}</div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium">混合研究紀錄</h2>
            <p className="mt-2 text-sm text-neutral-400">最近幾次 hybrid pipeline 結果，先用中文看懂路由、雲端與來源覆蓋，再決定要不要深追。</p>
          </div>
        </div>
        {snapshot?.hybridRuns?.length ? (
          <div className="space-y-3">
            {snapshot.hybridRuns.map((run) => {
              const relatedGroups = findRelevantWatchGroupsForHybridRun({
                run,
                sources,
                watchGroups: snapshot?.collector?.watchGroups || [],
              })
              const runAction = hybridRunActions[run.id]

              return (
                <details key={run.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <summary className="cursor-pointer list-none px-4 py-4 text-sm text-neutral-200 marker:content-none odd:bg-white/[0.03]">
                    <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.15fr_2fr_0.9fr_1fr] md:items-start">
                      <div className="min-w-0">
                        <div className="text-[11px] tracking-[0.18em] text-neutral-500">時間</div>
                        <div className="mt-1">{run.created_at}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] tracking-[0.18em] text-neutral-500">查詢內容</div>
                        <div className="mt-1 font-medium text-neutral-100 line-clamp-2" title={run.query}>
                          {run.query}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-neutral-300">
                            優先：{describeHybridLevel(run.classification_level)}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-neutral-300">
                            路由：{describeHybridRoute(run.classification_route)}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] tracking-[0.18em] text-neutral-500">雲端狀態</div>
                        <div className={`mt-1 ${run.cloud_ok ? 'text-emerald-300' : run.skip_cloud ? 'text-neutral-400' : 'text-amber-300'}`}>
                          {describeHybridCloud(run)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] tracking-[0.18em] text-neutral-500">來源覆蓋</div>
                        <div className="mt-1 line-clamp-2 text-neutral-300" title={run.sources.join(', ')}>
                          {run.sources.join('、') || '—'}
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">點開可看中文摘要、建卡、關聯群組與產物。</div>
                      </div>
                    </div>
                  </summary>
                <div className="border-t border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                    <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">中文摘要</div>
                    <div className="mt-2 space-y-2 text-sm text-neutral-300">
                      {buildHybridRunSummary(run).map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {runAction?.investigated ? (
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-100">
                          已帶入追查
                        </span>
                      ) : null}
                      {runAction?.trackingPrefilled ? (
                        <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-100">
                          已送進追蹤設定
                        </span>
                      ) : null}
                      {runAction?.taskId ? (
                        <Link
                          href={`/hub/v4/task/${runAction.taskId}`}
                          className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-100 transition hover:bg-emerald-500/20"
                        >
                          開任務 #{runAction.taskId}
                        </Link>
                      ) : null}
                      {runAction?.taskStatus ? (
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] ${taskStatusTone(runAction.taskStatus)}`}>
                          任務狀態：{describeTaskStatus(runAction.taskStatus)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className={`mt-3 rounded-xl border p-3 text-sm text-neutral-100 ${hybridFeedbackTone({ relatedGroups, taskStatus: runAction?.taskStatus })}`}>
                    <div className="text-xs uppercase tracking-[0.18em] text-neutral-300">後續回饋</div>
                    <div className="mt-2 space-y-2 text-sm text-neutral-100/90">
                      {buildHybridFeedbackSummary({
                        taskStatus: runAction?.taskStatus,
                        relatedGroups,
                      }).map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => prepareHybridRunInvestigation(run)}
                      className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
                    >
                      帶入這筆追查
                    </button>
                    <Link
                      href={buildTrackingBundleHrefFromHybridRun(run)}
                      onClick={() =>
                        setHybridRunActions((current) => ({
                          ...current,
                          [run.id]: { ...current[run.id], trackingPrefilled: true },
                        }))
                      }
                      className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-center text-sm text-violet-100 transition hover:bg-violet-500/20"
                    >
                      轉成追蹤設定
                    </Link>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void createHybridRunTask(run)}
                      disabled={busy}
                      className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? '建卡中…' : '為這筆建追查卡'}
                    </button>
                    {runAction?.taskMessage ? (
                      <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-neutral-300">
                        {runAction.taskMessage}
                      </div>
                    ) : null}
                  </div>
                  {runAction?.taskUpdatedAt || runAction?.taskResult ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">任務後續</div>
                      <div className="mt-2 space-y-1 text-sm text-neutral-300">
                        {runAction?.taskUpdatedAt ? <div>最後更新：{runAction.taskUpdatedAt}</div> : null}
                        {runAction?.taskResult ? <div>最新摘要：{cleanCompactText(runAction.taskResult, 140)}</div> : null}
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">關聯追蹤群組</div>
                      <span className="rounded-full border border-white/10 bg-black/10 px-2 py-0.5 text-[11px] text-neutral-400">
                        {relatedGroups.length ? `找到 ${relatedGroups.length} 組` : '尚未對上現有群組'}
                      </span>
                    </div>
                    {relatedGroups.length ? (
                      <div className="mt-3 grid gap-2">
                        {relatedGroups.map(({ group, score }) => {
                          const label = compactValue(group.trackingGroup) || compactValue(group.linkedDomain) || '未命名群組'
                          const hitCount = Array.isArray(group.recentHits) ? group.recentHits.length : 0
                          const errorCount = Array.isArray(group.recentErrors) ? group.recentErrors.length : 0
                          return (
                            <div key={`${run.id}-${label}`} className="rounded-xl border border-white/10 bg-black/10 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-medium text-neutral-100">{label}</div>
                                {group.linkedDomain ? (
                                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-neutral-400">
                                    {group.linkedDomain}
                                  </span>
                                ) : null}
                                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-100">
                                  關聯分數 {score}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-neutral-400">
                                <span>最近命中 {hitCount}</span>
                                <span>最近錯誤 {errorCount}</span>
                                <span>帳號 {(group.accounts || []).length}</span>
                                <span>網站 {(group.sites || []).length}</span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Link
                                  href={buildTagIntelHref(group, undefined, 'hits')}
                                  className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[12px] text-emerald-100 transition hover:bg-emerald-500/20"
                                >
                                  看這組命中
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => prepareWatchGroupInvestigation(group)}
                                  className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[12px] text-violet-100 transition hover:bg-violet-500/20"
                                >
                                  帶入這組追查
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-neutral-400">
                        這筆混合研究目前還沒對上明顯的追蹤群組。若你覺得值得持續追，可先按「轉成追蹤設定」建立新群組。
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">主題清單</div>
                      <div className="mt-2 break-words text-sm">{run.topics.join('、') || '—'}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">執行旗標</div>
                      <div className="mt-2 space-y-1 text-sm text-neutral-300">
                        <div>需要比較：{describeBooleanFlag(run.need_comparison)}</div>
                        <div>需要策略：{describeBooleanFlag(run.need_strategy)}</div>
                        <div>深度抓取：{describeBooleanFlag(run.requires_deep_fetch)}</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">附帶資訊</div>
                      <div className="mt-2 space-y-1 text-sm text-neutral-300">
                        <div>執行規劃：{describeBooleanFlag(Boolean(run.metadata?.execution_plan), '有', '無')}</div>
                        <div>證據包：{describeBooleanFlag(Boolean(run.metadata?.evidence_bundle), '有', '無')}</div>
                        <div>錯誤輸出：{describeBooleanFlag(Boolean(run.metadata?.stderr), '有', '無')}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                    <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">產物路徑</div>
                    {run.artifact_paths && Object.keys(run.artifact_paths).length ? (
                      <div className="mt-2 space-y-3 text-sm text-neutral-300">
                        {Object.entries(run.artifact_paths).map(([key, value]) => {
                          const detail = artifactDetails[value] || {}
                          return (
                            <Fragment key={key}>
                              <div className="space-y-2">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                  <div className="break-all">
                                    <span className="text-neutral-500">{key}：</span> {value}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => void loadArtifact(value)}
                                    className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100 transition hover:bg-cyan-500/20"
                                  >
                                    查看內容
                                  </button>
                                </div>
                                {detail.loading ? (
                                  <div className="text-xs text-neutral-400">讀取中...</div>
                                ) : null}
                                {detail.error ? (
                                  <div className="text-xs text-rose-300">{detail.error}</div>
                                ) : null}
                                {detail.content ? (
                                  <pre className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-neutral-300">
                                    {JSON.stringify(detail.content, null, 2)}
                                  </pre>
                                ) : null}
                              </div>
                            </Fragment>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-neutral-400">目前沒有產物路徑</div>
                    )}
                  </div>
                </div>
              </details>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
            目前還沒有混合研究紀錄。
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">來源</div>
          <div className="mt-2 text-2xl font-semibold">{stats.sources}</div>
          <div className="mt-2 text-xs text-neutral-500">目前可用的來源設定數</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">主題</div>
          <div className="mt-2 text-2xl font-semibold">{stats.topics}</div>
          <div className="mt-2 text-xs text-neutral-500">可被路由器使用的主題</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">追蹤帳號</div>
          <div className="mt-2 text-2xl font-semibold">{stats.accounts}</div>
          <div className="mt-2 text-xs text-neutral-500">固定追蹤帳號與查詢</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">標籤群</div>
          <div className="mt-2 text-2xl font-semibold">{stats.tagGroups}</div>
          <div className="mt-2 text-xs text-neutral-500">收集器使用的主題群組</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">追蹤網站</div>
          <div className="mt-2 text-2xl font-semibold">{stats.sites}</div>
          <div className="mt-2 text-xs text-neutral-500">固定追蹤網站</div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium">收集紀錄</h2>
            <p className="mt-2 text-sm text-neutral-400">最近幾次來源收集器執行結果，先看健康度再調設定。</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRunFilter('all')}
              className={`rounded-xl border px-4 py-2 text-sm transition ${
                runFilter === 'all'
                  ? 'border-indigo-400/30 bg-indigo-500/15 text-indigo-100'
                  : 'border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10'
              }`}
            >
              全部
            </button>
            <button
              type="button"
              onClick={() => setRunFilter('errors')}
              className={`rounded-xl border px-4 py-2 text-sm transition ${
                runFilter === 'errors'
                  ? 'border-rose-400/30 bg-rose-500/15 text-rose-100'
                  : 'border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10'
              }`}
            >
              僅錯誤
            </button>
          </div>
        </div>
        {filteredCollectorRuns.length ? (
          <div className="grid gap-3">
            {filteredCollectorRuns.map((run) => (
              <details key={run.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <summary className="cursor-pointer list-none px-4 py-4 marker:content-none">
                  <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.2fr_1fr_1fr_0.8fr] md:items-start">
                    <div>
                      <div className="text-[11px] tracking-[0.18em] text-neutral-500">時間</div>
                      <div className="mt-1 text-sm text-neutral-200">{run.created_at}</div>
                    </div>
                    <div>
                      <div className="text-[11px] tracking-[0.18em] text-neutral-500">收集器 / 來源</div>
                      <div className="mt-1 text-sm text-neutral-100">{run.collector}</div>
                      <div className="mt-1 text-xs text-neutral-400">{run.provider}</div>
                    </div>
                    <div>
                      <div className="text-[11px] tracking-[0.18em] text-neutral-500">結果摘要</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                        <span className={`rounded-full border px-2.5 py-1 ${run.status === 'ok' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border-rose-400/20 bg-rose-500/10 text-rose-100'}`}>
                          {run.status === 'ok' ? '正常' : '有錯誤'}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-neutral-300">主題 {run.tags_count}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-neutral-300">命中 {run.entries_count}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-neutral-300">錯誤 {run.errors_count}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-neutral-500 group-open:hidden">展開細節</span>
                      <span className="hidden text-xs text-neutral-500 group-open:inline">收起細節</span>
                    </div>
                  </div>
                </summary>
                <div className="border-t border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">收集器</div>
                      <div className="mt-2">{run.collector}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">來源</div>
                      <div className="mt-2">{run.provider}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">主題 / 命中</div>
                      <div className="mt-2">主題 {run.tags_count}｜命中 {run.entries_count}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">錯誤數</div>
                      <div className="mt-2">{run.errors_count}</div>
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
            {runFilter === 'errors' ? '目前沒有錯誤 run。' : '目前還沒有 collector run history。'}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium">網站來源</h2>
            <p className="mt-2 text-sm text-neutral-400">先看來源卡片摘要，真的要微調時再展開細節。日常新增網站建議直接用下方快速新增。</p>
          </div>
          <button
            type="button"
            onClick={() => addItem('sources')}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/10"
          >
            新增來源
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <label className="flex-1 text-sm">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-emerald-100/80">名稱</div>
              <input
                value={quickSourceLabel}
                onChange={(event) => setQuickSourceLabel(event.target.value)}
                placeholder="例如：和椿科技"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-400/40"
              />
            </label>
            <label className="flex-[1.2] text-sm">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-emerald-100/80">網址</div>
              <input
                value={quickSourceUrl}
                onChange={(event) => setQuickSourceUrl(event.target.value)}
                placeholder="https://www.aurotek.com"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-400/40"
              />
            </label>
            <label className="w-full text-sm xl:w-56">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-emerald-100/80">分類</div>
              <select
                value={quickSourceCategory}
                onChange={(event) => setQuickSourceCategory(event.target.value as QuickSourceCategory)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-400/40"
              >
                <option value="company">競品 / 官網</option>
                <option value="community">科技社群</option>
                <option value="social">社群平台</option>
                <option value="developer">開發者來源</option>
                <option value="model-platform">模型平台</option>
              </select>
            </label>
            <button
              type="button"
              onClick={quickAddSource}
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-50 transition hover:bg-emerald-500/30"
            >
              快速新增
            </button>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-200">
            <input
              type="checkbox"
              checked={quickSourceAlsoWatch}
              onChange={(event) => setQuickSourceAlsoWatch(event.target.checked)}
            />
            同步加入追蹤網站（watch sites）
          </label>
          <p className="mt-3 text-xs text-emerald-50/80">
            你只需要填名稱、網址、分類；像 `adapter`、`search mode`、`strict filter`、`priority` 這些先由系統推測，後續再展開卡片微調即可。
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {sources.map((item, index) => (
            <SourceCard
              key={`${item.id || 'source'}-${index}`}
              item={item}
              index={index}
              onChange={(next) => setSources((current) => current.map((row, rowIndex) => (rowIndex === index ? next : row)))}
              onRemove={() => setSources((current) => current.filter((_, rowIndex) => rowIndex !== index))}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium">話題方向</h2>
            <p className="mt-2 text-sm text-neutral-400">維護主題、關鍵字、建議來源與預設路由。</p>
          </div>
          <button
            type="button"
            onClick={() => addItem('topics')}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/10"
          >
            新增主題
          </button>
        </div>
        <div className="mb-5 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <label className="flex-1 text-sm">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-violet-100/80">主題名稱</div>
              <input
                value={quickTopicLabel}
                onChange={(event) => setQuickTopicLabel(event.target.value)}
                placeholder="例如：競品追蹤 / AI 工作流 / 科技社群討論"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-violet-400/40"
              />
            </label>
            <button
              type="button"
              onClick={quickAddTopic}
              className="rounded-xl border border-violet-400/30 bg-violet-500/20 px-4 py-2 text-sm text-violet-50 transition hover:bg-violet-500/30"
            >
              快速新增主題
            </button>
          </div>
          <p className="mt-3 text-xs text-violet-50/80">
            你先寫主題意圖就好，像關鍵字、建議來源、預設天數會先自動補，之後再展開卡片微調。
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {topics.map((item, index) => (
            <TopicCard
              key={`${item.id || 'topic'}-${index}`}
              item={item}
              index={index}
              onChange={(next) => setTopics((current) => current.map((row, rowIndex) => (rowIndex === index ? next : row)))}
              onRemove={() => setTopics((current) => current.filter((_, rowIndex) => rowIndex !== index))}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium">標籤群組</h2>
            <p className="mt-2 text-sm text-neutral-400">維護收集器使用的主題群組，和路由主題分開管理。</p>
          </div>
          <button
            type="button"
            onClick={() => addItem('tagGroups')}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/10"
          >
              新增標籤群組
          </button>
        </div>
        <div className="mb-5 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <label className="flex-1 text-sm">
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-fuchsia-100/80">標籤群組名稱</div>
              <input
                value={quickTagGroupLabel}
                onChange={(event) => setQuickTagGroupLabel(event.target.value)}
                placeholder="例如：科技情報 / 國外工具 / 競品更新"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-fuchsia-400/40"
              />
            </label>
            <button
              type="button"
              onClick={quickAddTagGroup}
              className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/20 px-4 py-2 text-sm text-fuchsia-50 transition hover:bg-fuchsia-500/30"
            >
                快速新增標籤群組
            </button>
          </div>
          <p className="mt-3 text-xs text-fuchsia-50/80">
            先用自然語意命名即可，collector 需要的 tags 會先自動推測；之後再展開細節調整。
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {tagGroups.map((item, index) => (
            <TagGroupCard
              key={`${item.id || 'tag-group'}-${index}`}
              item={item}
              index={index}
              onChange={(next) => setTagGroups((current) => current.map((row, rowIndex) => (rowIndex === index ? next : row)))}
              onRemove={() => setTagGroups((current) => current.filter((_, rowIndex) => rowIndex !== index))}
            />
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-2">
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-medium">追蹤帳號</h2>
              <p className="mt-2 text-sm text-neutral-400">只要填帳號名稱與網址，來源與 query 先由系統推測；需要時再展開卡片微調。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sectionBadge('目前帳號數', String(watchAccounts.length))}
                {sectionBadge('用途', '固定追社群帳號')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => addItem('accounts')}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/10 sm:self-start"
            >
              新增帳號
            </button>
          </div>
          <div className="mb-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
            <div className="mb-3">
              <div className="text-sm font-medium text-cyan-50">快速新增追蹤帳號</div>
              <p className="mt-1 text-xs leading-6 text-cyan-50/80">適合 Threads、Instagram、微博、GitHub、YouTube 等固定要看的帳號。</p>
            </div>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <label className="flex-1 text-sm">
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-cyan-100/80">帳號名稱</div>
                <input
                  value={quickAccountLabel}
                  onChange={(event) => setQuickAccountLabel(event.target.value)}
                  placeholder="例如：和椿科技 / @aurotek"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-cyan-400/40"
                />
              </label>
              <label className="flex-[1.2] text-sm">
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-cyan-100/80">網址</div>
                <input
                  value={quickAccountUrl}
                  onChange={(event) => setQuickAccountUrl(event.target.value)}
                  placeholder="https://threads.com/@aurotek"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-cyan-400/40"
                />
              </label>
              <button
                type="button"
                onClick={quickAddWatchAccount}
                className="rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-4 py-2 text-sm text-cyan-50 transition hover:bg-cyan-500/30"
              >
                快速新增帳號
              </button>
            </div>
            <p className="mt-3 text-xs text-cyan-50/80">
              例如輸入 `和椿科技` + `https://threads.com/aurotek`，系統會先推測 `source=threads`、`query=@aurotek`。
            </p>
          </div>
          <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
            <div className="mb-3">
              <div className="text-sm font-medium text-amber-50">快速新增關聯網站</div>
              <p className="mt-1 text-xs leading-6 text-amber-50/80">如果這個帳號有對應官網、文件站或產品頁，也可以順手一起掛上。</p>
            </div>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <label className="flex-1 text-sm">
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-amber-50/80">網站名稱</div>
                <input
                  value={quickWatchSiteLabel}
                  onChange={(event) => setQuickWatchSiteLabel(event.target.value)}
                  placeholder="例如：和椿科技官網"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-300/40"
                />
              </label>
              <label className="flex-[1.2] text-sm">
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-amber-50/80">網址</div>
                <input
                  value={quickWatchSiteUrl}
                  onChange={(event) => setQuickWatchSiteUrl(event.target.value)}
                  placeholder="https://www.aurotek.com"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-300/40"
                />
              </label>
              <button
                type="button"
                onClick={quickAddWatchSite}
                className="rounded-xl border border-amber-300/30 bg-amber-500/20 px-4 py-2 text-sm text-amber-50 transition hover:bg-amber-500/30"
              >
                快速新增網站
              </button>
            </div>
            <p className="mt-3 text-xs text-amber-50/80">
              固定追蹤的 docs、官網、產品頁先從這裡加就好；後續再展開卡片微調即可。
            </p>
          </div>
          <div className="space-y-4">
            {watchAccounts.map((item, index) => (
              <WatchAccountCard
                key={`${item.label || 'account'}-${index}`}
                item={item}
                index={index}
                onChange={(next) =>
                  setWatchAccounts((current) => current.map((row, rowIndex) => (rowIndex === index ? next : row)))
                }
                onRemove={() => setWatchAccounts((current) => current.filter((_, rowIndex) => rowIndex !== index))}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-medium">追蹤網站</h2>
              <p className="mt-2 text-sm text-neutral-400">固定站點、文件頁、產品頁面；適合競品官網、公告頁、產品更新頁。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sectionBadge('目前網站數', String(watchSites.length))}
                {sectionBadge('用途', '固定追官網與文件')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => addItem('sites')}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/10 sm:self-start"
            >
              新增網站
            </button>
          </div>
          <div className="space-y-4">
            {watchSites.map((item, index) => (
              <WatchSiteCard
                key={`${item.label || 'site'}-${index}`}
                item={item}
                index={index}
                onChange={(next) =>
                  setWatchSites((current) => current.map((row, rowIndex) => (rowIndex === index ? next : row)))
                }
                onRemove={() => setWatchSites((current) => current.filter((_, rowIndex) => rowIndex !== index))}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
