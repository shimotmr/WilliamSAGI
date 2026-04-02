import { NextResponse } from 'next/server'

import { listCodexSessions } from '@/lib/codex-sessions'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const sessions = await listCodexSessions()
    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '無法讀取 Codex sessions',
      },
      { status: 500 },
    )
  }
}
