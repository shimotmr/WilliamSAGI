// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()
  const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  const { data } = await getSupabase().from('targets').select('*').eq('year', year).order('month')
  return NextResponse.json({ targets: data || [], data: data || [] })
}
