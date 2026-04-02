import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const CLAWD_ROOT = '/Users/travis/clawd'
const sourcePath = path.join(CLAWD_ROOT, 'config', 'search_source_registry.json')
const topicPath = path.join(CLAWD_ROOT, 'config', 'search_topic_registry.json')
const watchlistPath = path.join(CLAWD_ROOT, 'config', 'intel_watchlist.json')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'))

const sourceData = await readJson(sourcePath)
const topicData = await readJson(topicPath)
const watchData = await readJson(watchlistPath)

const sources = Array.isArray(sourceData.sources) ? sourceData.sources : []
const topics = Array.isArray(topicData.topics) ? topicData.topics : []
const accounts = Array.isArray(watchData.accounts) ? watchData.accounts : []
const sites = Array.isArray(watchData.sites) ? watchData.sites : []

const fail = (error, label) => {
  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }
}

await supabase.from('search_sources').delete().neq('id', '')
await supabase.from('search_topics').delete().neq('id', '')
await supabase.from('search_watchlist').delete().neq('label', '')

if (sources.length) {
  const { error } = await supabase.from('search_sources').insert(
    sources.map((item, index) => ({
      id: String(item.id),
      label: String(item.label),
      enabled: item.enabled ?? true,
      category: item.category ?? null,
      domains: Array.isArray(item.domains) ? item.domains : [],
      search_mode: item.search_mode ?? null,
      strict_domain_filter: item.strict_domain_filter ?? false,
      supports_deep_fetch: item.supports_deep_fetch ?? false,
      priority: item.priority ?? null,
      adapter: item.adapter ?? null,
      config: {},
      sort_order: index,
    }))
  )
  fail(error, 'insert search_sources failed')
}

if (topics.length) {
  const { error } = await supabase.from('search_topics').insert(
    topics.map((item, index) => ({
      id: String(item.id),
      label: String(item.label),
      keywords: Array.isArray(item.keywords) ? item.keywords : [],
      suggested_sources: Array.isArray(item.suggested_sources) ? item.suggested_sources : [],
      default_time_range_days:
        typeof item.default_time_range_days === 'number' ? item.default_time_range_days : null,
      default_level: item.default_level ?? null,
      default_mode: item.default_mode ?? null,
      config: {},
      sort_order: index,
    }))
  )
  fail(error, 'insert search_topics failed')
}

const watchRows = [
  ...accounts.map((item, index) => ({
    kind: 'account',
    label: String(item.label),
    source: String(item.source),
    query: String(item.query),
    site: null,
    enabled: item.enabled ?? true,
    config: (({ label, source, query, enabled, ...rest }) => rest)(item),
    sort_order: index,
  })),
  ...sites.map((item, index) => ({
    kind: 'site',
    label: String(item.label),
    source: null,
    query: null,
    site: String(item.site),
    enabled: item.enabled ?? true,
    config: (({ label, site, enabled, ...rest }) => rest)(item),
    sort_order: index,
  })),
]

if (watchRows.length) {
  const { error } = await supabase.from('search_watchlist').insert(watchRows)
  fail(error, 'insert search_watchlist failed')
}

console.log(
  JSON.stringify(
    {
      ok: true,
      sources: sources.length,
      topics: topics.length,
      watchAccounts: accounts.length,
      watchSites: sites.length,
    },
    null,
    2
  )
)
