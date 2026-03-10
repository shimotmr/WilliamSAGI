// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Read Tesla credentials from ~/.openclaw/credentials/tesla-tw.json
function getTeslaCredentials() {
  try {
    const credPath = join(process.env.HOME || '/Users/travis', '.openclaw/credentials/tesla-tw.json')
    if (!existsSync(credPath)) {
      return null
    }
    const data = readFileSync(credPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to read Tesla credentials:', error)
    return null
  }
}

// Tesla API helpers
async function getTeslaVehicles(accessToken: string) {
  const response = await fetch('https://owner-api.teslamotors.com/api/1/vehicles', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  
  if (!response.ok) {
    throw new Error(`Failed to get vehicles: ${response.status}`)
  }
  
  const data = await response.json()
  return data.response || []
}

async function getVehicleChargeState(vehicleId: string, accessToken: string) {
  const response = await fetch(
    `https://owner-api.teslamotors.com/api/1/vehicles/${vehicleId}/data_request/charge_state`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  
  if (!response.ok) {
    return null
  }
  
  const data = await response.json()
  return data.response
}

async function getVehicleDriveState(vehicleId: string, accessToken: string) {
  const response = await fetch(
    `https://owner-api.teslamotors.com/api/1/vehicles/${vehicleId}/data_request/drive_state`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  
  if (!response.ok) {
    return null
  }
  
  const data = await response.json()
  return data.response
}

async function getVehicleLocation(vehicleId: string, accessToken: string) {
  const response = await fetch(
    `https://owner-api.teslamotors.com/api/1/vehicles/${vehicleId}/data_request/location`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  
  if (!response.ok) {
    return null
  }
  
  const data = await response.json()
  return data.response
}

// Generate mock trip data based on recent drive states
// In production, you'd store trips in a database
function generateMockTrips(): any[] {
  const now = new Date()
  const trips = []
  
  // Generate some mock trips for demo
  const locations = [
    { name: '內湖', lat: 25.0777, lon: 121.5915 },
    { name: '南崁', lat: 25.0528, lon: 121.2988 },
    { name: '桃園', lat: 24.9937, lon: 121.3000 },
    { name: '台北', lat: 25.0330, lon: 121.5654 },
  ]
  
  for (let i = 0; i < 5; i++) {
    const startLoc = locations[Math.floor(Math.random() * locations.length)]
    let endLoc = locations[Math.floor(Math.random() * locations.length)]
    while (endLoc.name === startLoc.name) {
      endLoc = locations[Math.floor(Math.random() * locations.length)]
    }
    
    const distance = Math.round(Math.sqrt(
      Math.pow((endLoc.lat - startLoc.lat) * 111, 2) + 
      Math.pow((endLoc.lon - startLoc.lon) * 111 * Math.cos(startLoc.lat * Math.PI / 180), 2)
    ) * 10) / 10
    
    const duration = Math.round(distance > 30 ? distance / 90 * 60 : distance / 60 * 60)
    
    trips.push({
      id: i + 1,
      car_name: 'Tesla Model 3',
      vin: '5YJ3E1EB7JF000000',
      region: '台灣',
      start_location: startLoc.name,
      end_location: endLoc.name,
      distance_km: distance,
      duration_minutes: Math.max(15, duration),
      recorded_at: new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    })
  }
  
  return trips.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
}

export async function GET() {
  try {
    const creds = getTeslaCredentials()
    
    if (!creds) {
      // Return mock data if no credentials
      const mockTrips = generateMockTrips()
      return NextResponse.json({ trips: mockTrips, mock: true })
    }
    
    // Get access token from first account
    const account = Object.values(creds)[0] as any
    if (!account?.sso?.access_token) {
      const mockTrips = generateMockTrips()
      return NextResponse.json({ trips: mockTrips, mock: true })
    }
    
    const accessToken = account.sso.access_token
    
    // Get vehicles
    const vehicles = await getTeslaVehicles(accessToken)
    
    if (vehicles.length === 0) {
      const mockTrips = generateMockTrips()
      return NextResponse.json({ trips: mockTrips, mock: true })
    }
    
    // Get data from first vehicle
    const vehicle = vehicles[0]
    const [chargeState, driveState, location] = await Promise.all([
      getVehicleChargeState(vehicle.id.toString(), accessToken),
      getVehicleDriveState(vehicle.id.toString(), accessToken),
      getVehicleLocation(vehicle.id.toString(), accessToken),
    ])
    
    // Generate trips from available data (or mock)
    // In production, you'd query a database for historical trips
    const trips = generateMockTrips()
    
    return NextResponse.json({ 
      trips,
      vehicle: {
        name: vehicle.name || 'Tesla',
        state: vehicle.state,
        charge: chargeState?.battery_level,
        range: chargeState?.est_battery_range_km,
        location: location ? { lat: location.latitude, lon: location.longitude } : null,
      },
      mock: true 
    })
  } catch (error) {
    console.error('Tesla API error:', error)
    
    // Return mock data on error
    const mockTrips = generateMockTrips()
    return NextResponse.json({ 
      trips: mockTrips, 
      mock: true,
      error: error instanceof Error ? error.message : 'Failed to fetch Tesla data' 
    })
  }
}
