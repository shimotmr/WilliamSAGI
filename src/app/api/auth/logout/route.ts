import { NextResponse } from 'next/server'
import { authCookieName } from '@/lib/auth'

export async function GET() {
  const res = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  res.cookies.delete(authCookieName)
  return res
}

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(authCookieName)
  return res
}
