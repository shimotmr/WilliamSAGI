import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { TaskDetail } from '@/features/openclaw-os/types'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const taskId = Number(id)

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
  }

  const supabase = getSupabase()

  const [taskResult, eventsResult, stepsResult, reportResult] = await Promise.all([
    supabase
      .from('board_tasks')
      .select('*')
      .eq('id', taskId)
      .single(),
    supabase
      .from('task_events')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true }),
    supabase
      .from('task_steps')
      .select('*')
      .eq('task_id', taskId)
      .order('step_number', { ascending: true }),
    supabase
      .from('reports')
      .select('id,title,author,type,created_at,md_url,file_path,task_id')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  if (taskResult.error) {
    return NextResponse.json({ error: taskResult.error.message }, { status: 404 })
  }

  const payload: TaskDetail = {
    task: taskResult.data,
    events: eventsResult.data || [],
    steps: stepsResult.data || [],
    reports: reportResult.data || [],
  }

  return NextResponse.json(payload)
}
