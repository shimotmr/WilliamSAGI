import { SignJWT, jwtVerify } from 'jose'

export type SessionRole = 'admin' | 'user'

export interface AppSession {
  email: string
  role: SessionRole
}

const JWT_SECRET = process.env.JWT_SECRET

// 延遲檢查，避免 build 時報錯
const getSecret = () => {
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in environment variables')
  }
  return new TextEncoder().encode(JWT_SECRET)
}

export const authCookieName = 'session'

export async function signSession(email: string, role: SessionRole): Promise<string> {
  return new SignJWT({ email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<AppSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      email: String(payload.email),
      role: payload.role === 'admin' ? 'admin' : 'user',
    }
  } catch {
    return null
  }
}
