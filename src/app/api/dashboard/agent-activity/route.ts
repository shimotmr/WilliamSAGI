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

  const since = new Date()
  since.setDate(since.getDate() - 7)

  const { data, error } = await supabase
    .from('agent_jobs')
    .select('model,status')
    .gt('created_at', since.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const grouped = (data || []).reduce(
    (acc: Record<string, { model: string; status: string; count: number }>, row: { model: string; status: string }) => {
      const key = `${row.model || 'unknown'}::${row.status || 'unknown'}`
      if (!acc[key]) {
        acc[key] = {
          model: row.model || 'unknown',
          status: row.status || 'unknown',
          count: 0,
        }
      }
      acc[key].count += 1
      return acc
    },
    {}
  )

  return NextResponse.json(Object.values(grouped))
}
