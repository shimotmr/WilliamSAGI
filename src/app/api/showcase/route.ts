import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-prod')

async function getRole(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return (payload as { role?: string }).role ?? null
  } catch {
    return null
  }
}

const hardcodedShowcase = [
  {
    id: 'demo-1',
    title: 'Blake：建立公司官網',
    assignee: 'Blake',
    priority: 'high',
    description: '從零開始建立企業形象官網，包含 RWD 設計、SEO 優化、多語系支援',
  },
  {
    id: 'demo-2',
    title: 'Rex：分析目標市場趨勢',
    assignee: 'Rex',
    priority: 'medium',
    description: '蒐集產業報告與競品資料，產出市場分析簡報與策略建議',
  },
  {
    id: 'demo-3',
    title: 'Warren：制定交易決策',
    assignee: 'Warren',
    priority: 'high',
    description: '根據技術指標與基本面分析，產出每日交易策略與風控建議',
  },
]

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return NextResponse.json({ role: 'guest', tasks: hardcodedShowcase })
  }

  const role = await getRole(token)

  if (role === 'admin') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('board_tasks')
      .select('id, title, assignee, priority, status, updated_at')
      .eq('status', '執行中')
      .order('priority')
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ role: 'admin', tasks: data })
  }

  return NextResponse.json({ role: role ?? 'user', tasks: hardcodedShowcase })
}
