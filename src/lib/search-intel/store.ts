import 'server-only'

import fs from 'node:fs/promises'
import path from 'node:path'

import { createServiceRoleClient } from '@/lib/supabase-server'

export type SearchSource = {
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

export type SearchTopic = {
  id: string
  label: string
  keywords?: string[]
  suggested_sources?: string[]
  default_time_range_days?: number
  default_level?: string
  default_mode?: string
  config?: Record<string, unknown>
}

export type SearchTagGroup = {
  id: string
  label: string
  tags?: string[]
  config?: Record<string, unknown>
}

export type WatchAccount = {
  label: string
  source: string
  query: string
  enabled?: boolean
} & Record<string, unknown>

export type WatchSite = {
  label: string
  site: string
  enabled?: boolean
} & Record<string, unknown>

export type WatchData = {
  accounts?: WatchAccount[]
  sites?: WatchSite[]
}

export type CollectorData = {
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
}

export type CollectorRun = {
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
  output_path?: string | null
  metadata?: Record<string, unknown>
  created_at: string
}

export type HybridRun = {
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
  artifact_paths?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at: string
}

type SearchSourceRow = {
  id: string
  label: string
  enabled: boolean
  category: string | null
  domains: unknown
  search_mode: string | null
  strict_domain_filter: boolean
  supports_deep_fetch: boolean
  priority: string | null
  adapter: string | null
  config: unknown
  sort_order: number
}

type SearchTopicRow = {
  id: string
  label: string
  keywords: unknown
  suggested_sources: unknown
  default_time_range_days: number | null
  default_level: string | null
  default_mode: string | null
  config: unknown
  sort_order: number
}

type SearchWatchlistRow = {
  kind: 'account' | 'site'
  label: string
  source: string | null
  query: string | null
  site: string | null
  enabled: boolean
  config: unknown
  sort_order: number
}

type SearchTagGroupRow = {
  id: string
  label: string
  tags: unknown
  config: unknown
  sort_order: number
}

type SearchCollectorRunRow = {
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
  output_path: string | null
  metadata: unknown
  created_at: string
}

type SearchHybridRunRow = {
  id: string
  query: string
  classification_level: string | null
  classification_route: string | null
  provider: string | null
  sources: unknown
  topics: unknown
  need_comparison: boolean
  need_strategy: boolean
  requires_deep_fetch: boolean
  skip_cloud: boolean
  cloud_ok: boolean | null
  cloud_provider: string | null
  cloud_model: string | null
  artifact_paths: unknown
  metadata: unknown
  created_at: string
}

type SearchIntelSnapshot = {
  sources: SearchSource[]
  topics: SearchTopic[]
  tagGroups: SearchTagGroup[]
  watchlist: WatchData
  collector: CollectorData | null
  collectorRuns: CollectorRun[]
  hybridRuns: HybridRun[]
  storage: {
    sources: 'db' | 'json'
    topics: 'db' | 'json'
    tagGroups: 'db' | 'json'
    watchlist: 'db' | 'json'
  }
}

const CLAWD_ROOT = '/Users/travis/clawd'
const SOURCE_JSON_PATH = path.join(CLAWD_ROOT, 'config', 'search_source_registry.json')
const TOPIC_JSON_PATH = path.join(CLAWD_ROOT, 'config', 'search_topic_registry.json')
const TAG_GROUP_JSON_PATH = path.join(CLAWD_ROOT, 'config', 'intel_tag_registry.json')
const WATCHLIST_JSON_PATH = path.join(CLAWD_ROOT, 'config', 'intel_watchlist.json')
const COLLECTOR_JSON_CANDIDATES = [
  path.join(process.cwd(), 'public', 'data', 'tag-intel-latest.json'),
  path.join(CLAWD_ROOT, 'data', 'tag_intel', 'latest.json'),
]

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function normalizeSource(source: SearchSource): SearchSource {
  return {
    id: String(source.id),
    label: String(source.label),
    enabled: source.enabled ?? true,
    category: source.category || undefined,
    domains: asStringArray(source.domains),
    search_mode: source.search_mode || undefined,
    strict_domain_filter: Boolean(source.strict_domain_filter),
    supports_deep_fetch: Boolean(source.supports_deep_fetch),
    priority: source.priority || undefined,
    adapter: source.adapter || undefined,
    config: asObject(source.config),
  }
}

function normalizeTopic(topic: SearchTopic): SearchTopic {
  return {
    id: String(topic.id),
    label: String(topic.label),
    keywords: asStringArray(topic.keywords),
    suggested_sources: asStringArray(topic.suggested_sources),
    default_time_range_days:
      typeof topic.default_time_range_days === 'number' ? topic.default_time_range_days : undefined,
    default_level: topic.default_level || undefined,
    default_mode: topic.default_mode || undefined,
    config: asObject(topic.config),
  }
}

function normalizeTagGroup(group: SearchTagGroup): SearchTagGroup {
  return {
    id: String(group.id),
    label: String(group.label),
    tags: asStringArray(group.tags),
    config: asObject(group.config),
  }
}

function normalizeWatchlist(watchlist: WatchData): WatchData {
  return {
    accounts: Array.isArray(watchlist.accounts)
      ? watchlist.accounts.map((item) => {
          const extras = asObject(item)
          return {
            ...extras,
            label: String(item.label),
            source: String(item.source),
            query: String(item.query),
            enabled: item.enabled ?? true,
          }
        })
      : [],
    sites: Array.isArray(watchlist.sites)
      ? watchlist.sites.map((item) => {
          const extras = asObject(item)
          return {
            ...extras,
            label: String(item.label),
            site: String(item.site),
            enabled: item.enabled ?? true,
          }
        })
      : [],
  }
}

async function loadJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function loadCollectorData(): Promise<CollectorData | null> {
  for (const candidate of COLLECTOR_JSON_CANDIDATES) {
    const data = await loadJsonFile<CollectorData>(candidate)
    if (data) return data
  }
  return null
}

async function readSourceMirror(): Promise<SearchSource[]> {
  const data = await loadJsonFile<{ sources?: SearchSource[] }>(SOURCE_JSON_PATH)
  return Array.isArray(data?.sources) ? data.sources.map(normalizeSource) : []
}

async function readTopicMirror(): Promise<SearchTopic[]> {
  const data = await loadJsonFile<{ topics?: SearchTopic[] }>(TOPIC_JSON_PATH)
  return Array.isArray(data?.topics) ? data.topics.map(normalizeTopic) : []
}

async function readTagGroupMirror(): Promise<SearchTagGroup[]> {
  const data = await loadJsonFile<{ groups?: SearchTagGroup[] }>(TAG_GROUP_JSON_PATH)
  return Array.isArray(data?.groups) ? data.groups.map(normalizeTagGroup) : []
}

async function readWatchlistMirror(): Promise<WatchData> {
  const data = await loadJsonFile<WatchData>(WATCHLIST_JSON_PATH)
  return normalizeWatchlist(data || {})
}

async function writeJsonMirror(filePath: string, payload: unknown) {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

function sourceRowToModel(row: SearchSourceRow): SearchSource {
  return normalizeSource({
    id: row.id,
    label: row.label,
    enabled: row.enabled,
    category: row.category || undefined,
    domains: asStringArray(row.domains),
    search_mode: row.search_mode || undefined,
    strict_domain_filter: row.strict_domain_filter,
    supports_deep_fetch: row.supports_deep_fetch,
    priority: row.priority || undefined,
    adapter: row.adapter || undefined,
    config: asObject(row.config),
  })
}

function topicRowToModel(row: SearchTopicRow): SearchTopic {
  return normalizeTopic({
    id: row.id,
    label: row.label,
    keywords: asStringArray(row.keywords),
    suggested_sources: asStringArray(row.suggested_sources),
    default_time_range_days: row.default_time_range_days ?? undefined,
    default_level: row.default_level || undefined,
    default_mode: row.default_mode || undefined,
    config: asObject(row.config),
  })
}

function tagGroupRowToModel(row: SearchTagGroupRow): SearchTagGroup {
  return normalizeTagGroup({
    id: row.id,
    label: row.label,
    tags: asStringArray(row.tags),
    config: asObject(row.config),
  })
}

function collectorRunRowToModel(row: SearchCollectorRunRow): CollectorRun {
  return {
    id: row.id,
    collector: row.collector,
    priority: row.priority,
    provider: row.provider,
    published: row.published,
    tags_count: row.tags_count,
    sources_count: row.sources_count,
    entries_count: row.entries_count,
    errors_count: row.errors_count,
    status: row.status,
    output_path: row.output_path,
    metadata: asObject(row.metadata),
    created_at: row.created_at,
  }
}

function hybridRunRowToModel(row: SearchHybridRunRow): HybridRun {
  return {
    id: row.id,
    query: row.query,
    classification_level: row.classification_level,
    classification_route: row.classification_route,
    provider: row.provider,
    sources: asStringArray(row.sources),
    topics: asStringArray(row.topics),
    need_comparison: row.need_comparison,
    need_strategy: row.need_strategy,
    requires_deep_fetch: row.requires_deep_fetch,
    skip_cloud: row.skip_cloud,
    cloud_ok: row.cloud_ok,
    cloud_provider: row.cloud_provider,
    cloud_model: row.cloud_model,
    artifact_paths: asObject(row.artifact_paths),
    metadata: asObject(row.metadata),
    created_at: row.created_at,
  }
}

function watchRowsToModel(rows: SearchWatchlistRow[]): WatchData {
  const accounts: WatchAccount[] = []
  const sites: WatchSite[] = []

  for (const row of rows) {
    if (row.kind === 'account') {
      accounts.push({
        ...asObject(row.config),
        label: row.label,
        source: row.source || '',
        query: row.query || '',
        enabled: row.enabled,
      })
      continue
    }
    sites.push({
      ...asObject(row.config),
      label: row.label,
      site: row.site || '',
      enabled: row.enabled,
    })
  }

  return { accounts, sites }
}

async function listSourcesFromDb(): Promise<SearchSource[] | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('search_sources')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true })

  if (error) return null
  if (!data?.length) return []
  return (data as SearchSourceRow[]).map(sourceRowToModel)
}

