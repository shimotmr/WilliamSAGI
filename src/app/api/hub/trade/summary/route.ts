// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [{ data: account }, { data: positions }, { data: orders }] = await Promise.all([
      getSupabase().from('trade_account').select('*').order('synced_at', { ascending: false }).limit(1),
      getSupabase().from('trade_positions').select('*').eq('status', 'open').order('synced_at', { ascending: false }),
      getSupabase().from('trade_orders').select('*').order('created_at', { ascending: false }).limit(10),
    ])

    const acc = account?.[0] ?? null
    const pos = positions ?? []
    const ord = orders ?? []

    const totalPnl = pos.reduce((sum: number, p: { pnl?: number }) => sum + (p.pnl || 0), 0)

    return NextResponse.json({
      ok: true,
      connected: true,
      account: acc ? {
        accountId: acc.account_id,
        brokerId: acc.broker_id,
        username: acc.username,
        accountType: acc.account_type,
        availableBalance: acc.available_balance,
        syncedAt: acc.synced_at,
      } : null,
      totalAssets: acc?.available_balance ?? null,
      totalPnl,
      positionCount: pos.length,
      positions: pos,
      recentOrders: ord,
      totalPositions: pos.length,
      syncedAt: acc?.synced_at ?? null,
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      connected: false,
      error: String(e),
      totalAssets: null,
      totalPnl: null,
      positionCount: 0,
      positions: [],
      recentOrders: [],
      totalPositions: 0,
    })
  }
}
