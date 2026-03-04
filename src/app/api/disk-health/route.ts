// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'overview') {
    // Try to get disk usage from DB if available
    const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase
      .from('disk_health_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (data) return NextResponse.json(data)
    // Fallback: empty overview structure
    return NextResponse.json({
      total: 0, used: 0, free: 0, usedPercent: 0,
      directories: [], message: '磁碟資料尚未同步'
    })
  }

  if (type === 'cleanup-logs') {
    return NextResponse.json({ logs: [] })
  }

  return NextResponse.json({ ok: true })
}
