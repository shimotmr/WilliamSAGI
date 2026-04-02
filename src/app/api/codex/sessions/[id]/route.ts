import { NextResponse } from 'next/server'

import { getCodexSession } from '@/lib/codex-sessions'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const session = await getCodexSession(decodeURIComponent(id))

    if (!session) {
      return NextResponse.json({ error: '找不到 session' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '無法讀取 session 明細',
      },
      { status: 500 },
    )
  }
}
