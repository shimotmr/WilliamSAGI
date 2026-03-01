import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession, authCookieName } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 根目錄 → login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // API 路由、靜態資源、login 頁面全部放行
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // 其他頁面路由：驗證 session
  const token = request.cookies.get(authCookieName)?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const session = await verifySession(token)
  if (!session) {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete(authCookieName)
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
