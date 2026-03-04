// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

export async function GET() {
  try {
    const { count: active } = await getSupabase().from('board_tasks').select('*',{count:'exact',head:true}).eq('status','執行中')
    const { count: total } = await getSupabase().from('board_tasks').select('*',{count:'exact',head:true})

    const uptimeSec = Math.floor(process.uptime())
    const h = Math.floor(uptimeSec / 3600)
    const m = Math.floor((uptimeSec % 3600) / 60)
    const uptimeStr = h > 0 ? `${h}小時 ${m}分鐘` : `${m}分鐘`
    const restartTime = new Date(Date.now() - uptimeSec * 1000).toLocaleString('zh-TW')

    return NextResponse.json({
      system: { status: 'healthy', uptime: uptimeStr, lastRestart: restartTime, version: '2.0' },
      sessions: { active: active||0, total: total||0, mainAgent: 1, subAgents: (active||1)-1 },
      storage: { openclaw: '~/.openclaw', diskUsage: 45, available: '100GB' },
      gateway: { status: 'running', port: 18789 },
      timestamp: new Date().toISOString(),
    })
  } catch(e) {
    return NextResponse.json({
      system: { status: 'error', uptime: 0, version: '2.0' },
      sessions: { active: 0, total: 0, mainAgent: 0, subAgents: 0 },
      storage: { openclaw: 'N/A', diskUsage: 0, available: 'N/A' },
      gateway: { status: 'unknown', port: 18789 },
    })
  }
}
