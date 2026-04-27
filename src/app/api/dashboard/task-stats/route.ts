// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export const revalidate = 60

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('board_tasks')
    .select('status', { count: 'exact' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const statsMap = (data || []).reduce((acc: Record<string, number>, row: { status: string }) => {
    const key = row.status || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const stats = Object.entries(statsMap).map(([status, count]) => ({ status, count }))

  return NextResponse.json(stats)
}