async function listTopicsFromDb(): Promise<SearchTopic[] | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('search_topics')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true })

  if (error) return null
  if (!data?.length) return []
  return (data as SearchTopicRow[]).map(topicRowToModel)
}

async function listTagGroupsFromDb(): Promise<SearchTagGroup[] | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('search_tag_groups')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true })

  if (error) return null
  if (!data?.length) return []
  return (data as SearchTagGroupRow[]).map(tagGroupRowToModel)
}

async function listWatchlistFromDb(): Promise<WatchData | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('search_watchlist')
    .select('kind,label,source,query,site,enabled,config,sort_order')
    .order('kind', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return null
  if (!data?.length) return { accounts: [], sites: [] }
  return watchRowsToModel(data as SearchWatchlistRow[])
}

async function listCollectorRunsFromDb(limit = 12): Promise<CollectorRun[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('search_collector_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data?.length) return []
  return (data as SearchCollectorRunRow[]).map(collectorRunRowToModel)
}

async function listHybridRunsFromDb(limit = 12): Promise<HybridRun[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('search_hybrid_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data?.length) return []
  return (data as SearchHybridRunRow[]).map(hybridRunRowToModel)
}

export async function getSearchIntelSnapshot(): Promise<SearchIntelSnapshot> {
  const [dbSources, dbTopics, dbTagGroups, dbWatchlist, collector, collectorRuns, hybridRuns] = await Promise.all([
    listSourcesFromDb(),
    listTopicsFromDb(),
    listTagGroupsFromDb(),
    listWatchlistFromDb(),
    loadCollectorData(),
    listCollectorRunsFromDb(),
    listHybridRunsFromDb(),
  ])

  const sources = dbSources && dbSources.length ? dbSources : await readSourceMirror()
  const topics = dbTopics && dbTopics.length ? dbTopics : await readTopicMirror()
  const tagGroups = dbTagGroups && dbTagGroups.length ? dbTagGroups : await readTagGroupMirror()
  const watchlist =
    dbWatchlist && ((dbWatchlist.accounts?.length || 0) > 0 || (dbWatchlist.sites?.length || 0) > 0)
      ? dbWatchlist
      : await readWatchlistMirror()

  return {
    sources,
    topics,
    tagGroups,
    watchlist,
    collector,
    collectorRuns,
    hybridRuns,
    storage: {
      sources: dbSources && dbSources.length ? 'db' : 'json',
      topics: dbTopics && dbTopics.length ? 'db' : 'json',
      tagGroups: dbTagGroups && dbTagGroups.length ? 'db' : 'json',
      watchlist:
        dbWatchlist && ((dbWatchlist.accounts?.length || 0) > 0 || (dbWatchlist.sites?.length || 0) > 0)
          ? 'db'
          : 'json',
    },
  }
}

export async function saveSources(sources: SearchSource[]) {
  const normalized = sources.map(normalizeSource)
  const supabase = createServiceRoleClient()
  const { error: deleteError } = await supabase.from('search_sources').delete().neq('id', '')
  if (deleteError) throw deleteError

  if (normalized.length) {
    const { error } = await supabase.from('search_sources').insert(
      normalized.map((item, index) => ({
        id: item.id,
        label: item.label,
        enabled: item.enabled ?? true,
        category: item.category ?? null,
        domains: item.domains ?? [],
        search_mode: item.search_mode ?? null,
        strict_domain_filter: item.strict_domain_filter ?? false,
        supports_deep_fetch: item.supports_deep_fetch ?? false,
        priority: item.priority ?? null,
        adapter: item.adapter ?? null,
        config: item.config ?? {},
        sort_order: index,
      })),
    )
    if (error) throw error
  }

  await writeJsonMirror(SOURCE_JSON_PATH, { sources: normalized })
  return normalized
}

export async function saveTopics(topics: SearchTopic[]) {
  const normalized = topics.map(normalizeTopic)
  const supabase = createServiceRoleClient()
  const { error: deleteError } = await supabase.from('search_topics').delete().neq('id', '')
  if (deleteError) throw deleteError

  if (normalized.length) {
    const { error } = await supabase.from('search_topics').insert(
      normalized.map((item, index) => ({
        id: item.id,
        label: item.label,
        keywords: item.keywords ?? [],
        suggested_sources: item.suggested_sources ?? [],
        default_time_range_days: item.default_time_range_days ?? null,
        default_level: item.default_level ?? null,
        default_mode: item.default_mode ?? null,
        config: item.config ?? {},
        sort_order: index,
      })),
    )
    if (error) throw error
  }

  await writeJsonMirror(TOPIC_JSON_PATH, { topics: normalized })
  return normalized
}

export async function saveTagGroups(tagGroups: SearchTagGroup[]) {
  const normalized = tagGroups.map(normalizeTagGroup)
  const supabase = createServiceRoleClient()
  const { error: deleteError } = await supabase.from('search_tag_groups').delete().neq('id', '')
  if (deleteError) throw deleteError

  if (normalized.length) {
    const { error } = await supabase.from('search_tag_groups').insert(
      normalized.map((item, index) => ({
        id: item.id,
        label: item.label,
        tags: item.tags ?? [],
        config: item.config ?? {},
        sort_order: index,
      })),
    )
    if (error) throw error
  }

  await writeJsonMirror(TAG_GROUP_JSON_PATH, { groups: normalized })
  return normalized
}

export async function saveWatchlist(watchlist: WatchData) {
  const normalized = normalizeWatchlist(watchlist)
  const supabase = createServiceRoleClient()

  const { error: deleteError } = await supabase.from('search_watchlist').delete().neq('label', '')
  if (deleteError) throw deleteError

  const rows = [
    ...(normalized.accounts ?? []).map((item, index) => ({
      id: crypto.randomUUID(),
      kind: 'account',
      label: item.label,
      source: item.source,
      query: item.query,
      site: null,
      enabled: item.enabled ?? true,
      config: (() => {
        const { label, source, query, enabled, ...rest } = item
        return rest
      })(),
      sort_order: index,
    })),
    ...(normalized.sites ?? []).map((item, index) => ({
      id: crypto.randomUUID(),
      kind: 'site',
      label: item.label,
      source: null,
      query: null,
      site: item.site,
      enabled: item.enabled ?? true,
      config: (() => {
        const { label, site, enabled, ...rest } = item
        return rest
      })(),
      sort_order: index,
    })),
  ]

  if (rows.length) {
    const { error } = await supabase.from('search_watchlist').insert(rows)
    if (error) throw error
  }

  await writeJsonMirror(WATCHLIST_JSON_PATH, normalized)
  return normalized
}

export async function recordHybridRun(run: {
  query: string
  classification_level?: string | null
  classification_route?: string | null
  provider?: string | null
  sources?: string[]
  topics?: string[]
  need_comparison?: boolean
  need_strategy?: boolean
  requires_deep_fetch?: boolean
  skip_cloud?: boolean
  cloud_ok?: boolean | null
  cloud_provider?: string | null
  cloud_model?: string | null
  artifact_paths?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('search_hybrid_runs').insert({
    query: run.query,
    classification_level: run.classification_level ?? null,
    classification_route: run.classification_route ?? null,
    provider: run.provider ?? null,
    sources: run.sources ?? [],
    topics: run.topics ?? [],
    need_comparison: run.need_comparison ?? false,
    need_strategy: run.need_strategy ?? false,
    requires_deep_fetch: run.requires_deep_fetch ?? false,
    skip_cloud: run.skip_cloud ?? false,
    cloud_ok: run.cloud_ok ?? null,
    cloud_provider: run.cloud_provider ?? null,
    cloud_model: run.cloud_model ?? null,
    artifact_paths: run.artifact_paths ?? {},
    metadata: run.metadata ?? {},
  })
  if (error) throw error
}

export async function importSearchIntelFromJson() {
  const [sources, topics, tagGroups, watchlist] = await Promise.all([
    readSourceMirror(),
    readTopicMirror(),
    readTagGroupMirror(),
    readWatchlistMirror(),
  ])

  await saveSources(sources)
  await saveTopics(topics)
  await saveTagGroups(tagGroups)
  await saveWatchlist(watchlist)

  return {
    sources: sources.length,
    topics: topics.length,
    tagGroups: tagGroups.length,
    watchAccounts: watchlist.accounts?.length || 0,
    watchSites: watchlist.sites?.length || 0,
  }
}

export async function exportSearchIntelToJson() {
  const [sources, topics, tagGroups, watchlist] = await Promise.all([
    listSourcesFromDb(),
    listTopicsFromDb(),
    listTagGroupsFromDb(),
    listWatchlistFromDb(),
  ])

  const finalSources = sources ?? await readSourceMirror()
  const finalTopics = topics ?? await readTopicMirror()
  const finalTagGroups = tagGroups ?? await readTagGroupMirror()
  const finalWatchlist = watchlist ?? await readWatchlistMirror()

  await writeJsonMirror(SOURCE_JSON_PATH, { sources: finalSources })
  await writeJsonMirror(TOPIC_JSON_PATH, { topics: finalTopics })
  await writeJsonMirror(TAG_GROUP_JSON_PATH, { groups: finalTagGroups })
  await writeJsonMirror(WATCHLIST_JSON_PATH, finalWatchlist)

  return {
    sources: finalSources.length,
    topics: finalTopics.length,
    tagGroups: finalTagGroups.length,
    watchAccounts: finalWatchlist.accounts?.length || 0,
    watchSites: finalWatchlist.sites?.length || 0,
  }
}
