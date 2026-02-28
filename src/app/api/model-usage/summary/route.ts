import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ totalRequests: 0, totalTokens: 0, models: [] })
}
