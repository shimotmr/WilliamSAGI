// @ts-nocheck
import { verifySession, authCookieName } from '@/lib/auth/session'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {  // Auth guard
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const session = await verifySession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })


  return NextResponse.json({ 
    ok: true, 
    message: 'Not implemented yet',
    path: request.nextUrl.pathname 
  })
}

export async function POST(request: NextRequest) {  // Auth guard
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const session = await verifySession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })


  return NextResponse.json({ 
    ok: true, 
    message: 'Not implemented yet',
    path: request.nextUrl.pathname 
  })
}
