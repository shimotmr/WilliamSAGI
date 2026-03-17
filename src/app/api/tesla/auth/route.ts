import { NextResponse } from 'next/server'

const CLIENT_ID = process.env.TESLA_FLEET_CLIENT_ID || '2b4f09ee-8201-4863-af80-a08491bc470f'
const REDIRECT_URI = 'https://william-sagi.vercel.app/api/tesla/callback'

export async function GET() {
  const scopes = 'openid vehicle_device_data vehicle_location offline_access'
  const state = Math.random().toString(36).slice(2)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: scopes,
    state,
  })

  return NextResponse.redirect(
    `https://auth.tesla.com/oauth2/v3/authorize?${params}`
  )
}
