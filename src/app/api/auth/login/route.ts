import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signSession, authCookieName, type SessionRole } from '@/lib/auth/session'

interface LoginRequestBody {
  email?: string
  username?: string
  password?: string
}

interface EmployeeRow {
  emp_code: string
  name: string
  email: string
}

interface AllowUserRow {
  role: SessionRole | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ZIMBRA_HOST = process.env.ZIMBRA_HOST || 'https://webmail.aurotek.com'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

function getSupabase() {
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginRequestBody
  const input = body.email || body.username
  const password = body.password

  if (!input || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const account = input.trim().toLowerCase()
  const supabase = getSupabase()

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('emp_code, name, email')
    .or(`emp_code.eq.${account},email.ilike.${account}@%`)
    .single<EmployeeRow>()

  if (employeeError || !employee) {
    return NextResponse.json({ error: '帳號不存在，請確認工號是否正確' }, { status: 401 })
  }

  let zimbraOk = false

  try {
    const zimbraUser = (employee.email || employee.emp_code).split('@')[0]
    const cred = Buffer.from(`${zimbraUser}:${password}`).toString('base64')

    const resp = await fetch(`${ZIMBRA_HOST}/home/${zimbraUser}/inbox?fmt=json&limit=1`, {
      headers: {
        Authorization: `Basic ${cred}`,
      },
      cache: 'no-store',
    })

    zimbraOk = resp.ok
  } catch {
    zimbraOk = false
  }

  if (!zimbraOk) {
    return NextResponse.json({ error: '密碼錯誤' }, { status: 401 })
  }

  const { data: allowUser } = await supabase
    .from('allow_users')
    .select('role')
    .or(
      `email.eq.${employee.emp_code},email.eq.${employee.email},email.eq.${employee.emp_code}@aurotek.com`
    )
    .single<AllowUserRow>()

  const role: SessionRole = allowUser?.role === 'admin' ? 'admin' : 'user'
  const token = await signSession(employee.email || employee.emp_code, role)

  const response = NextResponse.json({ ok: true, role })
  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  return response
}
