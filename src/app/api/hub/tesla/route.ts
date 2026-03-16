import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { homedir } from 'os'
import path from 'path'

const ENDPOINTS: Record<string, string> = {
  tw: 'https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/vehicles',
  cn: 'https://fleet-api.prd.cn.vn.cloud.tesla.com/api/1/vehicles',
}

const CREDENTIAL_FILES: Record<string, { file: string; email: string }> = {
  tw: { file: 'tesla-tw.json', email: 'shimotmr@gmail.com' },
  cn: { file: 'tesla-cn.json', email: 'shimotmr+cn@gmail.com' },
}

async function getAccessToken(region: string): Promise<string | null> {
  const config = CREDENTIAL_FILES[region]
  if (!config) return null

  // Try local credential file
  try {
    const credPath = path.join(homedir(), '.openclaw', 'credentials', config.file)
    const raw = await readFile(credPath, 'utf-8')
    const data = JSON.parse(raw)
    const token = data[config.email]?.sso?.access_token
    if (token) return token
  } catch {
    // Local file not available (e.g. Vercel)
  }

  // Try environment variable fallback
  const envKey = `TESLA_${region.toUpperCase()}_ACCESS_TOKEN`
  if (process.env[envKey]) return process.env[envKey]!

  return null
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

  // Fetch detailed data for each vehicle
  const detailed = await Promise.all(
    vehicles.map(async (v: any) => {
      const id = v.id
      try {
        const dataRes = await fetch(`${apiBase}/${id}/vehicle_data`, { headers, cache: 'no-store' })
        if (dataRes.ok) {
          const d = await dataRes.json()
          const r = d.response || {}
          return {
            id,
            display_name: r.vehicle_state?.vehicle_name || v.display_name || 'Tesla',
            vin: v.vin || r.vin,
            state: v.state,
            charge_state: r.charge_state || null,
            drive_state: r.drive_state || null,
            vehicle_state: r.vehicle_state || null,
            climate_state: r.climate_state || null,
          }
        }
        // Vehicle might be asleep
        return {
          id,
          display_name: v.display_name || 'Tesla',
          vin: v.vin,
          state: v.state,
          charge_state: null,
          drive_state: null,
          vehicle_state: null,
          climate_state: null,
        }
      } catch {
        return {
          id,
          display_name: v.display_name || 'Tesla',
          vin: v.vin,
          state: v.state,
          charge_state: null,
          drive_state: null,
          vehicle_state: null,
          climate_state: null,
        }
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
