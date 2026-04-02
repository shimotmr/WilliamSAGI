// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildUpgradeTaskPayload, loadUpgradeDataset } from '@/lib/upgrade-actions'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const itemId = String(body?.itemId || '')
    const action = body?.action === 'smoke' ? 'smoke' : 'followup'

    if (!itemId) {
      return NextResponse.json({ ok: false, error: 'missing itemId' }, { status: 400 })
    }

    const dataset = await loadUpgradeDataset()
    const item = (dataset.items || []).find((entry) => entry.id === itemId)
    if (!item) {
      return NextResponse.json({ ok: false, error: 'item not found' }, { status: 404 })
    }

    const payload = buildUpgradeTaskPayload(item, action)
    const supabase = getSupabase()

    const duplicateTitle = payload.title
    const { data: existing } = await supabase
      .from('board_tasks')
      .select('id,title,status')
      .eq('title', duplicateTitle)
      .not('status', 'in', '(已完成,已取消)')
      .order('id', { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        taskId: existing[0].id,
        title: existing[0].title,
        status: existing[0].status,
      })
    }

    const { data, error } = await supabase
      .from('board_tasks')
      .insert(payload)
      .select('id,title,status,assignee,priority')
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    try {
      await supabase.from('task_events').insert({
        task_id: data.id,
        event_type: 'upgrade_action_created',
        content: {
          itemId,
          action,
          source: 'upgrade-tracker',
          itemName: item.name,
        },
      })
    } catch {
      // non-blocking
    }

    return NextResponse.json({
      ok: true,
      action,
      taskId: data.id,
      title: data.title,
      assignee: data.assignee,
      priority: data.priority,
      status: data.status,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'unknown error' },
      { status: 500 }
    )
  }
}
