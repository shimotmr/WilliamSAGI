import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const OWNER_GITHUB_USERNAME = 'shimotmr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Sync user record to DB so middleware can check role immediately
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const serviceClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const githubUsername = user.user_metadata?.user_name || ''
        const avatarUrl = user.user_metadata?.avatar_url || ''

        const { data: existing } = await serviceClient
          .from('travis_daily_users')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (!existing) {
          const role = githubUsername === OWNER_GITHUB_USERNAME ? 'owner' : 'pending'
          await serviceClient.from('travis_daily_users').insert({
            auth_user_id: user.id,
            github_username: githubUsername,
            avatar_url: avatarUrl,
            role,
          })
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
