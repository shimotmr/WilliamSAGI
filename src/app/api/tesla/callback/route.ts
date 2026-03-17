import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const region = request.nextUrl.searchParams.get('region') || 'tw'

  if (!code) {
    return NextResponse.redirect(new URL('/hub/tesla?status=error&reason=no_code', request.url))
  }

  const clientId = process.env.TESLA_FLEET_CLIENT_ID!
  const clientSecret = process.env.TESLA_FLEET_CLIENT_SECRET!

  // Exchange code for tokens
  const tokenRes = await fetch('https://auth.tesla.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: 'https://william-sagi.vercel.app/api/tesla/callback',
    }),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    console.error('Tesla token exchange failed:', errText)
    return NextResponse.redirect(new URL('/hub/tesla?status=error&reason=token_exchange', request.url))
  }

  const tokens = await tokenRes.json()
  const expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600)

  // Upsert to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/tesla_tokens`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        region,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }),
    })

    if (!upsertRes.ok) {
      console.error('Supabase upsert failed:', await upsertRes.text())
    }
  }

  return NextResponse.redirect(new URL('/hub/tesla?status=success', request.url))
}
