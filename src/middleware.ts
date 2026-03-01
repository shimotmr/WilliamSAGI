import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession, authCookieName } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 根目錄 → login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 公開路徑放行
  if (isPublic(pathname)) return NextResponse.next()

  // 驗證 session
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
