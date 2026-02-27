import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const { template, title } = await req.json()
  // TODO: integrate Google Slides API via service account
  return NextResponse.json({ error: 'Google Slides API not yet configured' }, { status: 501 })
}
