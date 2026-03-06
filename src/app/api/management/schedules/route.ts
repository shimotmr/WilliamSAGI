/**
 * Phase 3: Web UI 管理模組
 * 排程矩陣 + 權限中心 + 資料庫 Explorer
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// === 排程矩陣 API ===
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'schedules'
  
  const supabase = getSupabase()
  
  if (type === 'schedules') {
    // 取得所有排程任務
    const { data: schedules } = await supabase
      .from('board_tasks')
      .select('id, title, status, priority, board, updated_at')
      .in('board', ['automation', 'system'])
      .order('updated_at', { ascending: false })
      .limit(50)
    
    // 取得 LaunchAgents 排程
    const { data: cronJobs } = await supabase
      .from('cron_jobs')
      .select('*')
      .order('next_run', { ascending: true })
      .limit(20)
    
    return NextResponse.json({
      schedules: schedules || [],
      cronJobs: cronJobs || [],
      total: (schedules?.length || 0) + (cronJobs?.length || 0)
    })
  }
  
  if (type === 'permissions') {
    // 權限與審批
    const { data: pendingApprovals } = await supabase
      .from('board_tasks')
      .select('id, title, priority, status, assignee, created_at')
      .eq('status', '待審核')
      .order('created_at', { ascending: false })
      .limit(20)
    
    const { data: approvalHistory } = await supabase
      .from('approval_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    return NextResponse.json({
      pending: pendingApprovals || [],
      history: approvalHistory || [],
      total: pendingApprovals?.length || 0
    })
  }
  
  if (type === 'explorer') {
    // 資料庫表結構
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name')
    
    return NextResponse.json({
      tables: tables || [],
      count: tables?.length || 0
    })
  }
  
  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

// === 審批動作 API ===
export async function POST(request: Request) {
  const supabase = getSupabase()
  const body = await request.json()
  const { action, task_id, note } = body
  
  if (action === 'approve') {
    const { error } = await supabase
      .from('board_tasks')
      .update({ status: '已核准', updated_at: new Date().toISOString() })
      .eq('id', task_id)
    
    if (!error) {
      await supabase.from('approval_log').insert({
        task_id,
        action: 'approve',
        note,
        created_at: new Date().toISOString()
      })
    }
    
    return NextResponse.json({ success: !error, error: error?.message })
  }
  
  if (action === 'reject') {
    const { error } = await supabase
      .from('board_tasks')
      .update({ status: '已拒絕', updated_at: new Date().toISOString() })
      .eq('id', task_id)
    
    if (!error) {
      await supabase.from('approval_log').insert({
        task_id,
        action: 'reject',
        note,
        created_at: new Date().toISOString()
      })
    }
    
    return NextResponse.json({ success: !error, error: error?.message })
  }
  
  if (action === 'query') {
    // 執行 SQL 查詢（限制 SELECT）
    const query = body.query?.trim().toUpperCase()
    if (!query?.startsWith('SELECT')) {
      return NextResponse.json({ error: 'Only SELECT queries allowed' }, { status: 403 })
    }
    
    // 使用管理 API 執行
    const { data, error } = await supabase.rpc('exec_sql', { sql: body.query })
    
    return NextResponse.json({ data, error: error?.message })
  }
  
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
