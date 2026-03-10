import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// GET /api/permissions/portal - 取得所有 Portal 權限
export async function GET() {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('portal_permissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ permissions: data || [] })
}

// POST /api/permissions/portal - 新增 Portal 權限
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_email, role, system, created_by } = body

    if (!user_email || !role) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('portal_permissions')
      .insert([{ user_email, role, system: system || 'portal', created_by }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '此Email已有權限' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, permission: data })
  } catch (e) {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

// PATCH /api/permissions/portal - 更新 Portal 權限
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_email, role, system } = body

    if (!user_email || !role) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('portal_permissions')
      .update({ role })
      .eq('user_email', user_email)
      .eq('system', system || 'portal')
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, permission: data })
  } catch (e) {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

// DELETE /api/permissions/portal - 刪除 Portal 權限
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_email, system } = body

    if (!user_email) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('portal_permissions')
      .delete()
      .eq('user_email', user_email)
      .eq('system', system || 'portal')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
