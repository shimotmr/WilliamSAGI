import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const region = request.nextUrl.searchParams.get('region') || 'tw'

  if (!code) {
    return NextResponse.redirect(new URL('/hub/tesla?status=error&reason=no_code', request.url))
  }

  const clientId = process.env.TESLA_FLEET_CLIENT_ID
  const clientSecret = process.env.TESLA_FLEET_CLIENT_SECRET

  if (!clientId) {
    return NextResponse.redirect(new URL('/hub/tesla?status=error&reason=missing_client_id', request.url))
  }

  // Build token exchange params
  const params: Record<string, string> = {
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: 'https://william-sagi.vercel.app/api/tesla/callback',
  }
  // Only include client_secret if available (supports both confidential and public clients)
  if (clientSecret) {
    params.client_secret = clientSecret
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://auth.tesla.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    console.error('Tesla token exchange failed:', tokenRes.status, errText)
    // Pass error detail to frontend for debugging
    const reason = encodeURIComponent(`token_exchange_${tokenRes.status}`)
    return NextResponse.redirect(new URL(`/hub/tesla?status=error&reason=${reason}&detail=${encodeURIComponent(errText.slice(0, 200))}`, request.url))
  }

  const tokens = await tokenRes.json()
  const expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600)

  // Upsert to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    // Use PATCH (update) instead of POST (upsert) for reliability
    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/tesla_tokens?region=eq.${region}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }),
    })

    if (!upsertRes.ok) {
      const errBody = await upsertRes.text()
      console.error('Supabase update failed:', upsertRes.status, errBody)
      // Fallback: try INSERT if row doesn't exist
      if (upsertRes.status === 404 || errBody.includes('0 rows')) {
        await fetch(`${supabaseUrl}/rest/v1/tesla_tokens`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            region,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          }),
        })
      }
    }
  }

  return NextResponse.redirect(new URL('/hub/tesla?status=success', request.url))
}
