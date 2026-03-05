// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  // 返回 mock 資料（實際 cron 列表需 OpenClaw API，先 mock）
  return NextResponse.json([
    { name: 'daily-model-allocator', schedule: '06:30', status: 'ok', enabled: true },
    { name: 'daily-learning-engine', schedule: '07:00', status: 'ok', enabled: true },
    { name: 'daily-token-budget', schedule: '08:00', status: 'ok', enabled: true },
    { name: 'weekly-strategy', schedule: 'Mon 09:00', status: 'idle', enabled: true },
    { name: 'weekly-review', schedule: 'Fri 17:00', status: 'idle', enabled: true },
    { name: 'health-digest', schedule: 'every 4h', status: 'ok', enabled: true }
  ])
}
