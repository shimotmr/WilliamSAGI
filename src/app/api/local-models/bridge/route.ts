import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const BRIDGE_SCRIPT = '/Users/travis/clawd/scripts/offline_model_web_bridge.py'

type BridgeRequest = {
  model?: string
  query?: string
  skills?: string[]
  provider?: 'auto' | 'brave' | 'tavily' | 'duckduckgo'
  maxResults?: number
  fetchPages?: number
  autoSkillRoute?: boolean
  autoSkillRouteMulti?: boolean
  maxAutoSkills?: number
  strictSites?: boolean
  sites?: string[]
  topics?: string[]
  includeInternal?: boolean
  internalAgent?: string
  internalLimit?: number
}

export const dynamic = 'force-dynamic'

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BridgeRequest
    const model = body.model?.trim()
    const query = body.query?.trim()

    if (!model || !query) {
      return NextResponse.json({ error: 'model 與 query 為必填' }, { status: 400 })
    }

    const args = [BRIDGE_SCRIPT, '--model', model, '--query', query, '--json']
    const provider = body.provider ?? 'auto'
    args.push('--provider', provider)
    args.push('--max-results', String(Math.max(0, body.maxResults ?? 3)))
    args.push('--fetch-pages', String(Math.max(0, body.fetchPages ?? 1)))
    args.push('--max-auto-skills', String(Math.max(1, body.maxAutoSkills ?? 2)))

    const skills = asStringList(body.skills)
    if (skills.length > 0) args.push('--skills', ...skills)

    const sites = asStringList(body.sites)
    if (sites.length > 0) args.push('--sites', ...sites)

    const topics = asStringList(body.topics)
    if (topics.length > 0) args.push('--topics', ...topics)

    if (body.autoSkillRoute) args.push('--auto-skill-route')
    if (body.autoSkillRouteMulti) args.push('--auto-skill-route-multi')
    if (body.strictSites || (body.strictSites === undefined && sites.length > 0)) args.push('--strict-sites')
    if (body.includeInternal) {
      args.push('--include-internal')
      args.push('--internal-agent', (body.internalAgent || 'researcher').trim())
      args.push('--internal-limit', String(Math.max(1, body.internalLimit ?? 4)))
    }

    const { stdout, stderr } = await execFileAsync('python3', args, {
      timeout: 180000,
      maxBuffer: 4 * 1024 * 1024,
    })

    const parsed = JSON.parse(stdout)
    return NextResponse.json({
      ok: true,
      stderr: stderr?.trim() || null,
      ...parsed,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'bridge 執行失敗',
      },
      { status: 500 },
    )
  }
}
