import { NextRequest, NextResponse } from 'next/server'

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:8080'

export async function POST(req: NextRequest) {
  const { model } = await req.json()
  const start = Date.now()
  try {
    const res = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with one word: OK' }],
        max_tokens: 10,
      }),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    const elapsed = Date.now() - start
    return NextResponse.json({
      ok: true,
      elapsed_ms: elapsed,
      tokens: data.usage?.completion_tokens ?? 0,
      response: data.choices?.[0]?.message?.content ?? '',
    })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 503 })
  }
}
