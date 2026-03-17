import { NextRequest, NextResponse } from 'next/server'

// 舊版 owner-api 端點（用 SSO token 直接打）
const ENDPOINTS: Record<string, string> = {
  tw: 'https://owner-api.teslamotors.com/api/1/vehicles',
  cn: 'https://owner-api.vn.cloud.tesla.cn/api/1/vehicles',
}

async function getAccessToken(region: string): Promise<string | null> {
  // 優先從 Supabase 讀（動態更新，不需 redeploy）
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/tesla_tokens?region=eq.${region}&select=access_token,expires_at`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }, cache: 'no-store' }
      )
      if (res.ok) {
        const rows = await res.json()
        if (rows[0]?.access_token) return rows[0].access_token
      }
    }
  } catch {}

  // fallback: env var
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
        const dataRes = await fetch(`${apiBase}/${id}/vehicle_data`, { headers, cache: 'no-store' })
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
    return NextResponse.json({ error: err.message || 'API request failed', vehicles: [] })
  }
}
