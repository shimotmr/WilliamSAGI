import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionFromRequest } from '@/lib/auth/guards'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const taskId = parseInt(id, 10)
  if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('task_events')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
