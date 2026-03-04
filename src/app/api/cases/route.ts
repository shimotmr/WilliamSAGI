// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '100')
  const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  const { data } = await getSupabase().from('cases').select('*').order('created_at', { ascending: false }).limit(limit)
  return NextResponse.json({ cases: data || [], data: data || [] })
}
