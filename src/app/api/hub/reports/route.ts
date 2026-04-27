// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const revalidate = 30

export async function GET(req: Request) {
  const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  const { searchParams } = new URL(req.url)
  const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '20'), 200))
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
  const { data, count } = await getSupabase()
    .from('reports')
    .select('id,title,author,type,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  // Map `type` -> `report_type` for frontend compatibility
  const reports = (data || []).map(r => ({ ...r, report_type: r.type }))
  return NextResponse.json({ reports, total: count || 0, limit, offset })
}
