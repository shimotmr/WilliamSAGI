import { NextRequest, NextResponse } from 'next/server'

// Fleet API base URLs by region
const FLEET_API_BASE: Record<string, string> = {
  tw: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
  cn: 'https://fleet-api.prd.cn.vn.cloud.tesla.cn',
}

// Token endpoint MUST use fleet-auth domain (not auth.tesla.com)
// See: https://developer.tesla.com/docs/fleet-api/authentication/third-party-tokens
const TOKEN_ENDPOINT = 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const region = request.nextUrl.searchParams.get('region') || 'tw'

  if (!code) {
    return NextResponse.redirect(new URL('/hub/tesla?status=error&reason=no_code', request.url))
  }

  const clientId = process.env.TESLA_FLEET_CLIENT_ID
  const clientSecret = process.env.TESLA_FLEET_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/hub/tesla?status=error&reason=missing_credentials', request.url))
  }

  const audience = FLEET_API_BASE[region] || FLEET_API_BASE.tw

  // Exchange code for tokens
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: 'https://william-sagi.vercel.app/api/tesla/callback',
      audience,
    }),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    console.error('Tesla token exchange failed:', tokenRes.status, errText)
    const reason = encodeURIComponent(`token_exchange_${tokenRes.status}`)
    return NextResponse.redirect(new URL(`/hub/tesla?status=error&reason=${reason}&detail=${encodeURIComponent(errText.slice(0, 200))}`, request.url))
  }

  const tokens = await tokenRes.json()
  const expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600)

  // Update Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    const patchRes = await fetch(`${supabaseUrl}/rest/v1/tesla_tokens?region=eq.${region}`, {
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

    if (!patchRes.ok) {
      console.error('Supabase PATCH failed:', patchRes.status, await patchRes.text())
      // Fallback: INSERT if row doesn't exist
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

  return NextResponse.redirect(new URL('/hub/tesla?status=success', request.url))
}
