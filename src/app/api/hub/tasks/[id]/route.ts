// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET single task
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('board_tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ data })
}

// PATCH update task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabase()
  const body = await req.json()
  
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  }
  
  // Allowed fields to update
  const allowedFields = ['status', 'priority', 'assignee', 'result', 'session_id', 'last_failure_reason']
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }
  
  // Handle status changes with timestamps
  if (body.status === '已完成') {
    updateData.completed_at = new Date().toISOString()
  }
  if (body.status === '執行中') {
    updateData.started_at = new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('board_tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, message: '任務已更新' })
}
