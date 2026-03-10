import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession, authCookieName } from '@/lib/auth/session'
import { getSupabaseServerClient } from '@/lib/supabase/server'

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: '未登入' }, { status: 401 })
  const session = await verifySession(token)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: '需要管理員權限' }, { status: 403 })
  return null
}

export async function GET() {
  const err = await requireAdmin()
  if (err) return err
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.from('portal_permissions').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ permissions: data || [] })
}

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err
  const { user_email, role } = await request.json()
  if (!user_email || !role) return NextResponse.json({ error: '缺少 user_email 或 role' }, { status: 400 })
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.from('portal_permissions').upsert({ user_email, role, updated_at: new Date().toISOString() }, { onConflict: 'user_email' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, permission: data })
}

export async function DELETE(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err
  const { user_email } = await request.json()
  if (!user_email) return NextResponse.json({ error: '缺少 user_email' }, { status: 400 })
  const supabase = getSupabaseServerClient()
  const { error } = await supabase.from('portal_permissions').delete().eq('user_email', user_email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
