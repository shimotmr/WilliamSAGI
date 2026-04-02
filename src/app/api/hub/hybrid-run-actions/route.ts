import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createClient } from '@supabase/supabase-js'

import { authCookieName, verifySession } from '@/lib/auth/session'
import { buildHybridRunTaskPayload } from '@/lib/hybrid-run-actions'

const execFileAsync = promisify(execFile)
const CREATE_TASK_SCRIPT = '/Users/travis/clawd/scripts/create_task.sh'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ ok: false, error: '未登入' }, { status: 401 })
  const session = await verifySession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false, error: '需要管理員權限' }, { status: 403 })
  }
  return null
}

function parseTaskId(stdout: string) {
  const match = stdout.match(/ID:\\s*#(\\d+)/)
  return match ? Number(match[1]) : null
}

export async function POST(request: Request) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()
    const payload = buildHybridRunTaskPayload({
      query: body?.query,
      sources: Array.isArray(body?.sources) ? body.sources : [],
      topics: Array.isArray(body?.topics) ? body.topics : [],
      classificationLevel: body?.classificationLevel,
      classificationRoute: body?.classificationRoute,
      createdAt: body?.createdAt,
    })

    const supabase = getSupabase()
    const { data: existing } = await supabase
      .from('board_tasks')
      .select('id,title,status')
      .eq('title', payload.title)
      .not('status', 'in', '(已完成,已取消)')
      .order('id', { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        taskId: existing[0].id,
        title: existing[0].title,
        status: existing[0].status,
      })
    }

    const args = [
      CREATE_TASK_SCRIPT,
      '--title',
      payload.title,
      '--assignee',
      payload.assignee,
      '--priority',
      payload.priority,
      '--description',
      payload.description,
      '--acceptance_criteria',
      payload.acceptanceCriteria,
      '--dispatch_prompt',
      payload.dispatchPrompt,
      '--dispatch_model',
      payload.dispatchModel,
      '--execution_type',
      payload.executionType,
      '--task-type',
      payload.taskType,
      '--complexity',
      payload.complexity,
      '--yes',
    ]

    const { stdout, stderr } = await execFileAsync('/bin/bash', args, {
      cwd: '/Users/travis/clawd',
      timeout: 120_000,
      maxBuffer: 1024 * 1024 * 4,
    })

    const taskId = parseTaskId(stdout)
    if (!taskId) {
      return NextResponse.json(
        { ok: false, error: '建卡腳本未回傳 task id', stdout: stdout.trim(), stderr: stderr.trim() || null },
        { status: 500 }
      )
    }

    try {
      await supabase.from('task_events').insert({
        task_id: taskId,
        event_type: 'hybrid_run_task_created',
        content: {
          source: 'search-intel',
          query: body?.query || null,
          sources: Array.isArray(body?.sources) ? body.sources : [],
          topics: Array.isArray(body?.topics) ? body.topics : [],
          classificationLevel: body?.classificationLevel || null,
          classificationRoute: body?.classificationRoute || null,
          createdAt: body?.createdAt || null,
        },
      })
    } catch {
      // non-blocking
    }

    return NextResponse.json({
      ok: true,
      duplicate: false,
      taskId,
      title: payload.title,
      assignee: payload.assignee,
      priority: payload.priority,
      stdout: stdout.trim(),
      stderr: stderr.trim() || null,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Hybrid Run 建卡失敗' },
      { status: 500 }
    )
  }
}
