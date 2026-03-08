'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PortalUser } from '../types'

/**
 * 解析 JWT payload（不驗證簽名，僅用於客戶端讀取資訊）
 * 注意：實際驗證在伺服器端 middleware 進行
 */
function parseJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // Base64url 解碼
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function getCookieValue(name: string): string {
  if (typeof document === 'undefined') return ''
  const found = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
  return found ? decodeURIComponent(found.split('=')[1]) : ''
}

export function usePortalUser(): PortalUser {
  const [state, setState] = useState<PortalUser>({
    employeeId: '',
    displayName: '',
    isAdmin: false,
    loading: true,
  })

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        // 優先使用 signed session cookie（安全）
        const portalSession = getCookieValue('portal_session')
        
        let employeeId = ''
        let isAdmin = false
        
        if (portalSession) {
          // 從 signed JWT 解析資訊（簽名驗證在伺服器端進行）
          const payload = parseJWTPayload(portalSession)
          if (payload) {
            employeeId = String(payload.employeeId || '')
            isAdmin = payload.isAdmin === true
          }
        }
        
        // 如果沒有 signed session，回退到舊的 cookie（向後相容）
        if (!employeeId) {
          const userNameCookie = getCookieValue('user_name')
          employeeId = userNameCookie ? userNameCookie.split('@')[0] : ''
          isAdmin = document.cookie.split(';').some((c) => c.trim().startsWith('is_admin=true'))
        }

        if (!employeeId) {
          if (!mounted) return
          setState({
            employeeId: '',
            displayName: '',
            isAdmin,
            loading: false,
          })
          return
        }

        const [empResult, adminResult] = await Promise.all([
          fetch(`/api/employees/lookup?employee_id=${encodeURIComponent(employeeId)}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null) as Promise<any>,
          Promise.resolve(
            supabase
              .from('portal_admins')
              .select('nickname, name, title')
              .or(`employee_id.eq.${employeeId},email.ilike.${employeeId}@`)
              .maybeSingle()
              .then((r) => r.data)
          ).catch(() => null),
        ])

        const displayNameBase =
          adminResult?.nickname || adminResult?.name || empResult?.name || employeeId

        const title = empResult?.title || adminResult?.title || ''
        const displayName = title ? `${displayNameBase} ${title}` : displayNameBase

        if (!mounted) return
        setState({
          employeeId,
          displayName,
          isAdmin,
          loading: false,
        })
      } catch {
        if (!mounted) return
        setState((prev) => ({
          ...prev,
          loading: false,
        }))
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  return state
}
