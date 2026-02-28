import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceISO = since.toISOString()

  const [tokenRes, perfRes] = await Promise.all([
    supabase
      .from('token_usage_log')
      .select('*')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: true }),
    supabase
      .from('model_performance')
      .select('*')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: true }),
  ])

  if (tokenRes.error) {
    return NextResponse.json({ error: tokenRes.error.message }, { status: 500 })
  }
  if (perfRes.error) {
    return NextResponse.json({ error: perfRes.error.message }, { status: 500 })
  }

  return NextResponse.json({
    tokenUsage: tokenRes.data ?? [],
    modelPerformance: perfRes.data ?? [],
  })
}
