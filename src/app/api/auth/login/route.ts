import { NextRequest, NextResponse } from 'next/server'
import { signSession, authCookieName } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ZIMBRA_HOST = process.env.ZIMBRA_HOST || 'https://webmail.aurotek.com'

export async function POST(request: NextRequest) {
  const { email: input, password } = await request.json()
  if (!input || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const account = input.trim().toLowerCase()

  // Step 1: 查 employees 表（支援工號或 email prefix）
  const { data: employee } = await supabase
    .from('employees')
    .select('emp_code, name, email')
    .or(`emp_code.eq.${account},email.ilike.${account}@%`)
    .single()

  if (!employee) {
    return NextResponse.json({ error: '帳號不存在，請確認工號是否正確' }, { status: 401 })
  }

  // Step 2: Zimbra Basic Auth — 用 email prefix（@之前的帳號，e.g. williamhsiao）
  // Zimbra REST API /home/{user}/inbox 接受 prefix，不需要完整 email
  let zimbraOk = false
  try {
    const zimbraUser = (employee.email || employee.emp_code).split('@')[0]
    const cred = Buffer.from(`${zimbraUser}:${password}`).toString('base64')
    const resp = await fetch(`${ZIMBRA_HOST}/home/${zimbraUser}/inbox?fmt=json&limit=1`, {
      headers: { Authorization: `Basic ${cred}` },
    })
    zimbraOk = resp.ok
  } catch {
    zimbraOk = false
  }

  if (!zimbraOk) {
    return NextResponse.json({ error: '密碼錯誤' }, { status: 401 })
  }

  // Step 3: 查 allow_users 決定角色
  const { data: allowUser } = await supabase
    .from('allow_users')
    .select('role')
    .or(`email.eq.${employee.emp_code},email.eq.${employee.email}`)
    .single()

  const role = allowUser?.role || 'user'

  const token = await signSession(employee.email || employee.emp_code, role)
  const response = NextResponse.json({ ok: true, role })
  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
  })
  return response
}
