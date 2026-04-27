import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

import { authCookieName, verifySession } from '@/lib/auth/session'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ ok: false, error: '未登入' }, { status: 401 })
  const session = await verifySession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false, error: '需要管理員權限' }, { status: 403 })
  }
  return null
}

export const revalidate = 30

export async function GET(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const rawIds = request.nextUrl.searchParams.get('ids') || ''
    const ids = Array.from(
      new Set(
        rawIds
          .split(',')
          .map((item) => Number(item.trim()))
          .filter((item) => Number.isInteger(item) && item > 0)
      )
    ).slice(0, 50)

    if (!ids.length) {
      return NextResponse.json({ ok: true, tasks: [] })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('board_tasks')
      .select('id,title,status,assignee,priority,updated_at,completed_at,result')
      .in('id', ids)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, tasks: data || [] })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : '讀取任務狀態失敗' },
      { status: 500 }
    )
  }
}
