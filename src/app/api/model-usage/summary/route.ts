import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ status: 'success', data: {
    totalRequests: 1247,
    totalTokens: 384756,
    models: [
      { name: 'Claude Sonnet', requests: 523, tokens: 156234 },
      { name: 'MiniMax', requests: 412, tokens: 124521 },
      { name: 'Kimi', requests: 312, tokens: 103001 }
    ]
  }})
}
