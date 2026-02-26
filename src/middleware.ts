import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // /portal/* 和 /hub/* 需要認證（暫時 placeholder）
  if (pathname.startsWith('/portal') || pathname.startsWith('/hub')) {
    const token = request.cookies.get('sb-access-token')
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/:path*', '/hub/:path*'],
}
