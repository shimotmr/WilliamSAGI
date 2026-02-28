import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET – 查詢訓練記錄 + QA 資料
export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'records' | 'qa'

  if (type === 'qa') {
    const { data, error } = await supabase
      .from('linebot_training_qa')
      .select('id,question,answer,source_type,created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ qa: data })
  }

  // default: training records
  const { data, error } = await supabase
    .from('linebot_training_records')
    .select('id,source_type,data_count,status,created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ records: data })
}

// POST – 新增 QA 或觸發訓練
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json()
  const { action } = body // 'add_qa' | 'train'

  if (action === 'add_qa') {
    const { question, answer, source_type } = body
    if (!question || !answer) {
      return NextResponse.json({ error: '問題與答案為必填' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('linebot_training_qa')
      .insert({ question, answer, source_type: source_type || '手動' })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ qa: data })
  }

  if (action === 'train') {
    const { source_type } = body
    if (!source_type) {
      return NextResponse.json({ error: 'source_type 為必填' }, { status: 400 })
    }
    // 計算該來源的 QA 筆數
    const { count, error: countErr } = await supabase
      .from('linebot_training_qa')
      .select('id', { count: 'exact', head: true })
      .eq('source_type', source_type)
    if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 })

    const { data, error } = await supabase
      .from('linebot_training_records')
      .insert({
        source_type,
        data_count: count || 0,
        status: '訓練中',
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ record: data })
  }

  return NextResponse.json({ error: '未知的 action' }, { status: 400 })
}
