import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.TESLA_FLEET_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'TESLA_FLEET_CLIENT_ID not configured' }, { status: 500 })
  }

  const state = crypto.randomUUID()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: 'https://william-sagi.vercel.app/api/tesla/callback',
    response_type: 'code',
    scope: 'openid vehicle_device_data vehicle_location offline_access',
    state,
  })

  return NextResponse.redirect(`https://auth.tesla.com/oauth2/v3/authorize?${params.toString()}`)
}
