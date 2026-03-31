import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasConfiguredSupabase } from '@/lib/supabase-env'

export const dynamic = 'force-dynamic'

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

export async function GET(request: NextRequest) {
  try {
    if (!hasConfiguredSupabase(supabaseUrl, supabaseKey)) {
      return NextResponse.json({
        status: 'success',
        data: [],
        count: 0
      })
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!)

    const { data, error } = await supabase
      .from('sop_rules')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.warn('Returning empty SOP rules because Supabase fetch failed:', error)
      return NextResponse.json({
        status: 'success',
        data: [],
        count: 0
      })
    }

    return NextResponse.json({
      status: 'success',
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.warn('Returning empty SOP rules due to API error:', error)
    return NextResponse.json({
      status: 'success',
      data: [],
      count: 0
    })
  }
}
