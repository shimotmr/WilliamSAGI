import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

const OWNER_GITHUB_USERNAME = 'shimotmr'

// Service role client for admin operations
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Called after login to ensure user record exists
export async function POST() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }) } catch (e) {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch (e) {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const githubUsername = user.user_metadata?.user_name || ''
  const avatarUrl = user.user_metadata?.avatar_url || ''

  const serviceClient = getServiceClient()

  // Check if user record exists
  const { data: existing } = await serviceClient
    .from('travis_daily_users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Update avatar if changed
    await serviceClient
      .from('travis_daily_users')
      .update({ avatar_url: avatarUrl, github_username: githubUsername, updated_at: new Date().toISOString() })
      .eq('auth_user_id', user.id)
    return NextResponse.json({ role: existing.role })
  }

  // Create new user — owner if shimotmr, otherwise pending
  const role = githubUsername === OWNER_GITHUB_USERNAME ? 'owner' : 'pending'
  const { data: newUser, error } = await serviceClient
    .from('travis_daily_users')
    .insert({
      auth_user_id: user.id,
      github_username: githubUsername,
      avatar_url: avatarUrl,
      role,
    })
    .select('role')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ role: newUser.role })
}
