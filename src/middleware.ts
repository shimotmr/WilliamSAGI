import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getSessionFromRequest,
  isHubRoute,
  isPortalRoute,
  isPublicRoute,
} from '@/lib/auth/guards'
import { authCookieName } from '@/lib/auth/session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const session = await getSessionFromRequest(request)

  if (!session) {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete(authCookieName)
    return res
  }

  if (isHubRoute(pathname) && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  if (isPortalRoute(pathname) && !['admin', 'user'].includes(session.role)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
