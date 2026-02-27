import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const tag = searchParams.get('tag') || ''

  // 從 reports 撈人形機器人相關
  const keywords = ['機器人', 'humanoid', 'VLA', 'walker', 'Walker', '宇樹', 'Unitree', '天工', '人形']
  const orFilter = keywords.map(k => `title.ilike.%${k}%`).join(',')

  const { data: reports } = await supabase
    .from('reports')
    .select('id, title, author, type, created_at')
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ reports: reports || [] })
}
