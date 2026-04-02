import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { verifySession, authCookieName } from '@/lib/auth/session'

const execFileAsync = promisify(execFile)
const CLAWD_ROOT = '/Users/travis/clawd'
const PYTHON_BIN = '/opt/homebrew/bin/python3'
const TASK_DEBUG_SCRIPT = `${CLAWD_ROOT}/scripts/task_debug_surface.py`

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

function asPositiveInt(value: unknown) {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(num) && num > 0 ? num : null
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const body = await request.json()
    const action = typeof body?.action === 'string' ? body.action : 'task'
    const args = [TASK_DEBUG_SCRIPT, '--json']

    if (action === 'task') {
      const taskId = asPositiveInt(body?.taskId)
      if (!taskId) {
        return NextResponse.json({ error: '缺少有效 taskId' }, { status: 400 })
      }
      args.push('--task-id', String(taskId))
      if (body?.includeReportContent !== false) {
        args.push('--include-report-content')
      }
    } else if (action === 'observability') {
      const taskId = asPositiveInt(body?.taskId)
      if (!taskId) {
        return NextResponse.json({ error: '缺少有效 taskId' }, { status: 400 })
      }
      args.push('--task-id', String(taskId), '--observability')
    } else if (action === 'diagnosis') {
      const taskId = asPositiveInt(body?.taskId)
      if (!taskId) {
        return NextResponse.json({ error: '缺少有效 taskId' }, { status: 400 })
      }
      args.push('--task-id', String(taskId), '--diagnosis')
    } else if (action === 'report') {
      const reportId = asPositiveInt(body?.reportId)
      if (!reportId) {
        return NextResponse.json({ error: '缺少有效 reportId' }, { status: 400 })
      }
      args.push('--open-report', String(reportId))
    } else if (action === 'artifact') {
      const artifactPath = typeof body?.artifactPath === 'string' ? body.artifactPath.trim() : ''
      if (!artifactPath) {
        return NextResponse.json({ error: '缺少 artifactPath' }, { status: 400 })
      }
      args.push('--open-artifact', artifactPath)
    } else {
      return NextResponse.json({ error: '不支援的 action' }, { status: 400 })
    }

    if (typeof body?.previewLimit === 'number' && body.previewLimit > 0) {
      args.push('--artifact-preview-limit', String(body.previewLimit))
    }

    const { stdout, stderr } = await execFileAsync(PYTHON_BIN, args, {
      cwd: CLAWD_ROOT,
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    })

    return NextResponse.json({
      ok: true,
      action,
      result: stdout.trim() ? JSON.parse(stdout) : null,
      stderr: stderr.trim() || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Task Debug 執行失敗' },
      { status: 500 }
    )
  }
}
