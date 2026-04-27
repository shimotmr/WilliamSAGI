import { randomUUID } from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import { createHubMemoryClient, resolveHubMemoryAccess } from '@/lib/hub-memory/server'

export const dynamic = 'force-dynamic'

type JsonRow = Record<string, unknown>

function toObject(value: unknown): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {}
  }
  return {}
}

function chunkRows<T>(items: T[], size = 200): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function coerceRows(input: unknown): JsonRow[] {
  if (!Array.isArray(input)) return []
  return input.filter((item): item is JsonRow => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
}

function prepareClaims(rows: JsonRow[]) {
  return rows.map((row) => ({
    id: String(row.id),
    source_system: String(row.source_system || row.sourceSystem || 'unknown'),
    claim_text: String(row.claim_text || row.claimText || ''),
    normalized_text: String(row.normalized_text || row.normalizedText || ''),
    layer: String(row.layer || 'semantic'),
    claim_type: String(row.claim_type || row.claimType || 'claim'),
    scope: row.scope ? String(row.scope) : null,
    status: String(row.status || 'active'),
    confidence: Number(row.confidence ?? 0.5),
    freshness: Number(row.freshness ?? 0.5),
    evidence_count: Number(row.evidence_count ?? row.evidenceCount ?? 1),
    contradiction_count: Number(row.contradiction_count ?? row.contradictionCount ?? 0),
    access_count: Number(row.access_count ?? row.accessCount ?? 0),
    reinforcement_count: Number(row.reinforcement_count ?? row.reinforcementCount ?? 0),
    version_fit: Number(row.version_fit ?? row.versionFit ?? 1),
    last_accessed_at: row.last_accessed_at ? String(row.last_accessed_at) : row.lastAccessedAt ? String(row.lastAccessedAt) : null,
    superseded_by: row.superseded_by ? String(row.superseded_by) : row.supersededBy ? String(row.supersededBy) : null,
    source_ref: row.source_ref ? String(row.source_ref) : row.sourceRef ? String(row.sourceRef) : null,
    metadata_json: toObject(row.metadata_json ?? row.metadataJson),
    created_at: String(row.created_at || row.createdAt || new Date().toISOString()),
    updated_at: String(row.updated_at || row.updatedAt || new Date().toISOString()),
  }))
}

function prepareReferences(rows: JsonRow[]) {
  return rows.map((row) => ({
    id: String(row.id),
    source_system: String(row.source_system || row.sourceSystem || 'unknown'),
    ref_type: String(row.ref_type || row.refType || 'reference'),
    title: row.title ? String(row.title) : null,
    source_ref: String(row.source_ref || row.sourceRef || ''),
    content: String(row.content || ''),
    review_status: String(row.review_status || row.reviewStatus || 'unreviewed'),
    quality_score: Number(row.quality_score ?? row.qualityScore ?? 0),
    freshness: Number(row.freshness ?? 0.5),
    metadata_json: toObject(row.metadata_json ?? row.metadataJson),
    created_at: String(row.created_at || row.createdAt || new Date().toISOString()),
    updated_at: String(row.updated_at || row.updatedAt || new Date().toISOString()),
  }))
}

function prepareRelations(rows: JsonRow[]) {
  return rows.map((row) => ({
    id: String(row.id),
    from_kind: String(row.from_kind || row.fromKind || ''),
    from_id: String(row.from_id || row.fromId || ''),
    relation: String(row.relation || ''),
    to_kind: String(row.to_kind || row.toKind || ''),
    to_id: String(row.to_id || row.toId || ''),
    weight: Number(row.weight ?? 1),
    metadata_json: toObject(row.metadata_json ?? row.metadataJson),
    created_at: String(row.created_at || row.createdAt || new Date().toISOString()),
  }))
}

function prepareEvents(rows: JsonRow[]) {
  return rows.map((row) => ({
    id: String(row.id),
    source_system: String(row.source_system || row.sourceSystem || 'unknown'),
    source_type: String(row.source_type || row.sourceType || 'event'),
    source_ref: String(row.source_ref || row.sourceRef || ''),
    agent: row.agent ? String(row.agent) : null,
    title: row.title ? String(row.title) : null,
    body: String(row.body || ''),
    event_time: row.event_time ? String(row.event_time) : row.eventTime ? String(row.eventTime) : null,
    layer: String(row.layer || 'episodic'),
    raw_payload: toObject(row.raw_payload ?? row.rawPayload),
    hash: String(row.hash || ''),
    created_at: String(row.created_at || row.createdAt || new Date().toISOString()),
  }))
}

function prepareFeedback(rows: JsonRow[]) {
  return rows.map((row) => ({
    id: String(row.id),
    claim_id: String(row.claim_id || row.claimId || ''),
    actor: String(row.actor || 'unknown'),
    action: String(row.action || 'feedback'),
    correction_text: row.correction_text ? String(row.correction_text) : row.correctionText ? String(row.correctionText) : null,
    evidence_ref: row.evidence_ref ? String(row.evidence_ref) : row.evidenceRef ? String(row.evidenceRef) : null,
    metadata_json: toObject(row.metadata_json ?? row.metadataJson),
    created_at: String(row.created_at || row.createdAt || new Date().toISOString()),
  }))
}

function prepareAgentProfiles(rows: JsonRow[]) {
  return rows.map((row) => ({
    name: String(row.name),
    config_json: toObject(row.config_json ?? row.configJson),
    created_at: String(row.created_at || row.createdAt || new Date().toISOString()),
    updated_at: String(row.updated_at || row.updatedAt || new Date().toISOString()),
  }))
}

async function upsertTable(table: string, rows: JsonRow[]) {
  if (!rows.length) return 0
  const supabase = createHubMemoryClient()
  let affected = 0
  for (const chunk of chunkRows(rows)) {
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' })
    if (error) {
      throw new Error(`${table} upsert failed: ${error.message}`)
    }
    affected += chunk.length
  }
  return affected
}

export async function POST(request: NextRequest) {
  const access = await resolveHubMemoryAccess(request, { allowBearerToken: true })
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const body = await request.json()
    const sourceSystem = typeof body?.sourceSystem === 'string' && body.sourceSystem.trim()
      ? body.sourceSystem.trim()
      : typeof body?.source_system === 'string' && body.source_system.trim()
        ? body.source_system.trim()
        : 'unknown'
    const importer = typeof body?.importer === 'string' && body.importer.trim() ? body.importer.trim() : sourceSystem
    const checkpointId = typeof body?.checkpointId === 'string' ? body.checkpointId : typeof body?.checkpoint_id === 'string' ? body.checkpoint_id : null
    const expectedItemCount =
      typeof body?.expectedItemCount === 'number'
        ? body.expectedItemCount
        : typeof body?.expected_item_count === 'number'
          ? body.expected_item_count
          : null
    const expectedCounts = toObject(body?.expectedCounts ?? body?.expected_counts)

    const memoryClaims = prepareClaims(coerceRows(body?.memoryClaims ?? body?.memory_claims))
    const referenceItems = prepareReferences(coerceRows(body?.referenceItems ?? body?.reference_items))
    const memoryRelations = prepareRelations(coerceRows(body?.memoryRelations ?? body?.memory_relations))
    const memoryEvents = prepareEvents(coerceRows(body?.memoryEvents ?? body?.memory_events))
    const memoryFeedback = prepareFeedback(coerceRows(body?.memoryFeedback ?? body?.memory_feedback))
    const agentProfiles = prepareAgentProfiles(coerceRows(body?.agentProfiles ?? body?.agent_profiles))

    const counts = {
      memory_claims: await upsertTable('memory_claims', memoryClaims),
      reference_items: await upsertTable('reference_items', referenceItems),
      memory_relations: await upsertTable('memory_relations', memoryRelations),
      memory_events: await upsertTable('memory_events', memoryEvents),
      memory_feedback: await upsertTable('memory_feedback', memoryFeedback),
      agent_profiles: 0,
    }

    if (agentProfiles.length) {
      const supabase = createHubMemoryClient()
      for (const chunk of chunkRows(agentProfiles)) {
        const { error } = await supabase.from('agent_profiles').upsert(chunk, { onConflict: 'name' })
        if (error) {
          throw new Error(`agent_profiles upsert failed: ${error.message}`)
        }
        counts.agent_profiles += chunk.length
      }
    }

    const itemCount = Object.values(counts).reduce((sum, value) => sum + value, 0)
    const importItemCount = typeof expectedItemCount === 'number' && Number.isFinite(expectedItemCount)
      ? expectedItemCount
      : itemCount
    const importRunId =
      typeof body?.importRunId === 'string' && body.importRunId.trim()
        ? body.importRunId.trim()
        : typeof body?.import_run_id === 'string' && body.import_run_id.trim()
          ? body.import_run_id.trim()
          : `memrun_${randomUUID()}`

    const supabase = createHubMemoryClient()
    const { error: importRunError } = await supabase.from('memory_import_runs').upsert({
      id: importRunId,
      importer,
      source_system: sourceSystem,
      checkpoint_id: checkpointId,
      item_count: importItemCount,
      status: 'ok',
      notes: JSON.stringify({
        chunkNotes: body?.notes ? String(body.notes) : null,
        expectedCounts,
      }),
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (importRunError) {
      throw new Error(`memory_import_runs upsert failed: ${importRunError.message}`)
    }

    return NextResponse.json({
      ok: true,
      accessMode: access.mode,
      importer,
      sourceSystem,
      checkpointId,
      importRunId,
      counts,
      itemCount,
      expectedItemCount: importItemCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'shared memory ingest 失敗' },
      { status: 500 },
    )
  }
}
