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
    .from('rule_proposals')
    .select('status')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const grouped = (data || []).reduce((acc: Record<string, number>, row: { status: string }) => {
    const key = row.status || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const stats = Object.entries(grouped).map(([status, count]) => ({ status, count }))

  return NextResponse.json(stats)
}
