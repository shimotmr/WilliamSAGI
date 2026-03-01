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

  // Step 1: 查 employees 表確認帳號存在
  // 支援工號（emp_code）或 email prefix（williamhsiao）
  const { data: employee } = await supabase
    .from('employees')
    .select('emp_code, name, email')
    .or(`emp_code.eq.${account},email.ilike.${account}@%`)
    .single()

  if (!employee) {
    return NextResponse.json({ error: '帳號不存在，請確認工號是否正確' }, { status: 401 })
  }

  // Step 2: Zimbra 驗證（用輸入的帳號原樣送）
  let zimbraOk = false
  try {
    const zimbraAccount = employee.emp_code === account ? account : account
    const cred = Buffer.from(`${zimbraAccount}:${password}`).toString('base64')
    const resp = await fetch(`${ZIMBRA_HOST}/home/${zimbraAccount}/inbox?fmt=json&limit=1`, {
      headers: { Authorization: `Basic ${cred}` },
    })
    zimbraOk = resp.ok
  } catch {
    zimbraOk = false
  }

  if (!zimbraOk) {
    return NextResponse.json({ error: '密碼錯誤' }, { status: 401 })
  }

  // Step 3: 查 allow_users 決定角色，預設 user
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
