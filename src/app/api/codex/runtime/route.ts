import { NextResponse } from 'next/server'
import { spawnSync } from 'child_process'

export const runtime = 'nodejs'

type RuntimeInfo = {
  mode: 'app-server' | 'sse'
  appServerAvailable: boolean
  appServerListenUrl: string
  diagnostics: string[]
}

export async function GET() {
  const diagnostics: string[] = []
  const listenUrl = process.env.CODEX_APP_SERVER_URL?.trim() || 'ws://127.0.0.1:8765'

  try {
    const help = spawnSync('codex', ['help', 'app-server'], { encoding: 'utf8', timeout: 10_000 })
    if (help.status === 0 && /--listen <URL>/.test(help.stdout || '')) {
      diagnostics.push('codex help app-server 可執行，CLI 有 app-server 子命令。')
    } else {
      diagnostics.push('codex help app-server 無法確認可用。')
    }

    const run = spawnSync('codex', ['app-server', '--listen', listenUrl], {
      encoding: 'utf8',
      timeout: 4_000,
    })

    if (run.status === 0 && !(run.stdout || '').trim() && !(run.stderr || '').trim()) {
      diagnostics.push('app-server 在這個環境會立刻退出，未保持 listener；改走 SSE fallback。')
      return NextResponse.json<RuntimeInfo>({
        mode: 'sse',
        appServerAvailable: false,
        appServerListenUrl: listenUrl,
        diagnostics,
      })
    }

    diagnostics.push('app-server 有回應，但本頁目前仍優先使用 SSE fallback。')
    return NextResponse.json<RuntimeInfo>({
      mode: 'sse',
      appServerAvailable: false,
      appServerListenUrl: listenUrl,
      diagnostics,
    })
  } catch (error) {
    diagnostics.push(error instanceof Error ? error.message : 'runtime probe failed')
    return NextResponse.json<RuntimeInfo>({
      mode: 'sse',
      appServerAvailable: false,
      appServerListenUrl: listenUrl,
      diagnostics,
    })
  }
}
