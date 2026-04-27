import { NextRequest, NextResponse } from 'next/server'

import { createHubMemoryClient, resolveHubMemoryAccess } from '@/lib/hub-memory/server'

export const dynamic = 'force-dynamic'

function normalizeLimit(rawLimit: string | null): number {
  const parsed = Number.parseInt(rawLimit || '10', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return 10
  return Math.min(parsed, 50)
}

async function runSearch(queryText: string, agent: string, limit: number) {
  const supabase = createHubMemoryClient()
  const { data, error } = await supabase.rpc('hub_memory_search', {
    query_text: queryText,
    agent_name: agent,
    max_results: limit,
  })

  if (error) {
    throw new Error(`hub_memory_search failed: ${error.message}`)
  }

  return data ?? []
}

export async function GET(request: NextRequest) {
  const access = await resolveHubMemoryAccess(request, { allowBearerToken: true })
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const queryText = request.nextUrl.searchParams.get('q')?.trim() || ''
  const agent = request.nextUrl.searchParams.get('agent')?.trim() || 'codex'
  const limit = normalizeLimit(request.nextUrl.searchParams.get('limit'))

  if (!queryText) {
    return NextResponse.json({ error: '缺少 q 參數' }, { status: 400 })
  }

  try {
    const items = await runSearch(queryText, agent, limit)
    return NextResponse.json({
      ok: true,
      accessMode: access.mode,
      query: queryText,
      agent,
      limit,
      items,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'shared memory search 失敗' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const access = await resolveHubMemoryAccess(request, { allowBearerToken: true })
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const body = await request.json()
    const queryText = typeof body?.query === 'string' ? body.query.trim() : ''
    const agent = typeof body?.agent === 'string' && body.agent.trim() ? body.agent.trim() : 'codex'
    const limit = normalizeLimit(String(body?.limit ?? '10'))

    if (!queryText) {
      return NextResponse.json({ error: '缺少 query' }, { status: 400 })
    }

    const items = await runSearch(queryText, agent, limit)
    return NextResponse.json({
      ok: true,
      accessMode: access.mode,
      query: queryText,
      agent,
      limit,
      items,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'shared memory search 失敗' },
      { status: 500 },
    )
  }
}
