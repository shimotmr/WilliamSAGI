import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { count: active } = await supabase.from('board_tasks').select('*',{count:'exact',head:true}).eq('status','執行中')
    const { count: total } = await supabase.from('board_tasks').select('*',{count:'exact',head:true})

    return NextResponse.json({
      system: { status: 'healthy', uptime: process.uptime(), version: '2.0' },
      sessions: { active: active||0, total: total||0, mainAgent: 1, subAgents: (active||1)-1 },
      storage: { openclaw: '~/.openclaw', diskUsage: 45, available: '100GB' },
      gateway: { status: 'running', port: 18789 },
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
