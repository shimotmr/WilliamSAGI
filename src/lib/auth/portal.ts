import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

// 延遲檢查，避免 build 時報錯
const getSecret = () => {
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in environment variables')
  }
  return new TextEncoder().encode(JWT_SECRET)
}

// Portal cookie name
export const portalSessionCookieName = 'portal_session'

export interface PortalSession {
  employeeId: string
  email: string
  isAdmin: boolean
  isSuperAdmin: boolean
  loginTime: string
}

/**
 * 簽署 Portal Session 資料為 JWT
 */
export async function signPortalSession(data: Omit<PortalSession, 'loginTime'>): Promise<string> {
  return new SignJWT({ ...data, loginTime: new Date().toISOString() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days, matching cookie maxAge
    .sign(getSecret())
}

/**
 * 驗證並解析 Portal Session JWT
 */
export async function verifyPortalSession(token: string): Promise<PortalSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      employeeId: String(payload.employeeId || ''),
      email: String(payload.email || ''),
      isAdmin: payload.isAdmin === true,
      isSuperAdmin: payload.isSuperAdmin === true,
      loginTime: String(payload.loginTime || ''),
    }
  } catch {
    return null
  }
}

/**
 * 讀取並驗證 Request 中的 signed cookie
 */
export async function getPortalSessionFromRequest(req: NextRequest): Promise<PortalSession | null> {
  const token = req.cookies.get(portalSessionCookieName)?.value
  if (!token) return null
  return verifyPortalSession(token)
}

/**
 * 檢查是否為 Portal 公開路由
 */
export function isPortalPublicRoute(pathname: string): boolean {
  return (
    pathname === '/portal/login' ||
    pathname.startsWith('/portal/api/auth/login') ||
    pathname.startsWith('/portal/api/auth/logout') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  )
}
