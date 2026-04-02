import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'

import { verifySession, authCookieName } from '@/lib/auth/session'
import {
  exportSearchIntelToJson,
  getSearchIntelSnapshot,
  importSearchIntelFromJson,
  recordHybridRun,
  saveSources,
  saveTagGroups,
  saveTopics,
  saveWatchlist,
} from '@/lib/search-intel/store'

const execFileAsync = promisify(execFile)
const CLAWD_ROOT = '/Users/travis/clawd'
const PYTHON_BIN = '/opt/homebrew/bin/python3'
const TAG_INTEL_COLLECTOR = `${CLAWD_ROOT}/scripts/tag_intel_collector.py`
const SEARCH_HYBRID_PIPELINE = `${CLAWD_ROOT}/scripts/search_hybrid_pipeline.py`
const AGENT_REACH_BIN = '/Users/travis/.agent-reach-venv/bin/agent-reach'
const ALLOWED_ARTIFACT_ROOTS = ['/tmp', CLAWD_ROOT]

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: '未登入' }, { status: 401 })
  const session = await verifySession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '需要管理員權限' }, { status: 403 })
  }
  return null
}

export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  try {
    const snapshot = await getSearchIntelSnapshot()
    return NextResponse.json(snapshot)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '讀取 Search Intel 失敗' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const body = await request.json()
    const tasks: Promise<unknown>[] = []

    if (Array.isArray(body.sources)) tasks.push(saveSources(body.sources))
    if (Array.isArray(body.topics)) tasks.push(saveTopics(body.topics))
    if (Array.isArray(body.tagGroups)) tasks.push(saveTagGroups(body.tagGroups))
    if (body.watchlist && typeof body.watchlist === 'object') tasks.push(saveWatchlist(body.watchlist))

    if (!tasks.length) {
      return NextResponse.json({ error: '缺少 sources、topics、tagGroups 或 watchlist' }, { status: 400 })
    }

    await Promise.all(tasks)
    const snapshot = await getSearchIntelSnapshot()
    return NextResponse.json({ ok: true, snapshot })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '儲存 Search Intel 失敗' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const body = await request.json()
    const action = body?.action

    if (action === 'import') {
      const result = await importSearchIntelFromJson()
      const snapshot = await getSearchIntelSnapshot()
      return NextResponse.json({ ok: true, action, result, snapshot })
    }

    if (action === 'export') {
      const result = await exportSearchIntelToJson()
      const snapshot = await getSearchIntelSnapshot()
      return NextResponse.json({ ok: true, action, result, snapshot })
    }

    if (action === 'read_artifact') {
      const artifactPath = typeof body?.path === 'string' ? body.path.trim() : ''
      if (!artifactPath) {
        return NextResponse.json({ error: '缺少 artifact path' }, { status: 400 })
      }

      const resolvedPath = path.resolve(artifactPath)
      const allowed = ALLOWED_ARTIFACT_ROOTS.some((root) => resolvedPath === root || resolvedPath.startsWith(`${root}/`))
      if (!allowed) {
        return NextResponse.json({ error: '不允許讀取此路徑' }, { status: 403 })
      }

      const raw = await fs.readFile(resolvedPath, 'utf8')
      return NextResponse.json({
        ok: true,
        action,
        path: resolvedPath,
        content: JSON.parse(raw),
      })
    }

    if (action === 'run_collector') {
      const provider =
        typeof body?.provider === 'string' && body.provider.length > 0 ? body.provider : 'auto'
      const args = [TAG_INTEL_COLLECTOR, '--provider', provider, '--publish']
      const watchGroup = typeof body?.watchGroup === 'string' ? body.watchGroup.trim() : ''

      if (typeof body?.limitTags === 'number' && body.limitTags > 0) {
        args.push('--limit-tags', String(body.limitTags))
      }

      if (typeof body?.limitSources === 'number' && body.limitSources > 0) {
        args.push('--limit-sources', String(body.limitSources))
      }

      if (watchGroup) {
        args.push('--watch-group', watchGroup)
      }

      const { stdout, stderr } = await execFileAsync(PYTHON_BIN, args, {
        cwd: CLAWD_ROOT,
        timeout: 120_000,
        maxBuffer: 1024 * 1024,
      })

      const snapshot = await getSearchIntelSnapshot()
      return NextResponse.json({
        ok: true,
        action,
        result: stdout.trim() ? JSON.parse(stdout.trim()) : { ok: true },
        stderr: stderr.trim() || null,
        snapshot,
      })
    }

    if (action === 'agent_reach_watch') {
      const { stdout, stderr } = await execFileAsync(AGENT_REACH_BIN, ['watch'], {
        cwd: CLAWD_ROOT,
        timeout: 60_000,
        maxBuffer: 1024 * 1024 * 2,
      })

      const raw = stdout.trim()
      const match = raw.match(/版本:\s*(v[^\s]+)\s*\|\s*渠道:\s*(\d+)\/(\d+)/)
      const warnings = raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('[!]') || line.startsWith('[X]'))
        .slice(0, 8)

      return NextResponse.json({
        ok: true,
        action,
        result: {
          ok: true,
          version: match?.[1] || null,
          availableChannels: match ? Number(match[2]) : null,
          totalChannels: match ? Number(match[3]) : null,
          warnings,
          raw,
          stderr: stderr.trim() || null,
        },
      })
    }

    if (action === 'run_hybrid') {
      const query = typeof body?.query === 'string' ? body.query.trim() : ''
      if (!query) {
        return NextResponse.json({ error: '缺少 query' }, { status: 400 })
      }

      const args = [SEARCH_HYBRID_PIPELINE, '--query', query]
      const sources = Array.isArray(body?.sources) ? body.sources.filter((item: unknown) => typeof item === 'string' && item) : []
      const topics = Array.isArray(body?.topics) ? body.topics.filter((item: unknown) => typeof item === 'string' && item) : []

      if (sources.length) args.push('--sources', ...sources)
      if (topics.length) args.push('--topics', ...topics)
      if (body?.needComparison) args.push('--need-comparison')
      if (body?.needStrategy) args.push('--need-strategy')
      if (body?.requiresDeepFetch) args.push('--requires-deep-fetch')
      if (body?.skipCloud) args.push('--skip-cloud')
      if (typeof body?.provider === 'string' && body.provider.length > 0) {
        args.push('--provider', body.provider)
      }
      if (typeof body?.maxResults === 'number' && body.maxResults > 0) {
        args.push('--max-results', String(body.maxResults))
      }
      if (typeof body?.fetchPages === 'number' && body.fetchPages > 0) {
        args.push('--fetch-pages', String(body.fetchPages))
      }

      const { stdout, stderr } = await execFileAsync(PYTHON_BIN, args, {
        cwd: CLAWD_ROOT,
        timeout: 180_000,
        maxBuffer: 4 * 1024 * 1024,
      })

      const result = stdout.trim() ? JSON.parse(stdout.trim()) : { ok: true }
      await recordHybridRun({
        query,
        classification_level: result?.classification?.level ?? null,
        classification_route: result?.classification?.route ?? null,
        provider: typeof body?.provider === 'string' && body.provider.length > 0 ? body.provider : 'auto',
        sources,
        topics,
        need_comparison: Boolean(body?.needComparison),
        need_strategy: Boolean(body?.needStrategy),
        requires_deep_fetch: Boolean(body?.requiresDeepFetch),
        skip_cloud: Boolean(body?.skipCloud),
        cloud_ok: result?.cloud_result?.ok ?? null,
        cloud_provider: result?.cloud_result?.provider ?? null,
        cloud_model: result?.cloud_result?.model ?? null,
        artifact_paths: result?.artifact_paths ?? {},
        metadata: {
          stderr: stderr.trim() || null,
          execution_plan: result?.execution_plan ?? null,
          evidence_bundle: result?.evidence_bundle ?? null,
        },
      })

      const snapshot = await getSearchIntelSnapshot()
      return NextResponse.json({
        ok: true,
        action,
        result,
        stderr: stderr.trim() || null,
        snapshot,
      })
    }

    return NextResponse.json({ error: '不支援的 action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search Intel 動作失敗' },
      { status: 500 }
    )
  }
}
