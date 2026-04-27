import { NextRequest, NextResponse } from 'next/server'

import { createHubMemoryClient, resolveHubMemoryAccess } from '@/lib/hub-memory/server'

export const dynamic = 'force-dynamic'

type SourceRow = { source_system: string | null }
type ClaimClusterRow = {
  id: string
  source_system: string
  claim_type: string | null
  confidence: number | null
  freshness: number | null
  version_fit: number | null
  evidence_count: number | null
  status: string | null
  updated_at: string | null
  metadata_json: unknown
}
type ReferenceClusterRow = {
  id: string
  source_system: string
  title: string | null
  quality_score: number | null
  freshness: number | null
  review_status: string | null
  updated_at: string | null
  metadata_json: unknown
}
type ImportRunRow = {
  id: string
  importer: string
  source_system: string
  checkpoint_id: string | null
  item_count: number
  status: string
  notes: string | null
  created_at: string
}

const tagAliasGroups: Record<string, string[]> = {
  'topic/shared-memory': ['topic/unified-memory', 'topic/canonical-memory', 'topic/memory-ledger', 'topic/hub-memory'],
  'topic/cloud-code': ['topic/claude-code', 'topic/claude'],
  'agent/cloud-code': ['agent/claude', 'agent/claude-code'],
  'source/cloud-code': ['source/claude', 'source/claude-code'],
}

const tagImpliedRelations: Record<string, string[]> = {
  'agent/openclaw': ['topic/openclaw'],
  'agent/hermes': ['topic/hermes'],
  'agent/codex': ['topic/codex'],
  'agent/cloud-code': ['topic/cloud-code'],
  'project/clawd': ['topic/shared-memory'],
  'project/william-sagi': ['topic/william-sagi'],
  'system/obsidian': ['topic/obsidian'],
  'system/supabase': ['topic/supabase'],
  'system/vercel': ['topic/vercel'],
}

const topicTitleOverrides: Record<string, string> = {
  'topic/shared-memory': 'Shared Memory',
  'topic/qmd-rag': 'QMD / RAG',
  'topic/cloud-code': 'Cloud Code',
  'topic/william-sagi': 'WilliamSAGI',
  'topic/upgrade-intel': 'Upgrade Intel',
}

const topicCategoryOverrides: Record<string, 'domain' | 'project' | 'agent'> = {
  'topic/shared-memory': 'domain',
  'topic/upgrade-intel': 'domain',
  'topic/search': 'domain',
  'topic/sync': 'domain',
  'topic/telegram': 'domain',
  'topic/supabase': 'domain',
  'topic/vercel': 'domain',
  'topic/qmd-rag': 'domain',
  'topic/obsidian': 'domain',
  'topic/graph': 'domain',
  'topic/notion': 'domain',
  'topic/william-sagi': 'project',
  'topic/codex': 'agent',
  'topic/openclaw': 'agent',
  'topic/hermes': 'agent',
  'topic/cloud-code': 'agent',
}

const tagAliasLookup = new Map<string, string>()
for (const [canonical, aliases] of Object.entries(tagAliasGroups)) {
  for (const alias of aliases) {
    tagAliasLookup.set(alias, canonical)
  }
}

function parseImportNotes(value: string | null) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {}
  return null
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return {}
    }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function slugifyTag(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9/_-]+/g, '-').replace(/^[-/]+|[-/]+$/g, '')
}

function normalizeTagValue(value: string): string {
  if (!value) return ''
  if (value.includes('/')) {
    return value
      .split('/')
      .map((segment) => slugifyTag(segment))
      .filter(Boolean)
      .join('/')
  }
  return slugifyTag(value)
}

function canonicalizeTag(tag: string): string {
  const normalized = normalizeTagValue(tag)
  if (!normalized) return ''
  return tagAliasLookup.get(normalized) ?? normalized
}

function canonicalizeTags(tags: string[]): string[] {
  const canonical = new Set<string>()
  const pending = [...tags]
  while (pending.length > 0) {
    const current = pending.pop()
    if (!current) continue
    const tag = canonicalizeTag(current)
    if (!tag || canonical.has(tag)) continue
    canonical.add(tag)
    for (const implied of tagImpliedRelations[tag] ?? []) {
      if (!canonical.has(implied)) pending.push(implied)
    }
  }
  return Array.from(canonical).sort()
}

function topicSlug(tag: string): string {
  return tag.includes('/') ? tag.split('/').slice(1).join('/') : tag
}

