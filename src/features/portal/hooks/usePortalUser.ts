'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PortalUser } from '../types'

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
        const userNameCookie = getCookieValue('user_name')
        const employeeId = userNameCookie ? userNameCookie.split('@')[0] : ''
        const isAdmin = document.cookie.split(';').some((c) => c.trim().startsWith('is_admin=true'))

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
          supabase
            .from('portal_admins')
            .select('nickname, name, title')
            .or(`employee_id.eq.${employeeId},email.ilike.${employeeId}@`)
            .maybeSingle()
            .then((r) => r.data)
            .catch(() => null) as Promise<{ nickname: any; name: any; title: any } | null>,
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
