import { NextRequest, NextResponse } from 'next/server'

// Fleet API 端點（取代已關閉的 owner-api）
const ENDPOINTS: Record<string, string> = {
  tw: 'https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles',
  cn: 'https://fleet-api.prd.cn.vn.cloud.tesla.cn/api/1/vehicles',
}

async function refreshToken(region: string, refreshTokenStr: string): Promise<{ token: string | null; error?: string }> {
  const clientId = process.env.TESLA_FLEET_CLIENT_ID
  const clientSecret = process.env.TESLA_FLEET_CLIENT_SECRET
  if (!clientId || !clientSecret) return { token: null, error: 'TESLA_FLEET_CLIENT_ID or CLIENT_SECRET not configured' }

  // Token endpoint MUST use fleet-auth domain per Tesla docs
  const tokenHost = region === 'cn' ? 'fleet-auth.prd.cn.vn.cloud.tesla.cn' : 'fleet-auth.prd.vn.cloud.tesla.com'
  try {
    const res = await fetch(`https://${tokenHost}/oauth2/v3/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshTokenStr,
      }),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error(`Tesla refresh failed for ${region}:`, res.status, errBody)
      return { token: null, error: `Token refresh failed (${res.status}): ${errBody.slice(0, 200)}` }
    }
    const tokens = await res.json()
    const expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600)

    // Update Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/tesla_tokens?region=eq.${region}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || refreshTokenStr,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }),
      })
    }
    return { token: tokens.access_token }
  } catch (e: any) {
    return { token: null, error: `Refresh exception: ${e.message}` }
  }
}

async function getAccessToken(region: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  try {
    if (supabaseUrl && supabaseKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/tesla_tokens?region=eq.${region}&select=access_token,refresh_token,expires_at`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }, cache: 'no-store' }
      )
      if (res.ok) {
        const rows = await res.json()
        const row = rows[0]
        if (!row?.access_token) return null

        // Auto-refresh if expired (with 60s buffer)
        const now = Math.floor(Date.now() / 1000)
        if (row.expires_at && now >= row.expires_at - 60 && row.refresh_token) {
          const result = await refreshToken(region, row.refresh_token)
          if (result.token) return result.token
        }
        return row.access_token
      }
    }
  } catch {}

  return process.env[`TESLA_${region.toUpperCase()}_ACCESS_TOKEN`] || null
}

async function fetchVehiclesWithDetails(apiBase: string, token: string) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const listRes = await fetch(apiBase, { headers, cache: 'no-store' })
  if (!listRes.ok) {
    const text = await listRes.text()
    throw new Error(`Fleet API ${listRes.status}: ${text.slice(0, 200)}`)
  }

  const listData = await listRes.json()
  const vehicles = listData.response || []

  const detailed = await Promise.all(
    vehicles.map(async (v: any) => {
      const id = v.id
      try {
        const dataRes = await fetch(`${apiBase}/${id}/vehicle_data?endpoints=${encodeURIComponent('charge_state;drive_state;vehicle_state;climate_state;location_data')}`, { headers, cache: 'no-store' })
        if (dataRes.ok) {
          const d = await dataRes.json()
          const r = d.response || {}
          return {
            id, display_name: r.vehicle_state?.vehicle_name || v.display_name || 'Tesla',
            vin: v.vin || r.vin, state: v.state,
            charge_state: r.charge_state || null, drive_state: r.drive_state || null,
            vehicle_state: r.vehicle_state || null, climate_state: r.climate_state || null,
          }
        }
        return { id, display_name: v.display_name || 'Tesla', vin: v.vin, state: v.state,
          charge_state: null, drive_state: null, vehicle_state: null, climate_state: null }
      } catch {
        return { id, display_name: v.display_name || 'Tesla', vin: v.vin, state: v.state,
          charge_state: null, drive_state: null, vehicle_state: null, climate_state: null }
      }
    })
  )
  return detailed
}

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region') || 'tw'
  if (!ENDPOINTS[region]) {
    return NextResponse.json({ error: 'Invalid region', vehicles: [] }, { status: 400 })
  }
  const token = await getAccessToken(region)
  if (!token) {
    return NextResponse.json({ error: `No credentials for region: ${region}`, vehicles: [] })
  }
  try {
    const vehicles = await fetchVehiclesWithDetails(ENDPOINTS[region], token)
    return NextResponse.json({ vehicles, error: null })
  } catch (err: any) {
    // Retry once with forced token refresh on 401
    if (err.message?.includes('401')) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (supabaseUrl && supabaseKey) {
          const res = await fetch(
            `${supabaseUrl}/rest/v1/tesla_tokens?region=eq.${region}&select=refresh_token`,
            { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }, cache: 'no-store' }
          )
          if (res.ok) {
            const rows = await res.json()
            if (rows[0]?.refresh_token) {
              const result = await refreshToken(region, rows[0].refresh_token)
              if (result.token) {
                const vehicles = await fetchVehiclesWithDetails(ENDPOINTS[region], result.token)
                return NextResponse.json({ vehicles, error: null })
              }
              // Refresh failed — need re-authentication
              return NextResponse.json({
                error: `Token expired and refresh failed for region ${region}. Please re-authenticate via /api/tesla/login. Detail: ${result.error || 'unknown'}`,
                needsReauth: true,
                vehicles: [],
              }, { status: 401 })
            }
          }
        }
      } catch {}
      // Fallback: no refresh token available
      return NextResponse.json({
        error: `Token invalid for region ${region}. Please re-authenticate via /api/tesla/login.`,
        needsReauth: true,
        vehicles: [],
      }, { status: 401 })
    }
    return NextResponse.json({ error: err.message || 'API request failed', vehicles: [] })
  }
}
