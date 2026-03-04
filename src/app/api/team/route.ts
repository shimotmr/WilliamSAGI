// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {
  const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  const { data } = await getSupabase().from('team').select('*').order('name')
  return NextResponse.json({ team: data || [], data: data || [] })
}
