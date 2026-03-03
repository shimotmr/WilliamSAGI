import { NextRequest, NextResponse } from 'next/server'
// Google Slides API integration — pending service account setup
export async function POST(req: NextRequest) {
  const { template, title } = await req.json().catch(() => ({}))
  // TODO: integrate Google Slides API
  return NextResponse.json({ error: 'Google Slides 尚未設定（需要服務帳號）' }, { status: 501 })
}
