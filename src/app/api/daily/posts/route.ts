// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  const { data } = await getSupabase()
    .from('travis_daily_posts')
    .select('id,title,slug,summary,category,published_at,created_at')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)
  return NextResponse.json({ posts: data || [] })
}
