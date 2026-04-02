import { NextResponse } from 'next/server'

import { getCodexSession } from '@/lib/codex-sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function encodeSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const sessionId = decodeURIComponent(id)
  const encoder = new TextEncoder()

  let cancelled = false
  let lastCount = 0
  let lastUpdatedAt = ''

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = async () => {
        const session = await getCodexSession(sessionId)
        if (!session) {
          controller.enqueue(encoder.encode(encodeSse('error', { message: '找不到 session' })))
          controller.close()
          cancelled = true
          return
        }

        if (lastCount === 0) {
          lastCount = session.messages.length
          lastUpdatedAt = session.updatedAt
          controller.enqueue(
            encoder.encode(
              encodeSse('snapshot', {
                updatedAt: session.updatedAt,
                messages: session.messages,
              }),
            ),
          )
          return
        }

        if (session.updatedAt !== lastUpdatedAt || session.messages.length !== lastCount) {
          const nextMessages = session.messages.slice(lastCount)
          lastCount = session.messages.length
          lastUpdatedAt = session.updatedAt
          controller.enqueue(
            encoder.encode(
              encodeSse('delta', {
                updatedAt: session.updatedAt,
                messages: nextMessages,
              }),
            ),
          )
        } else {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        }
      }

      await push()
      while (!cancelled) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await push()
      }
    },
    cancel() {
      cancelled = true
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