function topicTitle(tag: string): string {
  return topicTitleOverrides[tag] ?? topicSlug(tag).replace(/-/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

function claimWeight(row: ClaimClusterRow): number {
  const statusBonus = row.status === 'active' ? 0.08 : 0.02
  const evidenceBonus = Math.min(0.22, (row.evidence_count ?? 0) * 0.04)
  return Number(
    (
      (row.confidence ?? 0) * 0.62 +
      (row.freshness ?? 0) * 0.22 +
      (row.version_fit ?? 1) * 0.08 +
      evidenceBonus +
      statusBonus
    ).toFixed(6),
  )
}

function referenceWeight(row: ReferenceClusterRow): number {
  const reviewBonus = row.review_status === 'reviewed' ? 0.08 : 0.03
  return Number((((row.quality_score ?? 0) * 0.68) + ((row.freshness ?? 0) * 0.24) + reviewBonus).toFixed(6))
}

function buildTopicClusters(claimRows: ClaimClusterRow[], referenceRows: ReferenceClusterRow[]) {
  type TopicCluster = {
    tag: string
    slug: string
    title: string
    category: 'domain' | 'project' | 'agent'
    score: number
    claim_count: number
    reference_count: number
    source_counts: Map<string, number>
    top_claims: { id: string; label: string; score: number }[]
    top_references: { id: string; label: string; score: number }[]
  }

  const clusters = new Map<string, TopicCluster>()

  function rememberTop(
    items: { id: string; label: string; score: number }[],
    next: { id: string; label: string; score: number },
  ) {
    items.push(next)
    items.sort((left, right) => right.score - left.score)
    items.splice(6)
  }

  function ensureCluster(tag: string): TopicCluster {
    const existing = clusters.get(tag)
    if (existing) return existing
    const cluster: TopicCluster = {
      tag,
      slug: topicSlug(tag),
      title: topicTitle(tag),
      category: topicCategoryOverrides[tag] ?? 'domain',
      score: 0,
      claim_count: 0,
      reference_count: 0,
      source_counts: new Map<string, number>(),
      top_claims: [],
      top_references: [],
    }
    clusters.set(tag, cluster)
    return cluster
  }

  for (const row of claimRows) {
    const metadata = parseMetadata(row.metadata_json)
    const tags = canonicalizeTags(Array.isArray(metadata.tags) ? metadata.tags.map((item) => String(item)) : [])
    const topicTags = tags.filter((tag) => tag.startsWith('topic/'))
    if (topicTags.length === 0) continue
    const weight = claimWeight(row)
    for (const tag of topicTags) {
      const cluster = ensureCluster(tag)
      cluster.score += weight
      cluster.claim_count += 1
      cluster.source_counts.set(row.source_system, (cluster.source_counts.get(row.source_system) ?? 0) + 1)
      rememberTop(cluster.top_claims, {
        id: row.id,
        label: `${row.claim_type || 'claim'} · ${row.id}`,
        score: Number(weight.toFixed(4)),
      })
    }
  }

  for (const row of referenceRows) {
    const metadata = parseMetadata(row.metadata_json)
    const tags = canonicalizeTags(Array.isArray(metadata.tags) ? metadata.tags.map((item) => String(item)) : [])
    const topicTags = tags.filter((tag) => tag.startsWith('topic/'))
    if (topicTags.length === 0) continue
    const weight = referenceWeight(row)
    for (const tag of topicTags) {
      const cluster = ensureCluster(tag)
      cluster.score += weight
      cluster.reference_count += 1
      cluster.source_counts.set(row.source_system, (cluster.source_counts.get(row.source_system) ?? 0) + 1)
      rememberTop(cluster.top_references, {
        id: row.id,
        label: row.title || row.id,
        score: Number(weight.toFixed(4)),
      })
    }
  }

  const totalScore = Array.from(clusters.values()).reduce((sum, cluster) => sum + cluster.score, 0) || 1

  return Array.from(clusters.values())
    .map((cluster) => ({
      tag: cluster.tag,
      slug: cluster.slug,
      title: cluster.title,
      category: cluster.category,
      score: Number(cluster.score.toFixed(4)),
      claim_count: cluster.claim_count,
      reference_count: cluster.reference_count,
      total_items: cluster.claim_count + cluster.reference_count,
      share: Number((cluster.score / totalScore).toFixed(4)),
      source_counts: Object.fromEntries(
        Array.from(cluster.source_counts.entries()).sort((left, right) => right[1] - left[1]),
      ),
      top_claims: cluster.top_claims,
      top_references: cluster.top_references,
    }))
    .sort((left, right) => {
      const categoryOrder = { domain: 0, project: 1, agent: 2 }
      return (
        categoryOrder[left.category] - categoryOrder[right.category] ||
        right.score - left.score ||
        right.total_items - left.total_items
      )
    })
}

async function fetchSourceRows(tableName: string) {
  const supabase = createHubMemoryClient()
  const { data, error } = await supabase.from(tableName).select('source_system')
  if (error) {
    throw new Error(`${tableName} source query failed: ${error.message}`)
  }
  return (data ?? []) as SourceRow[]
}

async function fetchTableCount(tableName: string) {
  const supabase = createHubMemoryClient()
  const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true })
  if (error) {
    throw new Error(`${tableName} count failed: ${error.message}`)
  }
  return count ?? 0
}

