import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // LINE Bot webhook - 保留原路徑 /api/line/webhook
  const body = await req.json()
  console.log('LINE webhook:', body)
  return NextResponse.json({ status: 'ok' })
}
