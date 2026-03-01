import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-prod')
const AUTH_COOKIE = 'session'

// 不需要登入的路徑
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
]

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 根目錄 → 登入頁
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 公開路徑放行
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // 靜態資源放行
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // 驗證 session cookie
  const token = request.cookies.get(AUTH_COOKIE)?.value
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    // token 無效或過期
    const loginUrl = new URL('/login', request.url)
    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete(AUTH_COOKIE)
    return res
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
