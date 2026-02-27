import { verifySession, authCookieName } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(authCookieName)?.value
  const session = token ? await verifySession(token) : null
  const path = request.nextUrl.pathname

  if (path === '/login' || path.startsWith('/api/auth') || path === '/') {
    return NextResponse.next()
  }
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }
  if (session.role === 'staff' && !path.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/hub/:path*', '/portal/:path*'] }
