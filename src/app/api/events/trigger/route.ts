// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processEvent, type EventPayload } from '@/lib/event-engine'

export const dynamic = 'force-dynamic'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const payload: EventPayload = await request.json()

    if (!payload.type || !payload.data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 })
    }

    payload.timestamp = payload.timestamp || new Date().toISOString()

    const actions = processEvent(payload)

    // Execute actions
    const results = []
    for (const action of actions) {
      try {
        if (action.action === 'create_task' && action.metadata) {
          const { error } = await getSupabase().from('board_tasks').insert({
            title: action.metadata.title,
            priority: action.metadata.priority || 'P2',
            status: '待執行',
            assignee: action.metadata.assignee || 'blake',
            board: action.metadata.board || 'agent',
            description: action.metadata.description || action.message,
            created_at: new Date().toISOString(),
          })
          results.push({ action: 'create_task', success: !error, error: error?.message })
        } else {
          // notify / alert → log for now (actual Telegram send done by cron/webhook)
          results.push({ action: action.action, success: true, message: action.message })
        }
      } catch (e: any) {
        results.push({ action: action.action, success: false, error: e.message })
      }
    }

    // Log event
    await getSupabase().from('event_log').insert({
      event_type: payload.type,
      payload: payload.data,
      actions_taken: results,
      created_at: payload.timestamp,
    }).catch(() => {}) // event_log table may not exist yet

    return NextResponse.json({
      status: 'processed',
      event_type: payload.type,
      actions_count: actions.length,
      results,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
