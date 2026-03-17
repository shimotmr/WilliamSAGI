// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch real trip data from Supabase
    const { data: trips, error } = await getSupabase()
      .from('tesla_trips')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(20)

    if (error) {
      // Table may not exist yet — return empty array
      console.error('Tesla trips query error:', error)
      return NextResponse.json({ trips: [], note: 'No trip data available' })
    }

    return NextResponse.json({ trips: trips || [] })
  } catch (error) {
    console.error('Tesla trips API error:', error)
    return NextResponse.json({ trips: [], error: 'Failed to fetch trips' })
  }
}
