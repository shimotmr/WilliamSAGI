import { NextRequest, NextResponse } from 'next/server'
import { signSession, authCookieName } from '@/lib/auth/session'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { SessionRole } from '@/features/auth/types'

const TENANT_ID = process.env.AZURE_AD_TENANT_ID!
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID!
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET!
const REDIRECT_URI = 'https://william-sagi.vercel.app/api/auth/callback/azure'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')
  const savedState = request.cookies.get('azure_oauth_state')?.value

  // Handle user denial or errors
  if (error) {
    const desc = searchParams.get('error_description') || '授權被取消'
    return NextResponse.redirect(
      new URL(`/portal/login?error=${encodeURIComponent(desc)}`, request.url)
    )
  }

  // Validate state for CSRF protection (skip if cookie missing - cross-site redirect may not carry it)
  if (savedState && state && state !== savedState) {
    return NextResponse.redirect(
      new URL('/portal/login?error=CSRF驗證失敗，請重新登入', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/portal/login?error=未收到授權碼', request.url)
    )
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
          scope: 'openid profile email User.Read',
        }),
      }
    )

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('Token exchange failed:', err)
      return NextResponse.redirect(
        new URL('/portal/login?error=Token交換失敗', request.url)
      )
    }

    const tokenData = await tokenRes.json()

    // Get user info from Graph API
    const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!meRes.ok) {
      return NextResponse.redirect(
        new URL('/portal/login?error=無法取得使用者資訊', request.url)
      )
    }

    const profile = await meRes.json()
    const email = (profile.mail || profile.userPrincipalName || '').toLowerCase()

    if (!email) {
      return NextResponse.redirect(
        new URL('/portal/login?error=無法取得Email', request.url)
      )
    }

    // Match employee in Supabase
    const supabase = getSupabaseServerClient()
    const emailPrefix = email.split('@')[0]

    const { data: employee } = await supabase
      .from('employees')
      .select('emp_code, name, email')
      .or(`emp_code.eq.${emailPrefix},email.ilike.${email}`)
      .single()

    if (!employee) {
      return NextResponse.redirect(
        new URL('/portal/login?error=此帳號未在系統中註冊', request.url)
      )
    }

    // Check allow_users for role
    const principal = employee.email || employee.emp_code
    const { data: allowUser } = await supabase
      .from('allow_users')
      .select('role')
      .or(
        `email.eq.${employee.emp_code},email.eq.${employee.email},email.eq.${employee.emp_code}@aurotek.com`
      )
      .single()

    const role: SessionRole = allowUser?.role === 'admin' ? 'admin' : 'user'

    // Sign session JWT
    const token = await signSession(principal, role)

    const response = NextResponse.redirect(
      new URL('/portal/dashboard', request.url)
    )
    response.cookies.set(authCookieName, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })
    // Clear oauth state cookie
    response.cookies.delete('azure_oauth_state')

    return response
  } catch (err) {
    console.error('Azure AD callback error:', err)
    return NextResponse.redirect(
      new URL('/portal/login?error=登入過程發生錯誤', request.url)
    )
  }
}
