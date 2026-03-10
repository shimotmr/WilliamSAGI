import { NextResponse } from 'next/server';

interface ChargingStation {
  name: string;
  address: string;
  distance: number;
  available_stalls: number;
  total_stalls: number;
  price_per_kwh: number;
  operator: string;
  lat: number;
  lng: number;
}

// Mock charging stations in Taiwan
function getMockChargingStations(lat: number, lng: number): ChargingStation[] {
  const stations: ChargingStation[] = [
    {
      name: 'Tesla 超充站 - 內湖',
      address: '台北市內湖區行忠路 58 號',
      distance: 2.3,
      available_stalls: 6,
      total_stalls: 8,
      price_per_kwh: 8.5,
      operator: 'Tesla',
      lat: 25.0797,
      lng: 121.5765,
    },
    {
      name: 'Tesla 超充站 - 台北信義',
      address: '台北市信義區松仁路 7 號',
      distance: 4.1,
      available_stalls: 3,
      total_stalls: 10,
      price_per_kwh: 8.5,
      operator: 'Tesla',
      lat: 25.0389,
      lng: 121.5563,
    },
    {
      name: 'ChargePoint 充電站 - 南港',
      address: '台北市南港區忠孝東路七段 359 號',
      distance: 5.8,
      available_stalls: 4,
      total_stalls: 6,
      price_per_kwh: 7.2,
      operator: 'ChargePoint',
      lat: 25.0525,
      lng: 121.6078,
    },
    {
      name: 'EVALUE 充電站 - 大安',
      address: '台北市大安區仁愛路四段 112 巷',
      distance: 3.2,
      available_stalls: 2,
      total_stalls: 4,
      price_per_kwh: 6.8,
      operator: 'EVALUE',
      lat: 25.0380,
      lng: 121.5489,
    },
    {
      name: 'Tesla 超充站 - 新竹',
      address: '新竹市東區光復路一段 289 號',
      distance: 18.5,
      available_stalls: 8,
      total_stalls: 12,
      price_per_kwh: 8.5,
      operator: 'Tesla',
      lat: 24.8017,
      lng: 120.9714,
    },
    {
      name: '華城電機充電站 - 桃園',
      address: '桃園市桃園區中正路 1234 號',
      distance: 15.2,
      available_stalls: 6,
      total_stalls: 10,
      price_per_kwh: 7.0,
      operator: '華城電機',
      lat: 25.0177,
      lng: 121.3014,
    },
  ];

  // Sort by distance
  return stations.sort((a, b) => a.distance - b.distance);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '25.0330');
    const lng = parseFloat(searchParams.get('lng') || '121.5654');

    // In production, this would call a real charging station API
    // For now, return mock data
    const stations = getMockChargingStations(lat, lng);

    return NextResponse.json({
      status: 'success',
      data: stations,
    });
  } catch (error) {
    console.error('Charging stations API error:', error);
    return NextResponse.json({
      status: 'error',
      message: '無法取得充電站資訊',
    }, { status: 500 });
  }
}
