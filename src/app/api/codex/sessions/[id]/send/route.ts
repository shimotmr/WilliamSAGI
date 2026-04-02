import { NextResponse } from 'next/server'
import { spawn } from 'child_process'

import { getCodexSession } from '@/lib/codex-sessions'

export const runtime = 'nodejs'

type Body = {
  prompt?: string
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const sessionId = decodeURIComponent(id)
    const body = (await request.json()) as Body
    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json({ error: 'prompt 不可為空' }, { status: 400 })
    }

    const session = await getCodexSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: '找不到 session' }, { status: 404 })
    }

    const cwd = session.cwd || process.cwd()
    const trustConfig = `projects."${cwd.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}".trust_level="trusted"`
    const child = spawn(
      'codex',
      [
        '-c',
        trustConfig,
        'resume',
        session.id,
        prompt,
        '--full-auto',
        '--sandbox',
        'workspace-write',
        '--ask-for-approval',
        'never',
        '--no-alt-screen',
        '-C',
        cwd,
      ],
      {
        cwd,
        detached: true,
        stdio: 'ignore',
      },
    )

    child.unref()

    return NextResponse.json({
      ok: true,
      mode: 'sse',
      note: '已背景送出給 codex resume；新訊息會透過 SSE 從 session 檔案回補。',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '送出失敗',
      },
      { status: 500 },
    )
  }
}
