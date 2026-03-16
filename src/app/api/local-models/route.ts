import { NextRequest, NextResponse } from 'next/server'

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:8080'

export async function GET() {
  try {
    const res = await fetch(`${LM_STUDIO_URL}/v1/models`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'LM Studio unreachable', status: res.status }, { status: 503 })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'LM Studio not running', url: LM_STUDIO_URL }, { status: 503 })
  }
}
