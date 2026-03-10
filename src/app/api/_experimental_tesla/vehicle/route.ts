import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Tesla API endpoint
const TESLA_API_BASE = 'https://owner-api.teslamotors.com/api/1/vehicles';

async function getTeslaToken() {
  try {
    const credentialsPath = join(process.env.HOME || '/Users/travis', '.openclaw/credentials/tesla-tw.json');
    const data = await readFile(credentialsPath, 'utf-8');
    const creds = JSON.parse(data);
    
    // Get the first account's access token
    const account = Object.values(creds)[0] as any;
    return account?.sso?.access_token;
  } catch (error) {
    console.error('Failed to read Tesla credentials:', error);
    return null;
  }
}

async function getVehicleData(token: string) {
  // For demo purposes, return mock data since we need actual vehicle ownership
  // In production, this would call the real Tesla API
  
  // Mock vehicle data - simulating a real Tesla vehicle
  return {
    display_name: 'Model 3',
    vin: '5YJ3E1EA0JF000000',
    vehicle_id: '1234567890',
    state: 'online',
    battery_level: 72,
    range: 385,
    location: {
      lat: 25.0330 + (Math.random() * 0.01 - 0.005),
      lng: 121.5654 + (Math.random() * 0.01 - 0.005),
      heading: Math.floor(Math.random() * 360),
    },
    charging_state: 'Disconnected',
    time_to_full_charge: 0,
    speed: 0,
    is_climate_on: false,
    inside_temp: 24,
    outside_temp: 22,
  };
}

export async function GET() {
  try {
    const token = await getTeslaToken();
    
    if (!token) {
      return NextResponse.json({
        status: 'error',
        message: '無法取得 Tesla 憑證',
      }, { status: 401 });
    }

    // Get vehicle data (using mock for demo)
    const vehicleData = await getVehicleData(token);

    return NextResponse.json({
      status: 'success',
      data: vehicleData,
    });
  } catch (error) {
    console.error('Tesla API error:', error);
    return NextResponse.json({
      status: 'error',
      message: '伺服器錯誤',
    }, { status: 500 });
  }
}
