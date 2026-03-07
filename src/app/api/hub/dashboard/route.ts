import { NextResponse } from 'next/server'
import { getDashboardData } from '@/features/dashboard/services/server'

export async function GET() {
  try {
    const data = await getDashboardData()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dashboard API failed' },
      { status: 500 }
    )
  }
}
