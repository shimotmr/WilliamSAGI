import type { NextRequest } from 'next/server'
import { verifySession, authCookieName, type AppSession } from './session'

export async function getSessionFromRequest(req: NextRequest): Promise<AppSession | null> {
  const token = req.cookies.get(authCookieName)?.value
  if (!token) return null
  return verifySession(token)
}

export function isPublicRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/daily') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/callback') ||
    pathname.startsWith('/api/hub/') ||
    pathname.startsWith('/api/v4/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.html') ||
    pathname.startsWith('/v4-') ||
    pathname.startsWith('/codex') ||
    pathname.startsWith('/api/codex')
  )
}

export function isHubRoute(pathname: string): boolean {
  return pathname === '/hub' || pathname.startsWith('/hub/')
}

export function isPortalRoute(pathname: string): boolean {
  return pathname === '/portal' || pathname.startsWith('/portal/')
}
