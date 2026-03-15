import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionFromRequest } from '@/lib/auth/guards'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require valid admin session
  const session = await getSessionFromRequest(request)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const taskId = parseInt(id, 10)
  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch task info
  const { data: task, error: taskError } = await supabase
    .from('board_tasks')
    .select('id, title, assignee, status, priority, created_at, completed_at, updated_at, result, description')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Fetch stream events
  const { data: events, error: eventsError } = await supabase
    .from('task_stream')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
    .limit(2000)

  // Fetch progress milestones
  const { data: progress } = await supabase
    .from('task_progress')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    task,
    events: events || [],
    progress: progress || [],
  })
}
