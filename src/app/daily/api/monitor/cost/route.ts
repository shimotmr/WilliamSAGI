import { NextResponse } from 'next/server'
export async function GET() {
  // cost_tracker.py runs on local Mac mini only, not available on Vercel
  return NextResponse.json({ error: 'Cost tracker not available in cloud environment' }, { status: 503 })
}
