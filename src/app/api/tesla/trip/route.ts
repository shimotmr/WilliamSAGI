import { NextResponse } from 'next/server';

interface TripEstimate {
  distance: number;
  duration: number;
  energy_needed: number;
  stops: number;
  cost: number;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { origin, destination, battery_level } = body;

    if (!origin || !destination || !battery_level) {
      return NextResponse.json({
        status: 'error',
        message: '缺少必要參數',
      }, { status: 400 });
    }

    // Calculate distance
    const distance = calculateDistance(
      origin.lat, origin.lng,
      destination.lat, destination.lng
    );

    // Estimate duration (assuming average speed of 60 km/h in city, 90 km/h on highway)
    const highwayRatio = Math.random() > 0.5 ? 0.6 : 0.4;
    const citySpeed = 50;
    const highwaySpeed = 100;
    const avgSpeed = citySpeed * (1 - highwayRatio) + highwaySpeed * highwayRatio;
    const duration = Math.round((distance / avgSpeed) * 60); // in minutes

    // Calculate energy needed (Tesla Model 3 consumes ~15 kWh per 100km)
    const consumption = 15; // kWh per 100km
    const energy_needed = Math.round((distance / 100) * consumption);

    // Calculate if need to charge
    const currentRange = (battery_level / 100) * 450; // Assuming 450km max range
    const needsCharging = currentRange < distance;
    
    // Estimate number of charging stops needed
    let stops = 0;
    if (needsCharging) {
      const availableEnergy = (battery_level / 100) * 75; // 75 kWh battery
      const usableEnergy = availableEnergy * 0.8; // Only use 80% to protect battery
      const rangePerCharge = (usableEnergy / consumption) * 100;
      
      if (rangePerCharge < distance) {
        stops = Math.ceil(distance / rangePerCharge) - 1;
      }
    }

    // Calculate cost (electricity price in Taiwan ~3-8 NTD per kWh)
    const pricePerKwh = 7.0; // Average price
    const cost = Math.round(energy_needed * pricePerKwh);

    const estimate: TripEstimate = {
      distance: Math.round(distance * 10) / 10,
      duration,
      energy_needed,
      stops,
      cost,
    };

    return NextResponse.json({
      status: 'success',
      data: estimate,
    });
  } catch (error) {
    console.error('Trip estimation error:', error);
    return NextResponse.json({
      status: 'error',
      message: '無法計算行程',
    }, { status: 500 });
  }
}
