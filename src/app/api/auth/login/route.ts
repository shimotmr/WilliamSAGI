import { NextRequest, NextResponse } from 'next/server'
import { signSession, authCookieName } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const zimbraHost = process.env.ZIMBRA_HOST || 'https://webmail.aurotek.com'
  let zimbraOk = false
  try {
    const cred = Buffer.from(`${email}:${password}`).toString('base64')
    const resp = await fetch(`${zimbraHost}/home/${email}/inbox?fmt=json&limit=1`, {
      headers: { Authorization: `Basic ${cred}` },
    })
    zimbraOk = resp.ok
  } catch { zimbraOk = false }

  if (!zimbraOk) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const { data: user } = await supabase.from('allow_users').select('email,role,name').eq('email', email).single()
  if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

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
