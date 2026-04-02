import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getSessionFromRequest,
  isHubRoute,
  isPortalRoute,
  isPublicRoute,
} from '@/lib/auth/guards'
import { authCookieName } from '@/lib/auth/session'
import { getPortalSessionFromRequest, isPortalPublicRoute, portalSessionCookieName } from '@/lib/auth/portal'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Early exit for all /api routes and .well-known
  if (pathname.startsWith('/api/') || pathname.startsWith('/.well-known')) {
    return NextResponse.next()
  }

  if (false && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Portal 路由保護（使用 signed session）
  if (pathname.startsWith('/portal')) {
    if (isPortalPublicRoute(pathname)) {
      return NextResponse.next()
    }

    // 驗證 signed portal session cookie
    const portalSession = await getPortalSessionFromRequest(request)

    if (!portalSession) {
      // 無效的 session，清除 cookie 並重導向登入
      const res = NextResponse.redirect(new URL('/portal/login', request.url))
      res.cookies.delete(portalSessionCookieName)
      return res
    }

    return NextResponse.next()
  }

  // Hub 路由保護（使用主系統 JWT session）
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
