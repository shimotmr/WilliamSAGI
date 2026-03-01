import { NextRequest, NextResponse } from 'next/server'
import { signSession, authCookieName } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ZIMBRA_DOMAIN = 'aurotek.com'
const ZIMBRA_HOST = process.env.ZIMBRA_HOST || 'https://webmail.aurotek.com'

export async function POST(request: NextRequest) {
  const { email: input, password } = await request.json()
  if (!input || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // 自動補 domain
  const email = input.includes('@') ? input : `${input}@${ZIMBRA_DOMAIN}`

  // Zimbra 驗證
  let zimbraOk = false
  try {
    const cred = Buffer.from(`${email}:${password}`).toString('base64')
    const resp = await fetch(`${ZIMBRA_HOST}/home/${email}/inbox?fmt=json&limit=1`, {
      headers: { Authorization: `Basic ${cred}` },
    })
    zimbraOk = resp.ok
  } catch {
    zimbraOk = false
  }

  if (!zimbraOk) return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })

  const { data: user } = await supabase
    .from('allow_users')
    .select('email,role,name')
    .eq('email', email)
    .single()

  if (!user) return NextResponse.json({ error: '帳號未授權，請聯繫管理員' }, { status: 403 })

  const token = await signSession(user.email, user.role)
  const response = NextResponse.json({ ok: true, role: user.role })
  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
  })
  return response
}
