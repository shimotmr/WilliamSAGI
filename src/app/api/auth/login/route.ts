import { NextRequest, NextResponse } from 'next/server'
import { signSession, authCookieName } from '@/lib/auth/session'
import { loginWithDirectory } from '@/features/auth/services/login'
import type { LoginRequestBody } from '@/features/auth/types'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequestBody
    const result = await loginWithDirectory(body)
    const token = await signSession(result.principal, result.role)

    const response = NextResponse.json({ ok: true, role: result.role })
    response.cookies.set(authCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : '登入失敗'
    const status = message === 'Missing fields' ? 400 : 401
    return NextResponse.json({ error: message }, { status })
  }
}
