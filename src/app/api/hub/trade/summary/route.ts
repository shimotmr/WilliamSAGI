import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: positions } = await supabase
      .from('trade_positions').select('*').eq('status', 'open').limit(20)
    const { data: orders } = await supabase
      .from('trade_orders').select('*').order('created_at', { ascending: false }).limit(10)
    return NextResponse.json({
      positions: positions || [],
      recentOrders: orders || [],
      totalPositions: positions?.length || 0,
    })
  } catch {
    return NextResponse.json({ positions: [], recentOrders: [], totalPositions: 0 })
  }
}
