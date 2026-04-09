// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  actionTitle,
  buildUpgradeTaskPayload,
  loadUpgradeDataset,
  type UpgradeActionMode,
} from '@/lib/upgrade-actions'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const invalidUrl = !url || url.includes('placeholder.supabase.co')
  const invalidKey = !key || key === 'placeholder'
  if (invalidUrl || invalidKey) {
    return null
  }
  return createClient(url, key)
}

function normalizeAction(value: unknown): UpgradeActionMode {
  return value === 'smoke' ? 'smoke' : 'followup'
}

async function buildStatePayload() {
  const dataset = await loadUpgradeDataset()
  const supabase = getSupabase()

  if (!supabase) {
    return {
      ok: true,
      states: Object.fromEntries((dataset.items || []).map((item) => [item.id, { followup: null, smoke: null }])),
      history: [],
      warning: 'supabase env missing',
    }
  }

  const trackedTitles = dataset.items.flatMap((item) => [
    actionTitle(item, 'followup'),
    actionTitle(item, 'smoke'),
  ])

  const { data: tasks, error } = await supabase
    .from('board_tasks')
    .select('id,title,status,assignee,priority,created_at')
    .in('title', trackedTitles)
    .order('id', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const byTitle = new Map<string, (typeof tasks)[number]>()
  for (const task of tasks || []) {
    if (!byTitle.has(task.title)) {
      byTitle.set(task.title, task)
    }
  }

  const states: Record<string, { followup: unknown | null; smoke: unknown | null }> = {}
  for (const item of dataset.items || []) {
    const followup = byTitle.get(actionTitle(item, 'followup')) || null
    const smoke = byTitle.get(actionTitle(item, 'smoke')) || null
    states[item.id] = { followup, smoke }
  }

  const { data: historyRows, error: historyError } = await supabase
    .from('task_events')
    .select('created_at,content,board_tasks!inner(id,title,status,assignee,priority)')
    .eq('event_type', 'upgrade_action_created')
    .order('created_at', { ascending: false })
    .limit(20)

  if (historyError) {
    throw new Error(historyError.message)
  }

  const history = (historyRows || []).map((row) => ({
    taskId: row.board_tasks.id,
    itemId: row.content?.itemId || '',
    itemName: row.content?.itemName || row.board_tasks.title,
    action: row.content?.action === 'smoke' ? 'smoke' : 'followup',
    title: row.board_tasks.title,
    status: row.board_tasks.status,
    assignee: row.board_tasks.assignee,
    priority: row.board_tasks.priority,
    createdAt: row.created_at,
  }))

  return {
    ok: true,
    states,
    history,
  }
}

async function createUpgradeAction(itemId: string, action: UpgradeActionMode) {
  const dataset = await loadUpgradeDataset()
  const item = (dataset.items || []).find((entry) => entry.id === itemId)
  if (!item) {
    return { ok: false, status: 404, error: 'item not found', itemId, action }
  }

  const payload = buildUpgradeTaskPayload(item, action)
  const supabase = getSupabase()

  if (!supabase) {
    return { ok: false, status: 503, error: 'supabase env missing', itemId, action }
  }

  const { data: existing } = await supabase
    .from('board_tasks')
    .select('id,title,status,assignee,priority,created_at')
    .eq('title', payload.title)
    .not('status', 'in', '(已完成,已取消)')
    .order('id', { ascending: false })
    .limit(1)

  if (existing && existing.length > 0) {
    return {
      ok: true,
      duplicate: true,
      itemId,
      itemName: item.name,
      action,
      taskId: existing[0].id,
      title: existing[0].title,
      status: existing[0].status,
      assignee: existing[0].assignee,
      priority: existing[0].priority,
      createdAt: existing[0].created_at,
    }
  }

  const { data, error } = await supabase
    .from('board_tasks')
    .insert(payload)
    .select('id,title,status,assignee,priority,created_at')
    .single()

  if (error) {
    return { ok: false, status: 500, error: error.message, itemId, action }
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

  return {
    ok: true,
    itemId,
    itemName: item.name,
    action,
    taskId: data.id,
    title: data.title,
    assignee: data.assignee,
    priority: data.priority,
    status: data.status,
    createdAt: data.created_at,
  }
}

export async function GET() {
  try {
    const payload = await buildStatePayload()
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const action = normalizeAction(body?.action)
    const itemIds = Array.isArray(body?.itemIds)
      ? body.itemIds.map((value: unknown) => String(value)).filter(Boolean)
      : []
    const singleItemId = String(body?.itemId || '')
    const targetIds = itemIds.length > 0 ? Array.from(new Set(itemIds)) : singleItemId ? [singleItemId] : []

    if (targetIds.length === 0) {
      return NextResponse.json({ ok: false, error: 'missing itemId or itemIds' }, { status: 400 })
    }

    const results = []
    for (const itemId of targetIds) {
      results.push(await createUpgradeAction(itemId, action))
    }

    const firstFailure = results.find((entry) => !entry.ok)
    if (targetIds.length === 1) {
      if (firstFailure) {
        return NextResponse.json(
          { ok: false, error: firstFailure.error || 'action failed' },
          { status: firstFailure.status || 500 }
        )
      }
      return NextResponse.json({ ok: true, ...results[0] })
    }

    const createdCount = results.filter((entry) => entry.ok && !entry.duplicate).length
    const duplicateCount = results.filter((entry) => entry.ok && entry.duplicate).length
    const failedCount = results.filter((entry) => !entry.ok).length

    return NextResponse.json({
      ok: failedCount === 0,
      action,
      createdCount,
      duplicateCount,
      failedCount,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'unknown error' },
      { status: 500 }
    )
  }
}
