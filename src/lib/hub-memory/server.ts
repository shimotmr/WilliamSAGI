import type { NextRequest } from 'next/server'

import { authCookieName, verifySession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export type HubMemoryAccessMode = 'admin' | 'token'

export function createHubMemoryClient() {
  return createAdminClient()
}

function parseBearerToken(authHeader: string | null): string {
  if (!authHeader) return ''
  const [scheme, token] = authHeader.split(' ')
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return ''
  return token.trim()
}

export function getHubMemorySyncToken(): string {
  return (
    process.env.HUB_MEMORY_SYNC_TOKEN ||
    process.env.MEMORY_SYNC_TOKEN ||
    process.env.WILLIAM_MEMORY_SYNC_TOKEN ||
    process.env.AGENT_MEMORY_TOKEN ||
    ''
  ).trim()
}

export async function resolveHubMemoryAccess(
  request: NextRequest,
  options: { allowBearerToken?: boolean } = {},
): Promise<{ ok: true; mode: HubMemoryAccessMode } | { ok: false; status: number; error: string }> {
  const allowBearerToken = options.allowBearerToken ?? false

  if (allowBearerToken) {
    const bearerToken = parseBearerToken(request.headers.get('authorization'))
    const expectedToken = getHubMemorySyncToken()
    if (expectedToken && bearerToken === expectedToken) {
      return { ok: true, mode: 'token' }
    }
  }

  const sessionToken = request.cookies.get(authCookieName)?.value
  if (!sessionToken) {
    return { ok: false, status: 401, error: '未登入' }
  }

  const session = await verifySession(sessionToken)
  if (!session || session.role !== 'admin') {
    return { ok: false, status: 403, error: '需要管理員權限' }
  }

  return { ok: true, mode: 'admin' }
}
