import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const TENANT_ID = process.env.AZURE_AD_TENANT_ID!
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID!
const REDIRECT_URI = 'https://william-sagi.vercel.app/api/auth/callback/azure'

export async function GET() {
  const state = randomBytes(32).toString('hex')

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile email User.Read',
    state,
    response_mode: 'query',
  })

  const authorizeUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set('azure_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