export async function GET(request: NextRequest) {
  const access = await resolveHubMemoryAccess(request, { allowBearerToken: true })
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const supabase = createHubMemoryClient()
    const [
      claims,
      references,
      relations,
      events,
      feedback,
      agentProfiles,
      claimSources,
      referenceSources,
      eventSources,
      importRunsResult,
      topicClaimRowsResult,
      topicReferenceRowsResult,
    ] = await Promise.all([
      fetchTableCount('memory_claims'),
      fetchTableCount('reference_items'),
      fetchTableCount('memory_relations'),
      fetchTableCount('memory_events'),
      fetchTableCount('memory_feedback'),
      fetchTableCount('agent_profiles'),
      fetchSourceRows('memory_claims'),
      fetchSourceRows('reference_items'),
      fetchSourceRows('memory_events'),
      supabase
        .from('memory_import_runs')
        .select('id, importer, source_system, checkpoint_id, item_count, status, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('memory_claims')
        .select('id, source_system, claim_type, confidence, freshness, version_fit, evidence_count, status, updated_at, metadata_json')
        .order('updated_at', { ascending: false })
        .limit(1200),
      supabase
        .from('reference_items')
        .select('id, source_system, title, quality_score, freshness, review_status, updated_at, metadata_json')
        .order('updated_at', { ascending: false })
        .limit(1200),
    ])

    if (importRunsResult.error) {
      throw new Error(`memory_import_runs query failed: ${importRunsResult.error.message}`)
    }
    if (topicClaimRowsResult.error) {
      throw new Error(`memory_claims cluster query failed: ${topicClaimRowsResult.error.message}`)
    }
    if (topicReferenceRowsResult.error) {
      throw new Error(`reference_items cluster query failed: ${topicReferenceRowsResult.error.message}`)
    }

    const counts = {
      memory_claims: claims,
      reference_items: references,
      memory_relations: relations,
      memory_events: events,
      memory_feedback: feedback,
      agent_profiles: agentProfiles,
    }

    const sourceMap = new Map<
      string,
      {
        source_system: string
        memory_claims: number
        reference_items: number
        memory_events: number
        total: number
        share: number
      }
    >()

    function addSourceCount(sourceSystem: string | null, field: 'memory_claims' | 'reference_items' | 'memory_events') {
      const key = (sourceSystem || 'unknown').trim() || 'unknown'
      const current = sourceMap.get(key) ?? {
        source_system: key,
        memory_claims: 0,
        reference_items: 0,
        memory_events: 0,
        total: 0,
        share: 0,
      }
      current[field] += 1
      current.total += 1
      sourceMap.set(key, current)
    }

    claimSources.forEach((row) => addSourceCount(row.source_system, 'memory_claims'))
    referenceSources.forEach((row) => addSourceCount(row.source_system, 'reference_items'))
    eventSources.forEach((row) => addSourceCount(row.source_system, 'memory_events'))

    const sourceBreakdownBase = Array.from(sourceMap.values()).sort((left, right) => right.total - left.total)
    const totalSourcedItems = sourceBreakdownBase.reduce((sum, item) => sum + item.total, 0)
    const sourceBreakdown = sourceBreakdownBase.map((item) => ({
      ...item,
      share: totalSourcedItems > 0 ? Number((item.total / totalSourcedItems).toFixed(4)) : 0,
    }))

    const latestImports = ((importRunsResult.data ?? []) as ImportRunRow[]).map((item) => ({
      ...item,
      notes_json: parseImportNotes(item.notes),
    }))
    const topicClusters = buildTopicClusters(
      (topicClaimRowsResult.data ?? []) as ClaimClusterRow[],
      (topicReferenceRowsResult.data ?? []) as ReferenceClusterRow[],
    ).slice(0, 12)
    const latestImport = latestImports[0] ?? null
    const now = Date.now()
    const lastImportAt = latestImport ? new Date(latestImport.created_at).getTime() : null
    const latestImportAgeMinutes =
      lastImportAt && Number.isFinite(lastImportAt) ? Math.max(0, Math.round((now - lastImportAt) / 60000)) : null
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const importsLast24h = latestImports.filter((item) => {
      const createdAt = new Date(item.created_at).getTime()
      return Number.isFinite(createdAt) && createdAt >= oneDayAgo
    })
    const successfulImportsLast24h = importsLast24h.filter((item) => item.status === 'ok')
    const syncSummary = {
      latestImportAgeMinutes,
      lastImportAt: latestImport?.created_at ?? null,
      stalled: latestImportAgeMinutes !== null ? latestImportAgeMinutes > 15 : true,
      successfulImports24h: successfulImportsLast24h.length,
      importedItems24h: successfulImportsLast24h.reduce((sum, item) => sum + item.item_count, 0),
    }

    return NextResponse.json({
      ok: true,
      backend: 'supabase-trgm',
      accessMode: access.mode,
      counts,
      totalItems: Object.values(counts).reduce((sum, value) => sum + value, 0),
      latestImport,
      latestImports,
      sourceBreakdown,
      topicClusters,
      syncSummary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '讀取 shared memory status 失敗' },
      { status: 500 },
    )
  }
}
